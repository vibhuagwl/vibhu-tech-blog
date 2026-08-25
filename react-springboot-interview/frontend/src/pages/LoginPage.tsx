import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { DEMO_USERS, authApi } from '../services/authApi'
import { useAppDispatch, useAuth } from '../hooks/useAuth'
import { setCredentials } from '../store/authSlice'
import type { LoginRequest } from '../types/payment'
import { ApiError } from '../services/apiClient'

export function LoginPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated } = useAuth()
  const [apiError, setApiError] = useState<string | null>(null)

  const from =
    (location.state as { from?: string } | null)?.from ?? '/dashboard'

  const {
    register,
    handleSubmit,
    setValue,
    formState: { isSubmitting },
  } = useForm<LoginRequest>({
    defaultValues: { username: 'admin', password: 'admin123' },
  })

  useEffect(() => {
    if (isAuthenticated) void navigate(from, { replace: true })
  }, [isAuthenticated, navigate, from])

  const onSubmit = handleSubmit(async (values) => {
    setApiError(null)
    try {
      const res = await authApi.login(values)
      dispatch(setCredentials({ token: res.token, user: res.user }))
      void navigate(from, { replace: true })
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : 'Login failed'
      setApiError(msg)
    }
  })

  return (
    <div className="login-page">
      <div className="login-panel">
        <div className="login-brand">
          <span className="brand-mark lg">PO</span>
          <h1>Payment Ops</h1>
          <p className="muted">
            React interview lab wired to Spring Boot JWT APIs
          </p>
        </div>

        <form onSubmit={onSubmit} className="login-form" noValidate>
          <label>
            Username
            <input
              autoComplete="username"
              {...register('username', { required: true })}
            />
          </label>
          <label>
            Password
            <input
              type="password"
              autoComplete="current-password"
              {...register('password', { required: true })}
            />
          </label>
          {apiError && (
            <p className="field-error" role="alert">
              {apiError}
            </p>
          )}
          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="demo-logins">
          <p className="muted">Demo accounts</p>
          <ul>
            {DEMO_USERS.map((u) => (
              <li key={u.username}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    setValue('username', u.username)
                    setValue('password', u.password)
                  }}
                >
                  <code>
                    {u.username}/{u.password}
                  </code>
                  <span>{u.hint}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
