import { BookText } from 'lucide-react'
import AppLayout from '../layouts/AppLayout.jsx'
import useAuthStore from '../store/auth.store'

export default function AppPage() {
  const user = useAuthStore((s) => s.user)

  return (
    <AppLayout>
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <BookText className="w-16 h-16 text-primary mb-6" aria-hidden="true" />
        <h1 className="text-3xl font-serif font-bold text-text mb-2">
          Bienvenido, {user?.name || 'Usuario'}
        </h1>
        <p className="text-text-muted max-w-md">
          Has iniciado sesión correctamente. Las funcionalidades de gestión estarán disponibles en los próximos sprints.
        </p>
      </div>
    </AppLayout>
  )
}
