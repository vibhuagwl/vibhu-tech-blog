import type { AuthUser, LoginRequest, LoginResponse, Role } from '../types/payment'
import { apiClient, setStoredToken } from './apiClient'

/** Demo credentials — Spring Security InMemory / JWT lab */
export const DEMO_USERS = [
  { username: 'admin', password: 'admin123', hint: 'ADMIN' },
  { username: 'support', password: 'support123', hint: 'SUPPORT' },
  { username: 'reader', password: 'reader123', hint: 'READ_ONLY' },
] as const

const USER_KEY = 'poi_user'

export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

export function setStoredUser(user: AuthUser | null): void {
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user))
  else localStorage.removeItem(USER_KEY)
}

function toAuthUser(res: LoginResponse): AuthUser {
  const role = res.role as Role
  return {
    username: res.username,
    displayName: res.username,
    roles: [role],
  }
}

export const authApi = {
  async login(req: LoginRequest): Promise<{ token: string; user: AuthUser }> {
    const res = await apiClient<LoginResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: req,
    })
    const user = toAuthUser(res)
    setStoredToken(res.accessToken)
    setStoredUser(user)
    return { token: res.accessToken, user }
  },

  /** No /me endpoint on this lab API — restore user from localStorage after refresh. */
  restoreSession(): AuthUser | null {
    return getStoredUser()
  },

  logout(): void {
    setStoredToken(null)
    setStoredUser(null)
  },
}
