import AppLayout from '../layouts/AppLayout.jsx'
import LoansPanel from '../features/loans/LoansPanel.jsx'

/**
 * Página de préstamos y devoluciones (S2-08).
 *
 * La integración (S2-10) debe montarla en el router, por ejemplo:
 *   <Route path="/app/loans" element={<ProtectedRoute><LoansPage /></ProtectedRoute>} />
 *
 * No modifica router ni layout en esta tarea.
 */
export default function LoansPage() {
  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-text">
          Préstamos y devoluciones
        </h1>
        <p className="text-sm text-text-muted mt-1 max-w-2xl">
          Registra préstamos sobre libros disponibles, consulta el estado de la
          circulación y marca devoluciones.
        </p>
      </div>
      <LoansPanel />
    </AppLayout>
  )
}
