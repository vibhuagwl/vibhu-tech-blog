import type { AuthUser, LoginRequest, LoginResponse } from '../types/payment'
import { apiClient, setStoredToken } from './apiClient'

/** Demo credentials — Spring Security InMemory / JWT lab */
export const DEMO_USERS = [
  { username: 'admin', password: 'admin123', hint: 'ADMIN' },
  { username: 'support', password: 'support123', hint: 'SUPPORT' },
  { username: 'reader', password: 'reader123', hint: 'READ_ONLY' },
] as const

export const authApi = {
  async login(req: LoginRequest): Promise<LoginResponse> {
    const res = await apiClient<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: req,
    })
    setStoredToken(res.token)
    return res
  },

  async me(): Promise<AuthUser> {
    return apiClient<AuthUser>('/api/auth/me')
  },

  logout(): void {
    setStoredToken(null)
  },
}
