/**
 * Utilidades de presentación para préstamos.
 */

/**
 * Título del libro desde un Loan (bookId poblado o id crudo).
 * @param {object} loan
 * @returns {string}
 */
export function getLoanBookTitle(loan) {
  const book = loan?.bookId

  if (book && typeof book === 'object') {
    if (typeof book.title === 'string' && book.title.trim()) {
      return book.title.trim()
    }
    return 'Libro sin título'
  }

  if (typeof book === 'string' && book.length > 0) {
    const short = book.length > 8 ? book.slice(-8) : book
    return `Libro (id …${short})`
  }

  return 'Libro no identificado'
}

/**
 * Subtítulo autor/categoría si el libro está poblado.
 * @param {object} loan
 * @returns {string}
 */
export function getLoanBookSubtitle(loan) {
  const book = loan?.bookId
  if (!book || typeof book !== 'object') return ''
  const parts = [book.author, book.category].filter(
    (v) => typeof v === 'string' && v.trim(),
  )
  return parts.join(' · ')
}

/**
 * Mínima fecha de dueDate en input type=date: mañana (YYYY-MM-DD).
 * Bloqueo de UI; el servidor sigue validando dueDate futura.
 * @returns {string}
 */
export function getMinDueDateInputValue() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  d.setHours(0, 0, 0, 0)
  return formatDateInput(d)
}

/**
 * @param {Date} date
 * @returns {string} YYYY-MM-DD
 */
export function formatDateInput(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Convierte valor de input date a ISO para el API (fin del día local → UTC ISO).
 * Usamos mediodía local para evitar desfaces de zona horaria al parsear YYYY-MM-DD.
 * @param {string} dateInput YYYY-MM-DD
 * @returns {string} ISO string
 */
export function dueDateInputToIso(dateInput) {
  const [y, m, d] = dateInput.split('-').map(Number)
  const local = new Date(y, m - 1, d, 12, 0, 0, 0)
  return local.toISOString()
}

/**
 * ¿La fecha del input es estrictamente posterior a hoy (calendario local)?
 * @param {string} dateInput YYYY-MM-DD
 * @returns {boolean}
 */
export function isDueDateInputFuture(dateInput) {
  if (!dateInput || !/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) return false
  const [y, m, d] = dateInput.split('-').map(Number)
  const due = new Date(y, m - 1, d, 12, 0, 0, 0)
  const now = new Date()
  return due.getTime() > now.getTime()
}

/**
 * Formatea una fecha ISO para mostrar.
 * @param {string|Date|null|undefined} value
 * @returns {string}
 */
export function formatDisplayDate(value) {
  if (!value) return '—'
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('es-GT', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Normaliza items de una respuesta Library parcial o completa.
 * @param {unknown} data
 * @returns {unknown[]}
 */
export function extractItems(data) {
  if (!data || typeof data !== 'object') return []
  if (Array.isArray(data.items)) return data.items
  if (Array.isArray(data.data?.items)) return data.data.items
  if (Array.isArray(data)) return data
  return []
}
