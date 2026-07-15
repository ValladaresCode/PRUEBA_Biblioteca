import { Link } from 'react-router-dom'
import { BookOpen } from 'lucide-react'

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <BookOpen className="w-10 h-10 text-primary mb-3" aria-hidden="true" />
          <h1 className="text-2xl font-serif font-bold text-primary">Biblioteca Escolar</h1>
        </div>
        <div className="bg-surface rounded-lg shadow-sm border border-border p-6">
          {title && <h2 className="text-lg font-serif font-bold text-text mb-1">{title}</h2>}
          {subtitle && <p className="text-sm text-text-muted mb-6">{subtitle}</p>}
          {children}
        </div>
      </div>
    </div>
  )
}

export function AuthNav() {
  return (
    <div className="text-center text-sm text-text-muted mt-4">
      <Link to="/login" className="text-primary hover:underline font-medium">Iniciar sesión</Link>
      <span className="mx-2">·</span>
      <Link to="/register" className="text-primary hover:underline font-medium">Crear cuenta</Link>
    </div>
  )
}
