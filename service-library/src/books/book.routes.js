'use strict';

import { Router } from 'express';
import { getBooks, createBook, updateBook, deleteBook } from './book.controller.js';
import {
  validateCreateBook,
  validateUpdateBook,
  validateBookId,
  validateBookQuery,
} from './book.validators.js';
// Integracion S2-10: se importan estaticamente los middlewares compartidos
// (validate-jwt / require-role). El import dinamico previo apuntaba a una ruta
// y mayusculas inexistentes y caia silenciosamente a un no-op, dejando las
// mutaciones sin proteccion. Segun contracts.md, POST/PUT/DELETE exigen JWT y
// LIBRARIAN_ROLE; GET permanece publico.
import { validateJWT } from '../../middlewares/validate-jwt.js';
import { requireRole } from '../../middlewares/require-role.js';

const LIBRARIAN_ROLE = 'LIBRARIAN_ROLE';

const router = Router();

router.get('/', validateBookQuery, getBooks);
router.post('/', validateJWT, requireRole(LIBRARIAN_ROLE), validateCreateBook, createBook);
router.put('/:id', validateJWT, requireRole(LIBRARIAN_ROLE), validateBookId, validateUpdateBook, updateBook);
router.delete('/:id', validateJWT, requireRole(LIBRARIAN_ROLE), validateBookId, deleteBook);

export default router;
