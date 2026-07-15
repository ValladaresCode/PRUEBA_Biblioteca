import { Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from '../store/auth.store'
import LoginPage from '../pages/LoginPage.jsx'
import RegisterPage from '../pages/RegisterPage.jsx'
import AppPage from '../pages/AppPage.jsx'
import BooksPage from '../pages/BooksPage.jsx'
import LoansPage from '../pages/LoansPage.jsx'

function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}

function PublicRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (isAuthenticated) return <Navigate to="/app" replace />
  return children
}

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/app" element={<ProtectedRoute><AppPage /></ProtectedRoute>} />
      <Route path="/app/books" element={<ProtectedRoute><BooksPage /></ProtectedRoute>} />
      <Route path="/app/loans" element={<ProtectedRoute><LoansPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
