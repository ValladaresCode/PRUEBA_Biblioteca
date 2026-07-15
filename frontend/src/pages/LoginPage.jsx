import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import AuthLayout from '../layouts/AuthLayout.jsx'
import { Spinner } from '../components/Spinner.jsx'
import useAuthStore from '../store/auth.store'
import { loginUser } from '../api/auth.api.js'

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')
  const setAuth = useAuthStore((s) => s.setAuth)
  const navigate = useNavigate()

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setApiError('')
    if (!form.email.trim() || !form.password.trim()) {
      setApiError('Todos los campos son obligatorios.')
      return
    }
    setLoading(true)
    try {
      const { data } = await loginUser(form)
      if (data.success) {
        setAuth({ user: data.data.user, token: data.data.token })
        toast.success(data.message || 'Inicio de sesión exitoso')
        navigate('/app', { replace: true })
      } else {
        setApiError(data.message || 'Error al iniciar sesión')
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Error de conexión con el servidor.'
      setApiError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Iniciar sesión" subtitle="Ingresa tus credenciales para acceder al sistema.">
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-text mb-1.5">
            Correo electrónico
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={handleChange}
            placeholder="ana@example.com"
            className="w-full rounded-md border border-border bg-surface px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-colors duration-150"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-text mb-1.5">
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={form.password}
            onChange={handleChange}
            placeholder="••••••••"
            className="w-full rounded-md border border-border bg-surface px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-colors duration-150"
          />
        </div>
        {apiError && (
          <div className="bg-red-50 border border-error rounded-md px-4 py-3 text-sm text-error">
            {apiError}
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-md bg-primary text-white px-6 py-2.5 text-sm font-medium hover:bg-primary-hover transition-colors duration-150 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading && <Spinner />}
          {loading ? 'Ingresando…' : 'Iniciar sesión'}
        </button>
      </form>
      <p className="text-center text-sm text-text-muted mt-4">
        ¿No tienes cuenta?{' '}
        <Link to="/register" className="text-primary hover:underline font-medium">Regístrate</Link>
      </p>
    </AuthLayout>
  )
}
