import type { ApiError } from '../services/apiClient'

export function ErrorState({
  error,
  onRetry,
}: {
  error: Error | ApiError | string
  onRetry?: () => void
}) {
  const message = typeof error === 'string' ? error : error.message
  const traceId =
    typeof error === 'object' && error && 'traceId' in error
      ? (error as ApiError).traceId
      : undefined

  return (
    <div className="state-box state-error" role="alert">
      <h3>Request failed</h3>
      <p>{message}</p>
      {traceId && (
        <p className="muted">
          Trace: <code>{traceId}</code>
        </p>
      )}
      {onRetry && (
        <button type="button" className="btn btn-secondary" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  )
}
