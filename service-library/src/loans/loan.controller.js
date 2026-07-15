'use strict';

import {
  LoanHttpError,
  createLoan,
  listLoans,
  returnLoan,
} from './loan.service.js';

/**
 * Traduce errores de dominio a la respuesta común de contracts.md.
 * Los errores inesperados se delegan al errorHandler de app.js vía next(err).
 */
const handleDomainError = (error, res, next) => {
  if (error instanceof LoanHttpError) {
    return res.status(error.status).json({
      success: false,
      message: error.message,
      errors: error.errors ?? [],
    });
  }
  return next(error);
};

/**
 * GET /api/v1/loans
 * JWT requerido (middleware en routes).
 * Filtro opcional: ?status=ACTIVE|RETURNED
 */
export const getLoans = async (req, res, next) => {
  try {
    const status =
      typeof req.query.status === 'string' ? req.query.status : undefined;

    const data = await listLoans({ status });

    return res.status(200).json({
      success: true,
      message: 'Préstamos obtenidos correctamente',
      data,
    });
  } catch (error) {
    return handleDomainError(error, res, next);
  }
};

/**
 * POST /api/v1/loans
 * JWT + LIBRARIAN_ROLE.
 * Body permitido: bookId, borrowerName, dueDate.
 * createdBy se toma de req.userId; status/loanDate/returnedAt son del sistema.
 */
export const postLoan = async (req, res, next) => {
  try {
    const input = req.loanInput ?? {
      bookId: req.body?.bookId,
      borrowerName: req.body?.borrowerName,
      dueDate: req.body?.dueDate,
    };

    const loan = await createLoan({
      ...input,
      createdBy: req.userId,
    });

    return res.status(201).json({
      success: true,
      message: 'Préstamo registrado correctamente',
      data: { loan },
    });
  } catch (error) {
    return handleDomainError(error, res, next);
  }
};

/**
 * POST /api/v1/returns
 * JWT + LIBRARIAN_ROLE.
 * Body: { loanId }
 */
export const postReturn = async (req, res, next) => {
  try {
    const input = req.returnInput ?? { loanId: req.body?.loanId };

    const loan = await returnLoan(input);

    return res.status(200).json({
      success: true,
      message: 'Devolución registrada correctamente',
      data: { loan },
    });
  } catch (error) {
    return handleDomainError(error, res, next);
  }
};
