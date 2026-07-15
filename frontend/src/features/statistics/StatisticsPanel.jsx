import { useState, useEffect } from 'react'
import { getStatistics } from '../../api/statistics.api.js'
import { getApiErrorMessage } from '../../api/api-error.js'
import { Spinner } from '../../components/Spinner.jsx'

const METRICS = [
  { key: 'totalBooks', label: 'Total de libros', color: 'text-primary' },
  { key: 'availableBooks', label: 'Libros disponibles', color: 'text-success' },
  { key: 'totalLoans', label: 'Préstamos totales', color: 'text-primary' },
  { key: 'activeLoans', label: 'Préstamos activos', color: 'text-accent' },
  { key: 'returnedLoans', label: 'Préstamos devueltos', color: 'text-text-muted' },
]

export default function StatisticsPanel() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    let cancelled = false

    const fetchStats = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await getStatistics()
        if (!cancelled) setData(res.data.data)
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchStats()
    return () => { cancelled = true }
  }, [retryCount])

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner className="w-8 h-8 text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-error rounded-md p-4">
        <p className="text-error text-sm">{error}</p>
        <button
          onClick={() => setRetryCount((c) => c + 1)}
          className="mt-3 text-sm font-medium text-primary hover:text-primary-hover transition-colors duration-150 cursor-pointer"
        >
          Intentar de nuevo
        </button>
      </div>
    )
  }

  if (!data) return null

  return (
    <div>
      <h2 className="text-xl font-serif font-bold text-text mb-6">Estadísticas</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {METRICS.map(({ key, label, color }) => (
          <div key={key} className="bg-surface border border-border rounded-md p-5">
            <p className="text-sm text-text-muted mb-1">{label}</p>
            <p className={`text-2xl font-bold font-serif ${color}`}>
              {data[key] ?? 0}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
