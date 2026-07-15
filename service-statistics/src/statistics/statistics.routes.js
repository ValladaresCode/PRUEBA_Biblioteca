'use strict';

import { Router } from 'express';
import { getSummary, getStatistics } from './statistics.controller.js';

const router = Router();

// GET /api/v1/summary  ->  resumen calculado a partir del Servicio Library
router.get('/summary', getSummary);

// GET /api/v1/statistics -> estadísticas reales protegidas
router.get('/statistics', getStatistics);

export default router;
