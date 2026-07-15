/**
 * Cliente de Books usado por la UI (S2-07).
 *
 * Contrato (docs/contracts.md § S2.6):
 *   listBooks, createBook, updateBook, deleteBook, getApiErrorMessage
 *
 * Integracion S2-10: el cliente HTTP real (S2-06) ya existe en
 * frontend/src/api. Se reexporta desde ahi para consumir el Servicio Library
 * real con el JWT adjunto por el interceptor de axios. El mock local
 * (books.api.mock.js) queda solo como apoyo de desarrollo, no se usa en runtime.
 */

export {
  listBooks,
  createBook,
  updateBook,
  deleteBook,
} from '../../api/library.api.js';

export { getApiErrorMessage } from '../../api/api-error.js';
