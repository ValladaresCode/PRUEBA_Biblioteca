'use strict';

import { isFutureDueDate, isValidObjectId } from './loan.service.js';

/**
 * Validadores y gates de autorización del módulo Loans.
 *
 * No se usa express-validator (no está en las dependencias de service-library
 * y package.json está fuera del alcance de S2-03). Validación manual con el
 * formato de error común de contracts.md.
 */

/**
 * Exige rol LIBRARIAN_ROLE (POST /loans y POST /returns).
 * Debe ejecutarse después de validateJWT (o del shim que inyecta req.userRole).
 */
export const requireLibrarianRole = (req, res, next) => {
  if (req.userRole !== 'LIBRARIAN_ROLE') {
    return res.status(403).json({
      success: false,
      message: 'No tienes permisos para esta acción',
      errors: [],
    });
  }
  return next();
};

/**
 * GET /loans — filtro opcional status=ACTIVE|RETURNED.
 */
export const validateListLoans = (req, res, next) => {
  const { status } = req.query;

  if (status !== undefined && status !== '' && status !== null) {
    if (status !== 'ACTIVE' && status !== 'RETURNED') {
      return res.status(400).json({
        success: false,
        message: 'Parámetro status inválido',
        errors: [
          {
            field: 'status',
            message: 'status debe ser ACTIVE o RETURNED',
          },
        ],
      });
    }
  }

  return next();
};

/**
 * POST /loans — body permitido: bookId, borrowerName, dueDate.
 * Se ignoran (no se aceptan como fuente de verdad) loanDate, returnedAt,
 * status y createdBy aunque vengan en el body (anti mass-assignment).
 */
export const validateCreateLoan = (req, res, next) => {
  const errors = [];
  const body = req.body && typeof req.body === 'object' ? req.body : {};

  const { bookId, borrowerName, dueDate } = body;

  if (bookId === undefined || bookId === null || bookId === '') {
    errors.push({ field: 'bookId', message: 'bookId es obligatorio' });
  } else if (typeof bookId !== 'string' || !isValidObjectId(bookId)) {
    errors.push({
      field: 'bookId',
      message: 'bookId debe ser un ObjectId válido',
    });
  }

  if (borrowerName === undefined || borrowerName === null) {
    errors.push({
      field: 'borrowerName',
      message: 'borrowerName es obligatorio',
    });
  } else if (typeof borrowerName !== 'string' || !borrowerName.trim()) {
    errors.push({
      field: 'borrowerName',
      message: 'borrowerName no puede estar vacío',
    });
  }

  if (dueDate === undefined || dueDate === null || dueDate === '') {
    errors.push({ field: 'dueDate', message: 'dueDate es obligatoria' });
  } else {
    const parsed = new Date(dueDate);
    if (Number.isNaN(parsed.getTime())) {
      errors.push({
        field: 'dueDate',
        message: 'dueDate no tiene un formato de fecha válido',
      });
    } else if (!isFutureDueDate(parsed)) {
      errors.push({
        field: 'dueDate',
        message: 'dueDate debe ser posterior a la fecha actual',
      });
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Los datos enviados no son válidos',
      errors,
    });
  }

  // Normalizar solo campos permitidos; nunca copiar status/loanDate/etc.
  req.loanInput = {
    bookId: String(bookId),
    borrowerName: String(borrowerName).trim(),
    dueDate: new Date(dueDate),
  };

  return next();
};

/**
 * POST /returns — body: { loanId }.
 */
export const validateReturnLoan = (req, res, next) => {
  const errors = [];
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const { loanId } = body;

  if (loanId === undefined || loanId === null || loanId === '') {
    errors.push({ field: 'loanId', message: 'loanId es obligatorio' });
  } else if (typeof loanId !== 'string' || !isValidObjectId(loanId)) {
    errors.push({
      field: 'loanId',
      message: 'loanId debe ser un ObjectId válido',
    });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Los datos enviados no son válidos',
      errors,
    });
  }

  req.returnInput = { loanId: String(loanId) };
  return next();
};
