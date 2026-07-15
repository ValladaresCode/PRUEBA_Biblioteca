/**
 * Adaptador del cliente Library para Loans (S2-08).
 *
 * Contratos esperados (docs/contracts.md / S2-06):
 *   listBooks, listLoans, createLoan, returnLoan, getApiErrorMessage
 *
 * S2-06 aún no está en esta rama (frontend/src/api/** está fuera de alcance).
 * Este módulo replica solo las firmas necesarias para la UI de préstamos.
 * Cuando el cliente compartido exista, la integración puede reexportar desde
 * `../../api/*` sin cambiar los componentes.
 */
import axios from 'axios'
import useAuthStore from '../../store/auth.store.js'

const libraryApi = axios.create({
  baseURL: import.meta.env.VITE_LIBRARY_API_URL,
  headers: { 'Content-Type': 'application/json' },
})

libraryApi.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

/**
 * Extrae un mensaje legible de errores Axios / respuestas de API.
 * @param {unknown} err
 * @param {string} [fallback]
 * @returns {string}
 */
export function getApiErrorMessage(err, fallback = 'Error de conexión con el servidor.') {
  if (!err) return fallback

  const response = err.response
  const data = response?.data

  if (data?.errors?.length) {
    const first = data.errors[0]
    if (typeof first === 'string') return first
    if (first?.message) return first.message
  }

  if (typeof data?.message === 'string' && data.message.trim()) {
    return data.message
  }

  if (response?.status === 401) {
    return data?.message || 'Sesión no válida o expirada. Vuelve a iniciar sesión.'
  }

  if (response?.status === 403) {
    return data?.message || 'No tienes permisos para esta acción.'
  }

  if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
    return 'No se pudo conectar con el servidor de biblioteca.'
  }

  if (typeof err.message === 'string' && err.message.trim()) {
    return err.message
  }

  return fallback
}

/**
 * GET /books
 * @param {Record<string, string>} [filters]
 * @returns {Promise<{ success: boolean, message?: string, data?: { items: unknown[], total: number } }>}
 */
export async function listBooks(filters = {}) {
  const { data } = await libraryApi.get('/books', { params: filters })
  return data
}

/**
 * GET /loans?status=
 * @param {string} [status] ACTIVE | RETURNED | undefined (todos)
 */
export async function listLoans(status) {
  const params = status ? { status } : {}
  const { data } = await libraryApi.get('/loans', { params })
  return data
}

/**
 * POST /loans
 * @param {{ bookId: string, borrowerName: string, dueDate: string }} payload
 */
export async function createLoan(payload) {
  const { data } = await libraryApi.post('/loans', {
    bookId: payload.bookId,
    borrowerName: payload.borrowerName,
    dueDate: payload.dueDate,
  })
  return data
}

/**
 * POST /returns
 * @param {string} loanId
 */
export async function returnLoan(loanId) {
  const { data } = await libraryApi.post('/returns', { loanId })
  return data
}
