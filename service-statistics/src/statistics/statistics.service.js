'use strict';

const LATEST_BOOKS_LIMIT = 5;
const LIBRARY_TIMEOUT_MS = 5000;

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
 * Helper HTTP robusto para consultar endpoints del Servicio Library.
 */
const fetchFromLibrary = async (path, authorization = null) => {
  const baseUrl = process.env.SERVICE_LIBRARY_URL;

  if (!baseUrl) {
    throw new LibraryUnavailableError('Falta la variable de entorno SERVICE_LIBRARY_URL');
  }

  const headers = {};
  if (authorization) {
    headers['Authorization'] = authorization;
  }

  let response;
  try {
    // AbortSignal.timeout aborta la petición si Library tarda demasiado.
    response = await fetch(`${baseUrl}${path}`, {
      headers,
      signal: AbortSignal.timeout(LIBRARY_TIMEOUT_MS),
    });
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

  // Library puede responder 200 pero con un contrato inválido; en ese caso
  // tratamos la dependencia como no disponible (503)
  if (body?.success !== true || typeof body?.data !== 'object' || body.data === null) {
    throw new LibraryUnavailableError('El Servicio Library devolvió una respuesta con formato inválido');
  }

  if (!Array.isArray(body.data.items)) {
    throw new LibraryUnavailableError('El Servicio Library no devolvió una lista válida de items');
  }

  return body.data.items;
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
  const items = await fetchFromLibrary('/api/v1/books');
  return buildSummary(items);
};

export const getLibraryStatistics = async (authorization) => {
  const [books, loans] = await Promise.all([
    fetchFromLibrary('/api/v1/books', authorization),
    fetchFromLibrary('/api/v1/loans', authorization)
  ]);

  const totalBooks = books.length;
  const availableBooks = books.filter((book) => book.available === true).length;
  const totalLoans = loans.length;
  const activeLoans = loans.filter((loan) => loan.status === 'ACTIVE').length;
  const returnedLoans = loans.filter((loan) => loan.status === 'RETURNED').length;

  return {
    totalBooks,
    availableBooks,
    totalLoans,
    activeLoans,
    returnedLoans,
  };
};
