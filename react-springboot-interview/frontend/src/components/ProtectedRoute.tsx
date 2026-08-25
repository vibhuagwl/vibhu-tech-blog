import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

/**
 * Frontend route guards are UX only.
 * Real authz is Spring Security on the API — never trust the SPA alone.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, hydrated, token } = useAuth()
  const location = useLocation()

  if (!hydrated && token) {
    return <div className="state-box">Restoring session…</div>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return children
}
