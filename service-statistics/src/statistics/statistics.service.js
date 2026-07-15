'use strict';

const BOOKS_PATH = '/api/v1/books';
const LATEST_BOOKS_LIMIT = 5;

/**
 * Error dedicado para fallas al consultar el Servicio Library, de forma que
 * el error handler central pueda responder 503 sin exponer detalles internos.
 */
export class LibraryUnavailableError extends Error {
  constructor(message) {
    super(message);
    this.name = 'LibraryUnavailableError';
    this.statusCode = 503;
  }
}

/**
 * Consulta GET /api/v1/books en el Servicio Library usando fetch nativo y
 * devuelve la lista de libros (data.items). Toda la lógica HTTP externa vive
 * aquí, no en el controller.
 */
const fetchBooksFromLibrary = async () => {
  const baseUrl = process.env.SERVICE_LIBRARY_URL;

  if (!baseUrl) {
    throw new LibraryUnavailableError('Falta la variable de entorno SERVICE_LIBRARY_URL');
  }

  let response;
  try {
    response = await fetch(`${baseUrl}${BOOKS_PATH}`);
  } catch {
    throw new LibraryUnavailableError('No se pudo conectar con el Servicio Library');
  }

  if (!response.ok) {
    throw new LibraryUnavailableError(
      `El Servicio Library respondió con estado ${response.status}`
    );
  }

  let body;
  try {
    body = await response.json();
  } catch {
    throw new LibraryUnavailableError('La respuesta del Servicio Library no es un JSON válido');
  }

  return body?.data?.items ?? [];
};

/**
 * Calcula el resumen propio a partir de los libros obtenidos de Library:
 * total, disponibles, categorías únicas y los últimos libros agregados.
 */
const buildSummary = (items) => {
  const totalBooks = items.length;
  const availableBooks = items.filter((book) => book.available === true).length;
  const categories = new Set(items.map((book) => book.category)).size;

  const latestBooks = [...items]
    .sort((a, b) => new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0))
    .slice(0, LATEST_BOOKS_LIMIT);

  return { totalBooks, availableBooks, categories, latestBooks };
};

export const getLibrarySummary = async () => {
  const items = await fetchBooksFromLibrary();
  return buildSummary(items);
};
