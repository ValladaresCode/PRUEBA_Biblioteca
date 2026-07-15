import { useState } from 'react'
import { Spinner } from '../../components/Spinner.jsx'
import {
  dueDateInputToIso,
  getMinDueDateInputValue,
  isDueDateInputFuture,
} from './utils.js'

/**
 * Formulario para registrar un préstamo.
 * Solo ofrece libros con available=true.
 */
export default function LoanCreateForm({
  availableBooks,
  submitting,
  disabled,
  onSubmit,
}) {
  const [bookId, setBookId] = useState('')
  const [borrowerName, setBorrowerName] = useState('')
  const [dueDate, setDueDate] = useState(getMinDueDateInputValue())
  const [fieldError, setFieldError] = useState('')

  const minDue = getMinDueDateInputValue()
  const noBooks = !availableBooks || availableBooks.length === 0
  const formDisabled = disabled || submitting || noBooks

  async function handleSubmit(e) {
    e.preventDefault()
    setFieldError('')

    if (noBooks) {
      setFieldError('No hay libros disponibles para prestar.')
      return
    }

    if (!bookId) {
      setFieldError('Selecciona un libro disponible.')
      return
    }

    const name = borrowerName.trim()
    if (!name) {
      setFieldError('El nombre del prestatario es obligatorio.')
      return
    }

    if (!isDueDateInputFuture(dueDate)) {
      setFieldError('La fecha de devolución debe ser posterior a hoy.')
      return
    }

    const result = await onSubmit({
      bookId,
      borrowerName: name,
      dueDate: dueDateInputToIso(dueDate),
    })

    if (result?.ok) {
      setBookId('')
      setBorrowerName('')
      setDueDate(getMinDueDateInputValue())
      setFieldError('')
    }
  }

  return (
    <section className="bg-surface border border-border rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-serif font-bold text-text mb-1">Nuevo préstamo</h2>
      <p className="text-sm text-text-muted mb-5">
        Solo se listan libros disponibles. La fecha límite debe ser futura.
      </p>

      {noBooks && (
        <div className="bg-red-50 border border-error rounded-md px-4 py-3 text-sm text-error mb-4">
          No hay libros disponibles en este momento.
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label htmlFor="loan-book" className="block text-sm font-medium text-text mb-1.5">
            Libro
          </label>
          <select
            id="loan-book"
            name="bookId"
            value={bookId}
            onChange={(e) => setBookId(e.target.value)}
            disabled={formDisabled}
            className="w-full rounded-md border border-border bg-surface px-4 py-2.5 text-sm text-text focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <option value="">Selecciona un libro…</option>
            {availableBooks.map((book) => (
              <option key={book._id} value={book._id}>
                {book.title}
                {book.author ? ` — ${book.author}` : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="loan-borrower" className="block text-sm font-medium text-text mb-1.5">
            Prestatario
          </label>
          <input
            id="loan-borrower"
            name="borrowerName"
            type="text"
            autoComplete="name"
            value={borrowerName}
            onChange={(e) => setBorrowerName(e.target.value)}
            placeholder="Ana López"
            disabled={formDisabled}
            className="w-full rounded-md border border-border bg-surface px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
          />
        </div>

        <div>
          <label htmlFor="loan-due" className="block text-sm font-medium text-text mb-1.5">
            Fecha límite de devolución
          </label>
          <input
            id="loan-due"
            name="dueDate"
            type="date"
            min={minDue}
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            disabled={formDisabled}
            className="w-full rounded-md border border-border bg-surface px-4 py-2.5 text-sm text-text focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
          />
          <p className="text-xs text-text-muted mt-1">
            No se permiten fechas de hoy o anteriores (el servidor también lo valida).
          </p>
        </div>

        {fieldError && (
          <div className="bg-red-50 border border-error rounded-md px-4 py-3 text-sm text-error">
            {fieldError}
          </div>
        )}

        <button
          type="submit"
          disabled={formDisabled}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-primary text-white px-6 py-2.5 text-sm font-medium hover:bg-primary-hover transition-colors duration-150 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting && <Spinner className="w-4 h-4" />}
          {submitting ? 'Registrando…' : 'Registrar préstamo'}
        </button>
      </form>
    </section>
  )
}
