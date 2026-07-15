'use strict';

import { Router } from 'express';
import { getBooks } from './book.controller.js';

const router = Router();

// GET /api/v1/books  ->  lista de libros desde MongoDB
router.get('/', getBooks);

export default router;
