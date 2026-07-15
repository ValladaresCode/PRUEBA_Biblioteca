'use strict';

import mongoose from 'mongoose';

import { Book } from '../books/book.model.js';
import { Loan } from './loan.model.js';

/** Campos de Book seguros para poblar en respuestas de Loan (frontend). */
const BOOK_POPULATE = 'title author category available';

/**
 * Error de dominio con código HTTP. El controller lo traduce a la respuesta
 * común { success:false, message, errors } sin depender del errorHandler global
 * (que siempre responde 500).
 */
export class LoanHttpError extends Error {
  /**
   * @param {number} status
   * @param {string} message
   * @param {Array} [errors]
   */
  constructor(status, message, errors = []) {
    super(message);
    this.name = 'LoanHttpError';
    this.status = status;
    this.errors = errors;
  }
}

/**
 * Valida un id de MongoDB de 24 hex. Evita el falso positivo de
 * ObjectId.isValid con strings de 12 caracteres arbitrarios.
 * @param {unknown} id
 * @returns {boolean}
 */
export const isValidObjectId = (id) => {
  if (typeof id !== 'string' || id.length !== 24) {
    return false;
  }
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return false;
  }
  return String(new mongoose.Types.ObjectId(id)) === id;
};

/**
 * ¿dueDate es estrictamente posterior a "ahora"?
 * @param {Date|string} dueDate
 * @returns {boolean}
 */
export const isFutureDueDate = (dueDate) => {
  const date = dueDate instanceof Date ? dueDate : new Date(dueDate);
  if (Number.isNaN(date.getTime())) {
    return false;
  }
  return date.getTime() > Date.now();
};

/**
 * Detecta violación de índice único (doble préstamo ACTIVE).
 * @param {unknown} error
 * @returns {boolean}
 */
const isDuplicateKeyError = (error) =>
  Boolean(error && (error.code === 11000 || error.code === 11001));

/**
 * Lista préstamos con filtro opcional de status.
 * @param {{ status?: string }} [filters]
 */
export const listLoans = async (filters = {}) => {
  const query = {};

  if (filters.status === 'ACTIVE' || filters.status === 'RETURNED') {
    query.status = filters.status;
  }

  const items = await Loan.find(query)
    .populate('bookId', BOOK_POPULATE)
    .sort({ createdAt: -1 })
    .lean();

  return {
    items,
    total: items.length,
  };
};

/**
 * Crea un préstamo y reserva el libro de forma atómica condicionada.
 *
 * Algoritmo (sin transacciones de replica set):
 * 1. Reservar Book con findOneAndUpdate({ _id, available:true }, { available:false }).
 * 2. Si no hay documento: distinguir 404 (inexistente) vs 409 (no disponible).
 * 3. Crear Loan ACTIVE.
 * 4. Si falla la creación: compensar restaurando available=true.
 * 5. El índice único parcial en bookId+ACTIVE cubre carreras residuales → 409.
 *
 * @param {{ bookId: string, borrowerName: string, dueDate: string|Date, createdBy: string }} input
 */
export const createLoan = async (input) => {
  const { bookId, borrowerName, dueDate, createdBy } = input;

  if (!isValidObjectId(bookId)) {
    throw new LoanHttpError(400, 'bookId inválido', [
      { field: 'bookId', message: 'bookId debe ser un ObjectId válido' },
    ]);
  }

  const trimmedName =
    typeof borrowerName === 'string' ? borrowerName.trim() : '';
  if (!trimmedName) {
    throw new LoanHttpError(400, 'borrowerName es obligatorio', [
      { field: 'borrowerName', message: 'borrowerName no puede estar vacío' },
    ]);
  }

  if (!isFutureDueDate(dueDate)) {
    throw new LoanHttpError(400, 'dueDate debe ser una fecha futura', [
      {
        field: 'dueDate',
        message: 'dueDate debe ser posterior a la fecha actual',
      },
    ]);
  }

  if (!createdBy || typeof createdBy !== 'string') {
    throw new LoanHttpError(401, 'Usuario no autenticado');
  }

  // 1) Reserva atómica: solo un request gana si available=true.
  //    No se confía en available enviado por el cliente.
  const reservedBook = await Book.findOneAndUpdate(
    { _id: bookId, available: true },
    { $set: { available: false } },
    { new: true }
  );

  if (!reservedBook) {
    const exists = await Book.exists({ _id: bookId });
    if (!exists) {
      throw new LoanHttpError(404, 'Libro no encontrado');
    }
    throw new LoanHttpError(409, 'El libro no está disponible');
  }

  let loan;
  try {
    // 2) Crear préstamo. Campos internos no se leen del body del cliente.
    loan = await Loan.create({
      bookId,
      borrowerName: trimmedName,
      dueDate: new Date(dueDate),
      loanDate: new Date(),
      returnedAt: null,
      status: 'ACTIVE',
      createdBy,
    });
  } catch (error) {
    // 3a) Índice único parcial: ya existe Loan ACTIVE para este libro.
    //     available debe permanecer false (no compensar a true).
    if (isDuplicateKeyError(error)) {
      throw new LoanHttpError(409, 'El libro no está disponible');
    }

    // 3b) Otro fallo de creación: restaurar available=true (compensación).
    let restoreOk = false;
    try {
      await Book.updateOne({ _id: bookId }, { $set: { available: true } });
      restoreOk = true;
    } catch (restoreError) {
      console.error(
        'LoanService | Compensación fallida tras error al crear Loan:',
        {
          bookId,
          createError: error.message,
          restoreError: restoreError.message,
        }
      );
    }

    if (!restoreOk) {
      console.error(
        'LoanService | RIESGO: Book quedó available=false sin Loan ACTIVE',
        { bookId }
      );
      throw new LoanHttpError(
        500,
        'Error al crear el préstamo; la disponibilidad del libro puede requerir revisión manual',
        [{ field: 'bookId', message: 'Compensación de available incompleta' }]
      );
    }

    throw new LoanHttpError(500, 'Error al crear el préstamo');
  }

  // Poblar para el frontend sin alterar el campo base bookId en el schema.
  await loan.populate('bookId', BOOK_POPULATE);
  return loan;
};

