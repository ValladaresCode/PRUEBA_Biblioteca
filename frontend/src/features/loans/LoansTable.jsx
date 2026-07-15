import { Spinner } from '../../components/Spinner.jsx'
import {
  formatDisplayDate,
  getLoanBookSubtitle,
  getLoanBookTitle,
} from './utils.js'

const FILTERS = [
  { id: 'ACTIVE', label: 'Activos' },
  { id: 'RETURNED', label: 'Devueltos' },
  { id: 'ALL', label: 'Todos' },
]

/**
 * Lista de préstamos con filtro de estado y acción de devolución.
 */
export default function LoansTable({
  loans,
  filter,
  onFilterChange,
  returningId,
  disabled,
  onReturn,
}) {
  const filtered =
    filter === 'ALL' ? loans : loans.filter((loan) => loan.status === filter)

  return (
    <section className="bg-surface border border-border rounded-lg shadow-sm p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <h2 className="text-lg font-serif font-bold text-text">Préstamos</h2>
          <p className="text-sm text-text-muted">
            {filtered.length} registro{filtered.length === 1 ? '' : 's'}
            {filter !== 'ALL' ? ` · filtro ${filter}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por estado">
          {FILTERS.map((f) => {
            const active = filter === f.id
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => onFilterChange(f.id)}
                disabled={disabled}
                className={[
                  'rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-150 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed',
                  active
                    ? 'bg-primary text-white'
                    : 'border border-primary text-primary hover:bg-primary/5',
                ].join(' ')}
              >
                {f.label}
              </button>
            )
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="border border-dashed border-border rounded-md px-4 py-10 text-center">
          <p className="text-sm text-text-muted">
            {filter === 'ACTIVE' && 'No hay préstamos activos.'}
            {filter === 'RETURNED' && 'No hay préstamos devueltos.'}
            {filter === 'ALL' && 'No hay préstamos registrados.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto -mx-1">
          <table className="w-full min-w-[640px] text-sm text-left">
            <thead>
              <tr className="border-b border-border text-text-muted">
                <th className="py-2 pr-3 font-medium">Libro</th>
                <th className="py-2 pr-3 font-medium">Prestatario</th>
                <th className="py-2 pr-3 font-medium">Estado</th>
                <th className="py-2 pr-3 font-medium">Límite</th>
                <th className="py-2 pr-3 font-medium">Prestado</th>
                <th className="py-2 pr-3 font-medium">Devuelto</th>
                <th className="py-2 font-medium text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((loan) => {
                const isActive = loan.status === 'ACTIVE'
                const isReturning = returningId === loan._id
                const subtitle = getLoanBookSubtitle(loan)

                return (
                  <tr key={loan._id} className="border-b border-border last:border-0">
                    <td className="py-3 pr-3 align-top">
                      <div className="font-medium text-text">{getLoanBookTitle(loan)}</div>
                      {subtitle ? (
                        <div className="text-xs text-text-muted mt-0.5">{subtitle}</div>
                      ) : null}
                    </td>
                    <td className="py-3 pr-3 align-top text-text">{loan.borrowerName || '—'}</td>
                    <td className="py-3 pr-3 align-top">
                      <span
                        className={[
                          'inline-flex rounded-md px-2 py-0.5 text-xs font-medium',
                          isActive
                            ? 'bg-accent/10 text-accent'
                            : 'bg-success/10 text-success',
                        ].join(' ')}
                      >
                        {isActive ? 'ACTIVE' : 'RETURNED'}
                      </span>
                    </td>
                    <td className="py-3 pr-3 align-top text-text">
                      {formatDisplayDate(loan.dueDate)}
                    </td>
                    <td className="py-3 pr-3 align-top text-text-muted">
                      {formatDisplayDate(loan.loanDate || loan.createdAt)}
                    </td>
                    <td className="py-3 pr-3 align-top text-text-muted">
                      {formatDisplayDate(loan.returnedAt)}
                    </td>
                    <td className="py-3 align-top text-right">
                      {isActive ? (
                        <button
                          type="button"
                          onClick={() => onReturn(loan)}
                          disabled={disabled || isReturning}
                          className="inline-flex items-center justify-center gap-1.5 rounded-md border border-primary text-primary px-3 py-1.5 text-sm font-medium hover:bg-primary/5 transition-colors duration-150 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {isReturning && <Spinner className="w-3.5 h-3.5" />}
                          {isReturning ? 'Devolviendo…' : 'Devolver'}
                        </button>
                      ) : (
                        <span className="text-xs text-text-muted">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
