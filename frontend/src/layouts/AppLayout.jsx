import { LogOut, BookOpen } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import useAuthStore from '../store/auth.store'

const NAV_ITEMS = [
  { to: '/app', label: 'Resumen', end: true },
  { to: '/app/books', label: 'Libros', end: false },
  { to: '/app/loans', label: 'Préstamos', end: false },
]

export default function AppLayout({ children }) {
  const { user, logout } = useAuthStore()

  const navLinkClass = ({ isActive }) =>
    `text-sm transition-colors duration-150 ${
      isActive
        ? 'text-primary font-medium'
        : 'text-text-muted hover:text-primary'
    }`

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 bg-surface border-b border-border shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" aria-hidden="true" />
              <span className="font-serif font-bold text-primary text-base">Biblioteca Escolar</span>
            </div>
            <nav className="flex items-center gap-4" aria-label="Navegación principal">
              {NAV_ITEMS.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.end} className={navLinkClass}>
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-text-muted hidden sm:inline">
              {user?.name}
            </span>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 text-sm text-text-muted hover:text-primary transition-colors duration-150 cursor-pointer"
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">Cerrar sesión</span>
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
