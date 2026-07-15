import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import AuthLayout from '../layouts/AuthLayout.jsx'
import { Spinner } from '../components/Spinner.jsx'
import { registerUser } from '../api/auth.api.js'

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')
  const navigate = useNavigate()

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setApiError('')
    const { name, email, password } = form
    if (!name.trim() || !email.trim() || !password.trim()) {
      setApiError('Todos los campos son obligatorios.')
      return
    }
    if (password.length < 8) {
      setApiError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    setLoading(true)
    try {
      const { data } = await registerUser({ name, email, password })
      if (data.success) {
        toast.success(data.message || 'Usuario registrado correctamente')
        navigate('/login', { replace: true })
      } else {
        setApiError(data.message || 'Error al registrarse')
      }
    } catch (err) {
      const msg =
        (err.response?.data?.errors?.length ? err.response.data.errors[0].message : null) ||
        err.response?.data?.message ||
        'Error de conexión con el servidor.'
      setApiError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Crear cuenta" subtitle="Registrate para acceder al sistema de biblioteca.">
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-text mb-1.5">
            Nombre completo
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Ana López"
            className="w-full rounded-md border border-border bg-surface px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-colors duration-150"
          />
        </div>
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
            autoComplete="new-password"
            value={form.password}
            onChange={handleChange}
            placeholder="Mínimo 8 caracteres"
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
          {loading ? 'Registrando…' : 'Crear cuenta'}
        </button>
      </form>
      <p className="text-center text-sm text-text-muted mt-4">
        ¿Ya tienes cuenta?{' '}
        <Link to="/login" className="text-primary hover:underline font-medium">Inicia sesión</Link>
      </p>
    </AuthLayout>
  )
}
