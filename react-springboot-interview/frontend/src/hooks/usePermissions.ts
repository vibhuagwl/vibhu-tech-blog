import { useAuth } from './useAuth'
import type { Role } from '../types/payment'

/**
 * Frontend permission helpers are UX only.
 * Real authorization must be enforced by Spring Security on every API call.
 */
export function usePermissions() {
  const { hasRole, hasAnyRole, roles, isAuthenticated } = useAuth()

  return {
    roles,
    isAuthenticated,
    canViewAdmin: hasRole('ADMIN'),
    canRetryPayments: hasAnyRole('ADMIN', 'SUPPORT'),
    canCreatePayments: hasAnyRole('ADMIN', 'SUPPORT'),
    canMutate: hasAnyRole('ADMIN', 'SUPPORT'),
    isReadOnly: hasRole('READ_ONLY') && !hasAnyRole('ADMIN', 'SUPPORT'),
    requireRoles: (...needed: Role[]) => hasAnyRole(...needed),
  }
}
