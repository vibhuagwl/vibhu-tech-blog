import { usePaymentMetrics } from '../hooks/usePayments'
import { LoadingState } from '../components/LoadingState'
import { ErrorState } from '../components/ErrorState'
import { usePaymentEvents } from '../hooks/usePaymentEvents'

function MetricCard({
  label,
  value,
  hint,
}: {
  label: string
  value: string | number
  hint?: string
}) {
  return (
    <div className="metric">
      <span className="metric-label">{label}</span>
      <strong className="metric-value">{value}</strong>
      {hint && <span className="muted">{hint}</span>}
    </div>
  )
}

export function DashboardPage() {
  const { data, isLoading, error, refetch, isFetching } = usePaymentMetrics()
  const { connected, lastEvent } = usePaymentEvents(true)

  if (isLoading) return <LoadingState label="Loading metrics…" />
  if (error) {
    return (
      <ErrorState error={error as Error} onRetry={() => void refetch()} />
    )
  }
  if (!data) return null

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="muted">
            Live ops snapshot · SSE {connected ? 'connected' : 'offline'}
            {lastEvent?.paymentId
              ? ` · payment #${lastEvent.paymentId}`
              : ''}
          </p>
        </div>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => void refetch()}
          disabled={isFetching}
        >
          Refresh
        </button>
      </header>

      <div className="metric-grid">
        <MetricCard label="Total payments" value={data.totalPayments} />
        <MetricCard label="Success" value={data.successCount} />
        <MetricCard label="Failed" value={data.failedCount} />
        <MetricCard label="Pending" value={data.pendingCount} />
        <MetricCard label="Processing" value={data.processingCount} />
        <MetricCard label="Customers" value={data.customerCount} />
      </div>
    </div>
  )
}
