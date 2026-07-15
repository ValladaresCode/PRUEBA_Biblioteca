import { Link } from 'react-router-dom'
import { BookText, ArrowRight } from 'lucide-react'
import AppLayout from '../layouts/AppLayout.jsx'
import StatisticsPanel from '../features/statistics/StatisticsPanel.jsx'
import useAuthStore from '../store/auth.store'

export default function AppPage() {
  const user = useAuthStore((s) => s.user)

  return (
    <AppLayout>
      <div className="space-y-10">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <BookText className="w-8 h-8 text-primary" aria-hidden="true" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-text">
                Bienvenido, {user?.name || 'Usuario'}
              </h1>
              <p className="text-sm text-text-muted">
                Resumen de la biblioteca calculado a partir de datos reales.
              </p>
            </div>
          </div>
          <nav className="flex items-center gap-3">
            <Link
              to="/app/books"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-hover transition-colors duration-150"
            >
              Gestionar libros <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
            <Link
              to="/app/loans"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-hover transition-colors duration-150"
            >
              Ver préstamos <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </nav>
        </header>

        <StatisticsPanel />
      </div>
    </AppLayout>
  )
}
