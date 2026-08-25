import { lazy, Suspense, useEffect, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Provider } from 'react-redux'
import { store } from './store'
import { ThemeProvider } from './context/ThemeContext'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Layout } from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { RoleRoute } from './components/RoleRoute'
import { LoadingState } from './components/LoadingState'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { PaymentsPage } from './pages/PaymentsPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { useAppDispatch, useAuth } from './hooks/useAuth'
import { markHydrated, setUser, logout } from './store/authSlice'
import { authApi } from './services/authApi'
import './App.css'

/** Route-level code splitting — initial bundle stays small; chunks load on navigation. */
const PaymentDetailPage = lazy(() =>
  import('./pages/PaymentDetailPage').then((m) => ({ default: m.PaymentDetailPage })),
)
const TransactionsPage = lazy(() =>
  import('./pages/TransactionsPage').then((m) => ({ default: m.TransactionsPage })),
)
const AdminPage = lazy(() =>
  import('./pages/AdminPage').then((m) => ({ default: m.AdminPage })),
)
const VirtualizedLabPage = lazy(() =>
  import('./pages/VirtualizedLabPage').then((m) => ({ default: m.VirtualizedLabPage })),
)
const ConceptsLabPage = lazy(() =>
  import('./pages/ConceptsLabPage').then((m) => ({ default: m.ConceptsLabPage })),
)

function Lazy({ children }: { children: ReactNode }) {
  return <Suspense fallback={<LoadingState label="Loading page…" />}>{children}</Suspense>
}

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
                      element={
                        <Lazy>
                          <PaymentDetailPage />
                        </Lazy>
                      }
                    />
                    <Route
                      path="/transactions"
                      element={
                        <Lazy>
                          <TransactionsPage />
                        </Lazy>
                      }
                    />
                    <Route
                      path="/admin"
                      element={
                        <RoleRoute roles={['ADMIN']}>
                          <Lazy>
                            <AdminPage />
                          </Lazy>
                        </RoleRoute>
                      }
                    />
                    <Route
                      path="/labs/virtualized"
                      element={
                        <Lazy>
                          <VirtualizedLabPage />
                        </Lazy>
                      }
                    />
                    <Route
                      path="/labs/concepts"
                      element={
                        <Lazy>
                          <ConceptsLabPage />
                        </Lazy>
                      }
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
