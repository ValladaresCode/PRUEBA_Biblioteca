/**
 * Lista/tabla responsive de libros.
 * Muestra available como estado (no editable).
 * Usa book._id como identificador.
 */
export default function BooksTable({ books, onEdit, onDelete, busy = false }) {
  if (!books?.length) return null

  return (
    <div className="rounded-md border border-border bg-surface overflow-hidden">
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-bg border-b border-border">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium text-text">
                Título
              </th>
              <th scope="col" className="px-4 py-3 font-medium text-text">
                Autor
              </th>
              <th scope="col" className="px-4 py-3 font-medium text-text">
                Categoría
              </th>
              <th scope="col" className="px-4 py-3 font-medium text-text">
                Año
              </th>
              <th scope="col" className="px-4 py-3 font-medium text-text">
                Estado
              </th>
              <th scope="col" className="px-4 py-3 font-medium text-text text-right">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {books.map((book) => (
              <tr key={book._id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-text font-medium">{book.title}</td>
                <td className="px-4 py-3 text-text-muted">{book.author}</td>
                <td className="px-4 py-3 text-text-muted">{book.category}</td>
                <td className="px-4 py-3 text-text-muted tabular-nums">{book.year}</td>
                <td className="px-4 py-3">
                  <AvailabilityBadge available={book.available} />
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit(book)}
                      disabled={busy}
                      className="text-sm font-medium text-primary hover:text-primary-hover transition-colors duration-150 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(book)}
                      disabled={busy}
                      className="text-sm font-medium text-error hover:opacity-80 transition-opacity duration-150 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <ul className="md:hidden divide-y divide-border">
        {books.map((book) => (
          <li key={book._id} className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-text">{book.title}</p>
                <p className="text-sm text-text-muted mt-0.5">{book.author}</p>
              </div>
              <AvailabilityBadge available={book.available} />
            </div>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <dt className="text-text-muted">Categoría</dt>
                <dd className="text-text">{book.category}</dd>
              </div>
              <div>
                <dt className="text-text-muted">Año</dt>
                <dd className="text-text tabular-nums">{book.year}</dd>
              </div>
            </dl>
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => onEdit(book)}
                disabled={busy}
                className="text-sm font-medium text-primary hover:text-primary-hover transition-colors duration-150 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Editar
              </button>
              <button
                type="button"
                onClick={() => onDelete(book)}
                disabled={busy}
                className="text-sm font-medium text-error hover:opacity-80 transition-opacity duration-150 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Eliminar
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function AvailabilityBadge({ available }) {
  if (available) {
    return (
      <span className="inline-flex items-center rounded-md border border-success/30 bg-green-50 px-2 py-0.5 text-xs font-medium text-success">
        Disponible
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-md border border-accent/30 bg-orange-50 px-2 py-0.5 text-xs font-medium text-accent">
      Prestado
    </span>
  )
}
