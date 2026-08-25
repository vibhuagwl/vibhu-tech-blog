import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { usePermissions } from '../hooks/usePermissions'
import { useTheme } from '../context/ThemeContext'
import { usePaymentEvents } from '../hooks/usePaymentEvents'

export function Layout() {
  const { user, logout } = useAuth()
  const { canViewAdmin } = usePermissions()
  const { theme, toggleTheme } = useTheme()
  const { connected, lastEvent } = usePaymentEvents(true)
  const navigate = useNavigate()

  const onLogout = () => {
    logout()
    void navigate('/login')
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">PO</span>
          <div>
            <strong>Payment Ops</strong>
            <span className="brand-sub">Interview Lab</span>
          </div>
        </div>
        <nav className="nav">
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/payments">Payments</NavLink>
          <NavLink to="/transactions">Transactions</NavLink>
          {canViewAdmin && <NavLink to="/admin">Admin</NavLink>}
          <NavLink to="/labs/virtualized">Virtualized</NavLink>
          <NavLink to="/labs/concepts">Concepts</NavLink>
        </nav>
        <div className="topbar-actions">
          <span
            className={`sse-dot ${connected ? 'on' : ''}`}
            title={
              lastEvent
                ? `Last SSE: ${lastEvent.type}`
                : connected
                  ? 'SSE connected'
                  : 'SSE offline'
            }
          />
          <button type="button" className="btn btn-ghost" onClick={toggleTheme}>
            {theme === 'light' ? 'Dark' : 'Light'}
          </button>
          <span className="user-chip">
            {user?.displayName ?? user?.username}
            <small>{user?.roles.join(', ')}</small>
          </span>
          <button type="button" className="btn btn-secondary" onClick={onLogout}>
            Log out
          </button>
        </div>
      </header>
      <main className="main">
        <Outlet />
      </main>
    </div>
  )
}