/**
 * Devuelve un préstamo ACTIVE y libera el libro.
 *
 * Algoritmo:
 * 1. Actualizar atómicamente solo un Loan con status ACTIVE.
 * 2. Si no hay match: 404 si no existe, 409 si ya no está ACTIVE.
 * 3. Marcar Book.available = true.
 * 4. Si falla el update del Book: compensación segura (re-ACTIVE del Loan)
 *    y reporte de riesgo.
 *
 * @param {{ loanId: string }} input
 */
export const returnLoan = async (input) => {
  const { loanId } = input;

  if (!isValidObjectId(loanId)) {
    throw new LoanHttpError(400, 'loanId inválido', [
      { field: 'loanId', message: 'loanId debe ser un ObjectId válido' },
    ]);
  }

  const returnedAt = new Date();

  // 1) Solo un RETURN concurrente gana el filtro status=ACTIVE.
  const loan = await Loan.findOneAndUpdate(
    { _id: loanId, status: 'ACTIVE' },
    {
      $set: {
        status: 'RETURNED',
        returnedAt,
      },
    },
    { new: true }
  );

  if (!loan) {
    const existing = await Loan.findById(loanId).lean();
    if (!existing) {
      throw new LoanHttpError(404, 'Préstamo no encontrado');
    }
    throw new LoanHttpError(409, 'El préstamo no está activo');
  }

  // 2) Liberar el libro.
  try {
    const bookUpdate = await Book.updateOne(
      { _id: loan.bookId },
      { $set: { available: true } }
    );

    if (bookUpdate.matchedCount === 0) {
      // Libro borrado o id inválido en datos legacy: reportar riesgo.
      console.error(
        'LoanService | RIESGO: Loan marcado RETURNED pero Book no encontrado',
        { loanId, bookId: String(loan.bookId) }
      );
      // No se revierte el Loan: el préstamo sí se devolvió; el catálogo
      // requiere revisión manual del libro.
    }
  } catch (bookError) {
    // 3) Compensación: intentar reabrir el préstamo si el libro no se liberó.
    console.error(
      'LoanService | Fallo al liberar Book tras devolución; intentando compensación',
      { loanId, bookId: String(loan.bookId), error: bookError.message }
    );

    let compensated = false;
    try {
      const reverted = await Loan.findOneAndUpdate(
        { _id: loanId, status: 'RETURNED', returnedAt },
        { $set: { status: 'ACTIVE', returnedAt: null } },
        { new: true }
      );
      compensated = Boolean(reverted);
    } catch (compensateError) {
      console.error(
        'LoanService | RIESGO: no se pudo compensar Loan ni liberar Book',
        {
          loanId,
          bookId: String(loan.bookId),
          bookError: bookError.message,
          compensateError: compensateError.message,
        }
      );
    }

    if (compensated) {
      throw new LoanHttpError(
        500,
        'No se pudo actualizar la disponibilidad del libro; el préstamo permanece activo'
      );
    }

    throw new LoanHttpError(
      500,
      'Devolución inconsistente: préstamo marcado como devuelto pero el libro puede seguir no disponible. Requiere revisión manual',
      [
        {
          field: 'loanId',
          message: 'Compensación fallida; estado de Book/Loan en riesgo',
        },
      ]
    );
  }

  await loan.populate('bookId', BOOK_POPULATE);
  return loan;
};
