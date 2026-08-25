import { useEffect, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Provider } from 'react-redux'
import { store } from './store'
import { ThemeProvider } from './context/ThemeContext'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Layout } from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { RoleRoute } from './components/RoleRoute'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { PaymentsPage } from './pages/PaymentsPage'
import { PaymentDetailPage } from './pages/PaymentDetailPage'
import { TransactionsPage } from './pages/TransactionsPage'
import { AdminPage } from './pages/AdminPage'
import { VirtualizedLabPage } from './pages/VirtualizedLabPage'
import { ConceptsLabPage } from './pages/ConceptsLabPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { useAppDispatch, useAuth } from './hooks/useAuth'
import { markHydrated, setUser, logout } from './store/authSlice'
import { authApi } from './services/authApi'
import { ApiError } from './services/apiClient'
import './App.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

/** Bootstrap /api/auth/me when a token exists in localStorage. */
function SessionBootstrap({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch()
  const { token, hydrated } = useAuth()

  useEffect(() => {
    let cancelled = false
    async function run() {
      if (!token) {
        dispatch(markHydrated())
        return
      }
      try {
        const user = await authApi.me()
        if (!cancelled) dispatch(setUser(user))
      } catch (e) {
        if (!cancelled) {
          if (e instanceof ApiError && e.status === 401) dispatch(logout())
          else dispatch(markHydrated())
        }
      }
    }
    if (!hydrated) void run()
    return () => {
      cancelled = true
    }
  }, [token, hydrated, dispatch])

  return children
}

export default function App() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <ErrorBoundary>
            <BrowserRouter>
              <SessionBootstrap>
                <Routes>
                  <Route path="/login" element={<LoginPage />} />
                  <Route
                    element={
                      <ProtectedRoute>
                        <Layout />
                      </ProtectedRoute>
                    }
                  >
                    <Route
                      path="/"
                      element={<Navigate to="/dashboard" replace />}
                    />
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/payments" element={<PaymentsPage />} />
                    <Route
                      path="/payments/:id"
                      element={<PaymentDetailPage />}
                    />
                    <Route
                      path="/transactions"
                      element={<TransactionsPage />}
                    />
                    <Route
                      path="/admin"
                      element={
                        <RoleRoute roles={['ADMIN']}>
                          <AdminPage />
                        </RoleRoute>
                      }
                    />
                    <Route
                      path="/labs/virtualized"
                      element={<VirtualizedLabPage />}
                    />
                    <Route
                      path="/labs/concepts"
                      element={<ConceptsLabPage />}
                    />
                  </Route>
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </SessionBootstrap>
            </BrowserRouter>
          </ErrorBoundary>
        </ThemeProvider>
      </QueryClientProvider>
    </Provider>
  )
}
