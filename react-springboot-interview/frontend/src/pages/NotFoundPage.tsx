import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="page state-box">
      <h1>404</h1>
      <p className="muted">That route does not exist.</p>
      <Link className="btn btn-primary" to="/dashboard">
        Back to dashboard
      </Link>
    </div>
  )
}
