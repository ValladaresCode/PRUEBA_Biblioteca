import { Spinner } from '../../components/Spinner.jsx'

/**
 * Confirmación accesible antes de eliminar un libro.
 */
export default function ConfirmDeleteDialog({ book, open, onConfirm, onCancel, loading = false }) {
  if (!open || !book) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Cerrar diálogo"
        className="absolute inset-0 bg-text/40 cursor-pointer"
        onClick={loading ? undefined : onCancel}
        disabled={loading}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-book-title"
        aria-describedby="delete-book-desc"
        className="relative w-full max-w-md rounded-md border border-border bg-surface p-6 shadow-md"
      >
        <h2 id="delete-book-title" className="text-lg font-serif font-bold text-text">
          Eliminar libro
        </h2>
        <p id="delete-book-desc" className="mt-2 text-sm text-text-muted">
          ¿Confirmas eliminar <span className="font-medium text-text">«{book.title}»</span> de{' '}
          {book.author}? Esta acción no se puede deshacer.
        </p>
        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="inline-flex items-center justify-center rounded-md border border-border text-text px-6 py-2.5 text-sm font-medium hover:bg-bg transition-colors duration-150 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-error text-white px-6 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity duration-150 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading && <Spinner className="w-4 h-4" />}
            {loading ? 'Eliminando…' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  )
}
