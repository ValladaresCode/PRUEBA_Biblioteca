/**
 * Mock local temporal de Books (S2-07).
 *
 * S2-06 aún no expone listBooks / createBook / updateBook / deleteBook /
 * getApiErrorMessage en frontend/src/api. Este módulo simula el contrato
 * axios-like para desarrollar y compilar la UI.
 *
 * NO es prueba final de integración. Sustituir el import en booksClient.js
 * cuando el cliente HTTP real esté disponible.
 */

const SEED = [
  {
    _id: 'mock-book-1',
    title: 'Cien años de soledad',
    author: 'Gabriel García Márquez',
    category: 'Novela',
    year: 1967,
    available: true,
    createdAt: '2026-01-10T10:00:00.000Z',
    updatedAt: '2026-01-10T10:00:00.000Z',
  },
  {
    _id: 'mock-book-2',
    title: 'Clean Code',
    author: 'Robert C. Martin',
    category: 'Programación',
    year: 2008,
    available: true,
    createdAt: '2026-01-11T10:00:00.000Z',
    updatedAt: '2026-01-11T10:00:00.000Z',
  },
  {
    _id: 'mock-book-3',
    title: 'El principito',
    author: 'Antoine de Saint-Exupéry',
    category: 'Infantil',
    year: 1943,
    available: false,
    createdAt: '2026-01-12T10:00:00.000Z',
    updatedAt: '2026-01-12T10:00:00.000Z',
    /** Simula préstamo activo → DELETE responde 409 */
    _hasActiveLoan: true,
  },
]

let books = structuredClone(SEED)
let seq = 4

function delay(ms = 280) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function matches(value, query) {
  if (!query || !String(query).trim()) return true
  return String(value ?? '')
    .toLowerCase()
    .includes(String(query).trim().toLowerCase())
}

function axiosError(status, message, errors = []) {
  const error = new Error(message)
  error.response = {
    status,
    data: {
      success: false,
      message,
      ...(errors.length ? { errors } : {}),
    },
  }
  return error
}

function validatePayload(payload, { partial = false } = {}) {
  const errors = []
  const title = payload?.title
  const author = payload?.author
  const category = payload?.category
  const year = payload?.year

  if (!partial || title !== undefined) {
    if (!title || !String(title).trim()) {
      errors.push({ field: 'title', message: 'El título es obligatorio' })
    }
  }
  if (!partial || author !== undefined) {
    if (!author || !String(author).trim()) {
      errors.push({ field: 'author', message: 'El autor es obligatorio' })
    }
  }
  if (!partial || category !== undefined) {
    if (!category || !String(category).trim()) {
      errors.push({ field: 'category', message: 'La categoría es obligatoria' })
    }
  }
  if (!partial || year !== undefined) {
    const y = Number(year)
    if (year === undefined || year === null || year === '' || Number.isNaN(y) || !Number.isInteger(y)) {
      errors.push({ field: 'year', message: 'El año debe ser un número entero' })
    } else if (y < 1000 || y > 2100) {
      errors.push({ field: 'year', message: 'El año debe estar entre 1000 y 2100' })
    }
  }

  if (Object.prototype.hasOwnProperty.call(payload ?? {}, 'available')) {
    errors.push({ field: 'available', message: 'No se puede modificar available desde el cliente' })
  }

  return errors
}

export function getApiErrorMessage(error) {
  const data = error?.response?.data
  if (Array.isArray(data?.errors) && data.errors.length > 0) {
    const first = data.errors[0]
    if (typeof first === 'string') return first
    if (first?.message) return first.message
  }
  if (data?.message) return data.message
  if (error?.message) return error.message
  return 'Error de conexión con el servidor.'
}

export async function listBooks(filters = {}) {
  await delay()
  const items = books.filter(
    (b) =>
      matches(b.title, filters.title) &&
      matches(b.author, filters.author) &&
      matches(b.category, filters.category),
  )
  return {
    data: {
      success: true,
      message: 'Libros obtenidos correctamente',
      data: {
        items: items.map(toPublicBook),
        total: items.length,
      },
    },
  }
}

function toPublicBook(book) {
  return {
    _id: book._id,
    title: book.title,
    author: book.author,
    category: book.category,
    year: book.year,
    available: book.available,
    createdAt: book.createdAt,
    updatedAt: book.updatedAt,
  }
}

export async function createBook(payload) {
  await delay()
  const errors = validatePayload(payload)
  if (errors.length) {
    throw axiosError(400, 'Error de validación', errors)
  }

  const now = new Date().toISOString()
  const book = {
    _id: `mock-book-${seq++}`,
    title: String(payload.title).trim(),
    author: String(payload.author).trim(),
    category: String(payload.category).trim(),
    year: Number(payload.year),
    available: true,
    createdAt: now,
    updatedAt: now,
  }
  books = [book, ...books]
  return {
    data: {
      success: true,
      message: 'Libro creado correctamente',
      data: book,
    },
  }
}

export async function updateBook(id, payload) {
  await delay()
  const index = books.findIndex((b) => b._id === id)
  if (index === -1) {
    throw axiosError(404, 'Libro no encontrado')
  }

  const errors = validatePayload(payload, { partial: false })
  if (errors.length) {
    throw axiosError(400, 'Error de validación', errors)
  }

  const prev = books[index]
  const updated = {
    ...prev,
    title: String(payload.title).trim(),
    author: String(payload.author).trim(),
    category: String(payload.category).trim(),
    year: Number(payload.year),
    available: prev.available,
    updatedAt: new Date().toISOString(),
  }
  books = books.map((b, i) => (i === index ? updated : b))

  return {
    data: {
      success: true,
      message: 'Libro actualizado correctamente',
      data: toPublicBook(updated),
    },
  }
}

export async function deleteBook(id) {
  await delay()
  const book = books.find((b) => b._id === id)
  if (!book) {
    throw axiosError(404, 'Libro no encontrado')
  }
  if (book._hasActiveLoan || book.available === false) {
    // El mock simula 409 cuando hay préstamo activo (available false en seed).
    if (book._hasActiveLoan) {
      throw axiosError(409, 'No se puede eliminar un libro con un préstamo activo')
    }
  }
  books = books.filter((b) => b._id !== id)
  return {
    data: {
      success: true,
      message: 'Libro eliminado correctamente',
      data: null,
    },
  }
}

/** Solo para pruebas locales: reinicia el catálogo mock. */
export function __resetMockBooks() {
  books = structuredClone(SEED)
  seq = 4
}
