import { useState } from 'react'
import { Spinner } from '../../components/Spinner.jsx'

const EMPTY = { title: '', author: '', category: '', year: '' }

function buildInitialForm(mode, initialBook) {
  if (mode === 'edit' && initialBook) {
    return {
      title: initialBook.title ?? '',
      author: initialBook.author ?? '',
      category: initialBook.category ?? '',
      year: initialBook.year != null ? String(initialBook.year) : '',
    }
  }
  return { ...EMPTY }
}

/**
 * Formulario único reutilizable para crear y editar libros.
 * Campos editables: title, author, category, year.
 * No incluye control de available (solo lectura en la lista).
 * El padre debe remountar con `key` al cambiar de modo/libro.
 */
export default function BookForm({
  mode = 'create',
  initialBook = null,
  onSubmit,
  onCancel,
  submitting = false,
}) {
  const [form, setForm] = useState(() => buildInitialForm(mode, initialBook))
  const [fieldError, setFieldError] = useState('')

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function validateLocal() {
    if (!form.title.trim() || !form.author.trim() || !form.category.trim()) {
      return 'Todos los campos son obligatorios.'
    }
    const yearNum = Number(form.year)
    if (
      form.year === '' ||
      Number.isNaN(yearNum) ||
      !Number.isInteger(yearNum) ||
      yearNum < 1000 ||
      yearNum > 2100
    ) {
      return 'El año debe ser un número entero entre 1000 y 2100.'
    }
    return ''
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFieldError('')
    const local = validateLocal()
    if (local) {
      setFieldError(local)
      return
    }
    await onSubmit({
      title: form.title.trim(),
      author: form.author.trim(),
      category: form.category.trim(),
      year: Number(form.year),
    })
  }

  const isEdit = mode === 'edit'
  const titleId = isEdit ? 'book-edit-title' : 'book-create-title'
  const authorId = isEdit ? 'book-edit-author' : 'book-create-author'
  const categoryId = isEdit ? 'book-edit-category' : 'book-create-category'
  const yearId = isEdit ? 'book-edit-year' : 'book-create-year'

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-md border border-border bg-surface p-4 sm:p-6 space-y-4"
      aria-labelledby="book-form-heading"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="book-form-heading" className="text-lg font-serif font-bold text-text">
            {isEdit ? 'Editar libro' : 'Registrar libro'}
          </h2>
          <p className="text-sm text-text-muted mt-1">
            {isEdit
              ? 'Actualiza los datos del catálogo. La disponibilidad no se edita aquí.'
              : 'Completa los datos del nuevo ejemplar. Quedará disponible al crearse.'}
          </p>
        </div>
        {isEdit && (
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="text-sm font-medium text-text-muted hover:text-primary transition-colors duration-150 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
          >
            Cancelar
          </button>
        )}
      </div>

      {isEdit && initialBook?.available != null && (
        <p className="text-sm text-text-muted">
          Disponibilidad:{' '}
          <span
            className={
              initialBook.available
                ? 'font-medium text-success'
                : 'font-medium text-accent'
            }
          >
            {initialBook.available ? 'Disponible' : 'Prestado'}
          </span>
          <span className="sr-only"> (solo lectura)</span>
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label htmlFor={titleId} className="block text-sm font-medium text-text mb-1.5">
            Título
          </label>
          <input
            id={titleId}
            name="title"
            type="text"
            value={form.title}
            onChange={handleChange}
            disabled={submitting}
            placeholder="Clean Code"
            autoComplete="off"
            className="w-full rounded-md border border-border bg-surface px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-colors duration-150 disabled:opacity-60"
          />
        </div>
        <div>
          <label htmlFor={authorId} className="block text-sm font-medium text-text mb-1.5">
            Autor
          </label>
          <input
            id={authorId}
            name="author"
            type="text"
            value={form.author}
            onChange={handleChange}
            disabled={submitting}
            placeholder="Robert C. Martin"
            autoComplete="off"
            className="w-full rounded-md border border-border bg-surface px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-colors duration-150 disabled:opacity-60"
          />
        </div>
        <div>
          <label htmlFor={categoryId} className="block text-sm font-medium text-text mb-1.5">
            Categoría
          </label>
          <input
            id={categoryId}
            name="category"
            type="text"
            value={form.category}
            onChange={handleChange}
            disabled={submitting}
            placeholder="Programación"
            autoComplete="off"
            className="w-full rounded-md border border-border bg-surface px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-colors duration-150 disabled:opacity-60"
          />
        </div>
        <div>
          <label htmlFor={yearId} className="block text-sm font-medium text-text mb-1.5">
            Año
          </label>
          <input
            id={yearId}
            name="year"
            type="number"
            inputMode="numeric"
            value={form.year}
            onChange={handleChange}
            disabled={submitting}
            placeholder="2008"
            min={1000}
            max={2100}
            step={1}
            className="w-full rounded-md border border-border bg-surface px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-colors duration-150 disabled:opacity-60"
          />
        </div>
      </div>

      {fieldError && (
        <div
          role="alert"
          className="bg-red-50 border border-error rounded-md px-4 py-3 text-sm text-error"
        >
          {fieldError}
        </div>
      )}

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-1">
        {isEdit && (
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="inline-flex items-center justify-center rounded-md border border-primary text-primary px-6 py-2.5 text-sm font-medium hover:bg-primary/5 transition-colors duration-150 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-primary text-white px-6 py-2.5 text-sm font-medium hover:bg-primary-hover transition-colors duration-150 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting && <Spinner />}
          {submitting
            ? isEdit
              ? 'Guardando…'
              : 'Creando…'
            : isEdit
              ? 'Guardar cambios'
              : 'Crear libro'}
        </button>
      </div>
    </form>
  )
}
