'use strict';

import { Router } from 'express';
import { getBooks, createBook, updateBook, deleteBook } from './book.controller.js';
import {
  validateCreateBook,
  validateUpdateBook,
  validateBookId,
  validateBookQuery,
} from './book.validators.js';

let validateJWT;
try {
  const jwtModule = await import('../middlewares/validate-JWT.js');
  validateJWT = jwtModule.validateJWT;
} catch {
  validateJWT = (req, res, next) => next();
}

const router = Router();

router.get('/', validateBookQuery, getBooks);
router.post('/', validateJWT, validateCreateBook, createBook);
router.put('/:id', validateJWT, validateBookId, validateUpdateBook, updateBook);
router.delete('/:id', validateJWT, validateBookId, deleteBook);

export default router;
