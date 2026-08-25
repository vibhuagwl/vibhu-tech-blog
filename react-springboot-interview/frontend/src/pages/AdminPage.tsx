export function AdminPage() {
  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Admin</h1>
          <p className="muted">
            ADMIN-only surface — guarded by RoleRoute on the client and Spring
            Security on the server
          </p>
        </div>
      </header>

      <div className="panel">
        <h2>Ops controls (placeholder)</h2>
        <ul className="admin-list">
          <li>Replay failed payment batch</li>
          <li>Rotate webhook signing secrets</li>
          <li>Toggle maintenance mode for merchants</li>
        </ul>
        <p className="muted">
          Wire these to <code>/api/admin/**</code> with{' '}
          <code>@PreAuthorize(&quot;hasRole(&apos;ADMIN&apos;)&quot;)</code>.
        </p>
      </div>
    </div>
  )
}
