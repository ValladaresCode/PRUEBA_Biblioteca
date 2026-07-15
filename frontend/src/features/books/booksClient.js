/**
 * Cliente de Books usado por la UI (S2-07).
 *
 * Contrato (docs/contracts.md § S2.6):
 *   listBooks, createBook, updateBook, deleteBook, getApiErrorMessage
 *
 * Mientras S2-06 no integre el cliente en frontend/src/api, se reexporta
 * el mock local. Cuando exista el módulo real, cambiar solo este archivo:
 *
 *   export {
 *     listBooks,
 *     createBook,
 *     updateBook,
 *     deleteBook,
 *     getApiErrorMessage,
 *   } from '../../api/books.api.js'
 */

export {
  listBooks,
  createBook,
  updateBook,
  deleteBook,
  getApiErrorMessage,
} from './books.api.mock.js'
