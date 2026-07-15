import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Spinner } from '../../components/Spinner.jsx'
import {
  createLoan,
  getApiErrorMessage,
  listBooks,
  listLoans,
  returnLoan,
} from './api.js'
import LoanCreateForm from './LoanCreateForm.jsx'
import LoansTable from './LoansTable.jsx'
import { extractItems } from './utils.js'

/**
 * Panel principal de circulación: cargar, prestar, listar y devolver.
 * Diseñado para montarse en LoansPage (router lo conecta en S2-10).
 */
export default function LoansPanel() {
  const [books, setBooks] = useState([])
  const [loans, setLoans] = useState([])
  const [filter, setFilter] = useState('ACTIVE')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [returningId, setReturningId] = useState(null)

  const busy = loading || submitting || Boolean(returningId)

  const availableBooks = useMemo(
    () => books.filter((b) => b && b.available === true && b._id),
    [books],
  )

  const applyLoadedData = useCallback((booksRes, loansRes, { silent = false } = {}) => {
    const bookItems = extractItems(booksRes?.data ?? booksRes)
    const loanItems = extractItems(loansRes?.data ?? loansRes)

    const booksOk = booksRes?.success !== false || Array.isArray(bookItems)
    const loansOk = loansRes?.success !== false || Array.isArray(loanItems)

    setBooks(Array.isArray(bookItems) ? bookItems : [])
    setLoans(Array.isArray(loanItems) ? loanItems : [])

    if (!booksOk && !loansOk) {
      setLoadError('No se pudieron cargar libros ni préstamos.')
    } else if (!booksOk) {
      setLoadError('Los préstamos se cargaron, pero falló la carga de libros.')
      if (!silent) toast.error('Respuesta parcial: no se pudieron cargar los libros.')
    } else if (!loansOk) {
      setLoadError('Los libros se cargaron, pero falló la carga de préstamos.')
      if (!silent) toast.error('Respuesta parcial: no se pudieron cargar los préstamos.')
    } else {
      setLoadError('')
    }
  }, [])

  const loadAll = useCallback(async ({ silent = false } = {}) => {
    // Desde handlers de UI es válido mostrar loading de inmediato.
    if (!silent) setLoading(true)
    try {
      const [booksRes, loansRes] = await Promise.all([listBooks(), listLoans()])
      applyLoadedData(booksRes, loansRes, { silent })
    } catch (err) {
      const msg = getApiErrorMessage(err, 'No se pudo cargar la información de préstamos.')
      setLoadError(msg)
      if (!silent) {
        toast.error(msg)
        setBooks([])
        setLoans([])
      }
    } finally {
      setLoading(false)
    }
  }, [applyLoadedData])

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        const [booksRes, loansRes] = await Promise.all([listBooks(), listLoans()])
        if (cancelled) return
        applyLoadedData(booksRes, loansRes, { silent: false })
      } catch (err) {
        if (cancelled) return
        const msg = getApiErrorMessage(err, 'No se pudo cargar la información de préstamos.')
        setLoadError(msg)
        toast.error(msg)
        setBooks([])
        setLoans([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [applyLoadedData])

  async function handleCreateLoan(payload) {
    setSubmitting(true)
    try {
      const res = await createLoan(payload)
      if (res?.success === false) {
        const msg = res.message || 'No se pudo registrar el préstamo.'
        toast.error(msg)
        return { ok: false }
      }
      toast.success(res?.message || 'Préstamo registrado correctamente')
      await loadAll({ silent: true })
      return { ok: true }
    } catch (err) {
      const msg = getApiErrorMessage(err, 'No se pudo registrar el préstamo.')
      toast.error(msg)
      // 409: libro ya prestado por otra solicitud → refrescar selector
      if (err.response?.status === 409 || err.response?.status === 404) {
        await loadAll({ silent: true })
      }
      return { ok: false }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleReturn(loan) {
    if (!loan?._id) return
    setReturningId(loan._id)
    try {
      const res = await returnLoan(loan._id)
      if (res?.success === false) {
        toast.error(res.message || 'No se pudo registrar la devolución.')
        return
      }
      toast.success(res?.message || 'Devolución registrada correctamente')
      await loadAll({ silent: true })
    } catch (err) {
      const msg = getApiErrorMessage(err, 'No se pudo registrar la devolución.')
      toast.error(msg)
      // 409 doble devolución / 404: refrescar lista
      if (err.response?.status === 409 || err.response?.status === 404) {
        await loadAll({ silent: true })
      }
    } finally {
      setReturningId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Spinner className="w-8 h-8 text-primary" />
        <p className="text-sm text-text-muted">Cargando préstamos y libros…</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {loadError && (
        <div className="bg-red-50 border border-error rounded-md px-4 py-3 text-sm text-error flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <span>{loadError}</span>
          <button
            type="button"
            onClick={() => loadAll()}
            disabled={busy}
            className="shrink-0 rounded-md border border-error px-3 py-1.5 text-sm font-medium hover:bg-red-100 transition-colors duration-150 cursor-pointer disabled:opacity-60"
          >
            Reintentar
          </button>
        </div>
      )}

      <LoanCreateForm
        availableBooks={availableBooks}
        submitting={submitting}
        disabled={busy && !submitting}
        onSubmit={handleCreateLoan}
      />

      <LoansTable
        loans={loans}
        filter={filter}
        onFilterChange={setFilter}
        returningId={returningId}
        disabled={busy}
        onReturn={handleReturn}
      />
    </div>
  )
}
