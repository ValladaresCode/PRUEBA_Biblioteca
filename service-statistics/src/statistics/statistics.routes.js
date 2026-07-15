'use strict';

import { Router } from 'express';
import { getSummary, getStatistics } from './statistics.controller.js';
// Integracion S2-10: se aplica validateJWT unicamente a /statistics.
// /summary permanece publico (contrato Sprint 1).
import { validateJWT } from '../../middlewares/validate-jwt.js';

const router = Router();

// GET /api/v1/summary  ->  resumen calculado a partir del Servicio Library (publico)
router.get('/summary', getSummary);

// GET /api/v1/statistics -> estadísticas reales protegidas con JWT
router.get('/statistics', validateJWT, getStatistics);

export default router;
