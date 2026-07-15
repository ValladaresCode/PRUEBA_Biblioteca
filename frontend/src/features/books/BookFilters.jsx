/**
 * Filtros de catálogo: title, author, category.
 * Disparan consulta al cambiar (controlados por el padre).
 */
export default function BookFilters({ filters, onChange, disabled = false }) {
  function handleChange(e) {
    const { name, value } = e.target
    onChange({ ...filters, [name]: value })
  }

  function handleClear() {
    onChange({ title: '', author: '', category: '' })
  }

  const hasFilters = Boolean(
    filters.title?.trim() || filters.author?.trim() || filters.category?.trim(),
  )

  return (
    <section
      aria-label="Filtros de libros"
      className="rounded-md border border-border bg-surface p-4"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-medium text-text">Buscar en el catálogo</h2>
        {hasFilters && (
          <button
            type="button"
            onClick={handleClear}
            disabled={disabled}
            className="text-sm font-medium text-text-muted hover:text-primary transition-colors duration-150 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Limpiar filtros
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label htmlFor="filter-title" className="block text-sm font-medium text-text mb-1.5">
            Título
          </label>
          <input
            id="filter-title"
            name="title"
            type="search"
            value={filters.title}
            onChange={handleChange}
            disabled={disabled}
            placeholder="Buscar por título"
            autoComplete="off"
            className="w-full rounded-md border border-border bg-surface px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-colors duration-150 disabled:opacity-60"
          />
        </div>
        <div>
          <label htmlFor="filter-author" className="block text-sm font-medium text-text mb-1.5">
            Autor
          </label>
          <input
            id="filter-author"
            name="author"
            type="search"
            value={filters.author}
            onChange={handleChange}
            disabled={disabled}
            placeholder="Buscar por autor"
            autoComplete="off"
            className="w-full rounded-md border border-border bg-surface px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-colors duration-150 disabled:opacity-60"
          />
        </div>
        <div>
          <label htmlFor="filter-category" className="block text-sm font-medium text-text mb-1.5">
            Categoría
          </label>
          <input
            id="filter-category"
            name="category"
            type="search"
            value={filters.category}
            onChange={handleChange}
            disabled={disabled}
            placeholder="Buscar por categoría"
            autoComplete="off"
            className="w-full rounded-md border border-border bg-surface px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-colors duration-150 disabled:opacity-60"
          />
        </div>
      </div>
    </section>
  )
}
