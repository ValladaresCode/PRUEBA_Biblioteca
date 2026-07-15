'use strict';

import { Router } from 'express';
import { getSummary } from './statistics.controller.js';

const router = Router();

// GET /api/v1/summary  ->  resumen calculado a partir del Servicio Library
router.get('/summary', getSummary);

export default router;
