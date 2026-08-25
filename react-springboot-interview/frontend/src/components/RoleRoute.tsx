import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import type { Role } from '../types/payment'

/**
 * RoleRoute — SUPPORT | ADMIN | READ_ONLY.
 * Frontend-only; Spring Security must re-check every endpoint.
 */
export function RoleRoute({
  roles,
  children,
}: {
  roles: Role[]
  children: ReactNode
}) {
  const { hasAnyRole, isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!hasAnyRole(...roles)) {
    return (
      <div className="state-box state-error" role="alert">
        <h2>403 — Forbidden</h2>
        <p>Your role cannot access this page. Required: {roles.join(', ')}</p>
      </div>
    )
  }

  return children
}
