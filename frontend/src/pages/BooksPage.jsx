import { useCallback, useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import AppLayout from '../layouts/AppLayout.jsx'
import { Spinner } from '../components/Spinner.jsx'
import BookFilters from '../features/books/BookFilters.jsx'
import BookForm from '../features/books/BookForm.jsx'
import BooksTable from '../features/books/BooksTable.jsx'
import ConfirmDeleteDialog from '../features/books/ConfirmDeleteDialog.jsx'
import {
  listBooks,
  createBook,
  updateBook,
  deleteBook,
  getApiErrorMessage,
} from '../features/books/booksClient.js'

const EMPTY_FILTERS = { title: '', author: '', category: '' }

/**
 * Página de gestión de Books (S2-07).
 * Export default, sin dependencias de cambios en router.
 * Montaje en rutas: responsabilidad de S2-10.
 */
export default function BooksPage() {
  const [books, setBooks] = useState([])
  const [total, setTotal] = useState(0)
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [debouncedFilters, setDebouncedFilters] = useState(EMPTY_FILTERS)

  const [listStatus, setListStatus] = useState('loading') // loading | success | error
  const [listError, setListError] = useState('')

  const [formMode, setFormMode] = useState('create') // create | edit
  const [editingBook, setEditingBook] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const requestIdRef = useRef(0)
  const formSectionRef = useRef(null)
  const debounceRef = useRef(null)

  function handleFiltersChange(next) {
    setFilters(next)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setListStatus('loading')
      setDebouncedFilters(next)
    }, 350)
  }

  const loadBooks = useCallback(async (activeFilters) => {
    const reqId = ++requestIdRef.current
    setListStatus('loading')
    setListError('')
    try {
      const { data } = await listBooks({
        title: activeFilters.title?.trim() || undefined,
        author: activeFilters.author?.trim() || undefined,
        category: activeFilters.category?.trim() || undefined,
      })
      if (reqId !== requestIdRef.current) return
      const items = data?.data?.items ?? []
      const count = data?.data?.total ?? items.length
      setBooks(items)
      setTotal(count)
      setListStatus('success')
    } catch (err) {
      if (reqId !== requestIdRef.current) return
      const msg = getApiErrorMessage(err)
      setListError(msg)
      setBooks([])
      setTotal(0)
      setListStatus('error')
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function run() {
      const reqId = ++requestIdRef.current
      try {
        const { data } = await listBooks({
          title: debouncedFilters.title?.trim() || undefined,
          author: debouncedFilters.author?.trim() || undefined,
          category: debouncedFilters.category?.trim() || undefined,
        })
        if (cancelled || reqId !== requestIdRef.current) return
        const items = data?.data?.items ?? []
        const count = data?.data?.total ?? items.length
        setBooks(items)
        setTotal(count)
        setListError('')
        setListStatus('success')
      } catch (err) {
        if (cancelled || reqId !== requestIdRef.current) return
        setListError(getApiErrorMessage(err))
        setBooks([])
        setTotal(0)
        setListStatus('error')
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [debouncedFilters])

  function handleStartEdit(book) {
    setFormMode('edit')
    setEditingBook(book)
    formSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function handleCancelEdit() {
    setFormMode('create')
    setEditingBook(null)
  }

  async function handleFormSubmit(payload) {
    if (submitting) return
    setSubmitting(true)
    try {
      if (formMode === 'edit' && editingBook?._id) {
        const { data } = await updateBook(editingBook._id, payload)
        toast.success(data?.message || 'Libro actualizado correctamente')
        setFormMode('create')
        setEditingBook(null)
      } else {
        const { data } = await createBook(payload)
        toast.success(data?.message || 'Libro creado correctamente')
      }
      await loadBooks(debouncedFilters)
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  function handleRequestDelete(book) {
    setDeleteTarget(book)
  }

  async function handleConfirmDelete() {
    if (!deleteTarget?._id || deleting) return
    setDeleting(true)
    try {
      const { data } = await deleteBook(deleteTarget._id)
      toast.success(data?.message || 'Libro eliminado correctamente')
      if (editingBook?._id === deleteTarget._id) {
        handleCancelEdit()
      }
      setDeleteTarget(null)
      await loadBooks(debouncedFilters)
    } catch (err) {
      // Incluye 409 (préstamo activo), 401, 404, etc.
      toast.error(getApiErrorMessage(err))
    } finally {
      setDeleting(false)
    }
  }

  function handleRetry() {
    setListStatus('loading')
    void loadBooks(debouncedFilters)
  }

  const busy = submitting || deleting
  const isLoading = listStatus === 'loading'
  const isError = listStatus === 'error'
  const isEmpty = listStatus === 'success' && books.length === 0

  return (
    <AppLayout>
      <div className="space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-text">
            Catálogo de libros
          </h1>
          <p className="text-sm text-text-muted max-w-2xl">
            Administra el inventario: busca por título, autor o categoría; registra, edita o
            elimina ejemplares. La disponibilidad se muestra como estado y no se edita manualmente.
          </p>
        </header>

        <BookFilters filters={filters} onChange={handleFiltersChange} disabled={busy} />

        <div ref={formSectionRef}>
          <BookForm
            key={formMode === 'edit' ? editingBook?._id : 'create'}
            mode={formMode}
            initialBook={editingBook}
            onSubmit={handleFormSubmit}
            onCancel={handleCancelEdit}
            submitting={submitting}
          />
        </div>

        <section aria-label="Listado de libros" className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-serif font-bold text-text">Listado</h2>
            {listStatus === 'success' && (
              <p className="text-sm text-text-muted tabular-nums">
                {total === 1 ? '1 libro' : `${total} libros`}
              </p>
            )}
          </div>

          {isLoading && (
            <div
              className="flex flex-col items-center justify-center gap-3 rounded-md border border-border bg-surface py-16 text-text-muted"
              role="status"
              aria-live="polite"
            >
              <Spinner className="w-8 h-8 text-primary" />
              <p className="text-sm">Cargando catálogo…</p>
            </div>
          )}

          {isError && (
            <div
              role="alert"
              className="rounded-md border border-error bg-red-50 px-4 py-6 text-center space-y-3"
            >
              <p className="text-sm text-error">{listError || 'No se pudo cargar el catálogo.'}</p>
              <button
                type="button"
                onClick={handleRetry}
                className="inline-flex items-center justify-center rounded-md bg-primary text-white px-6 py-2.5 text-sm font-medium hover:bg-primary-hover transition-colors duration-150 cursor-pointer"
              >
                Reintentar
              </button>
            </div>
          )}

          {isEmpty && (
            <div className="rounded-md border border-border bg-surface px-4 py-12 text-center">
              <p className="text-sm font-medium text-text">No hay libros que mostrar</p>
              <p className="text-sm text-text-muted mt-1">
                {filters.title || filters.author || filters.category
                  ? 'Prueba a ajustar los filtros o limpia la búsqueda.'
                  : 'Registra el primer libro del catálogo con el formulario superior.'}
              </p>
            </div>
          )}

          {listStatus === 'success' && books.length > 0 && (
            <BooksTable
              books={books}
              onEdit={handleStartEdit}
              onDelete={handleRequestDelete}
              busy={busy}
            />
          )}
        </section>
      </div>

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        book={deleteTarget}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          if (!deleting) setDeleteTarget(null)
        }}
        loading={deleting}
      />
    </AppLayout>
  )
}
