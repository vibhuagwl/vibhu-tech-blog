import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { AuthUser } from '../types/payment'
import { getStoredToken, setStoredToken } from '../services/apiClient'

interface AuthState {
  token: string | null
  user: AuthUser | null
  hydrated: boolean
}

const initialState: AuthState = {
  token: getStoredToken(),
  user: null,
  hydrated: false,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(
      state,
      action: PayloadAction<{ token: string; user: AuthUser }>,
    ) {
      state.token = action.payload.token
      state.user = action.payload.user
      state.hydrated = true
      setStoredToken(action.payload.token)
    },
    setUser(state, action: PayloadAction<AuthUser | null>) {
      state.user = action.payload
      state.hydrated = true
    },
    logout(state) {
      state.token = null
      state.user = null
      state.hydrated = true
      setStoredToken(null)
    },
    markHydrated(state) {
      state.hydrated = true
    },
  },
})

export const { setCredentials, setUser, logout, markHydrated } =
  authSlice.actions
export default authSlice.reducer
