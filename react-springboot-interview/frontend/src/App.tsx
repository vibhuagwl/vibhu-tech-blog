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

/**
 * Restore session from localStorage.
 * This lab API has login only (no /me) — user JSON is stored next to the JWT.
 */
function SessionBootstrap({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch()
  const { token, hydrated, user } = useAuth()

  useEffect(() => {
    if (hydrated) return
    if (!token) {
      dispatch(markHydrated())
      return
    }
    const restored = authApi.restoreSession()
    if (restored) {
      dispatch(setUser(restored))
    } else if (user) {
      dispatch(markHydrated())
    } else {
      dispatch(logout())
    }
  }, [token, hydrated, user, dispatch])

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
