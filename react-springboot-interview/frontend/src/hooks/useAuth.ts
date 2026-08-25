import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch, RootState } from '../store'
import { logout as logoutAction } from '../store/authSlice'
import { authApi } from '../services/authApi'
import type { Role } from '../types/payment'

export function useAppDispatch() {
  return useDispatch<AppDispatch>()
}

export function useAppSelector<T>(selector: (s: RootState) => T): T {
  return useSelector(selector)
}

export function useAuth() {
  const dispatch = useAppDispatch()
  const { user, token, hydrated } = useAppSelector((s) => s.auth)

  const isAuthenticated = Boolean(token && user)
  const roles = user?.roles ?? []

  const hasRole = (role: Role) => roles.includes(role)
  const hasAnyRole = (...wanted: Role[]) => wanted.some((r) => roles.includes(r))

  const logout = () => {
    authApi.logout()
    dispatch(logoutAction())
  }

  return {
    user,
    token,
    hydrated,
    isAuthenticated,
    roles,
    hasRole,
    hasAnyRole,
    logout,
  }
}
