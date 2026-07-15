'use strict';

import { Router } from 'express';

import { getLoans, postLoan, postReturn } from './loan.controller.js';
import {
  requireLibrarianRole,
  validateCreateLoan,
  validateListLoans,
  validateReturnLoan,
} from './loan.validators.js';

/**
 * Resuelve validateJWT de S2-01 si ya existe el middleware en el repo.
 * Si aún no está (módulo no montado / archivo pendiente de integración),
 * usa un shim que exige req.userId ya inyectado (p. ej. por un harness).
 *
 * No se implementa la verificación criptográfica del JWT aquí: eso es S2-01
 * y middlewares/** está fuera del alcance de S2-03.
 */
const loadValidateJWT = async () => {
  try {
    const mod = await import('../../middlewares/validate-jwt.js');
    if (typeof mod.validateJWT === 'function') {
      return mod.validateJWT;
    }
  } catch {
    // Middleware aún no disponible en esta rama.
  }

  return (req, res, next) => {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: 'No hay token en la petición',
        errors: [],
      });
    }
    return next();
  };
};

const validateJWT = await loadValidateJWT();

/**
 * Router de préstamos — montaje de integración (fuera de este alcance):
 *   app.use('/api/v1/loans', loanRoutes);
 *
 * Contratos:
 *   GET  /api/v1/loans
 *   POST /api/v1/loans
 */
const loanRoutes = Router();

loanRoutes.get('/', validateJWT, validateListLoans, getLoans);
loanRoutes.post(
  '/',
  validateJWT,
  requireLibrarianRole,
  validateCreateLoan,
  postLoan
);

/**
 * Router de devoluciones — montaje de integración:
 *   app.use('/api/v1/returns', returnRoutes);
 *
 * Contrato:
 *   POST /api/v1/returns
 */
export const returnRoutes = Router();
returnRoutes.post(
  '/',
  validateJWT,
  requireLibrarianRole,
  validateReturnLoan,
  postReturn
);

export default loanRoutes;
