import { Link } from 'react-router-dom'
import { useRecentTransactions } from '../hooks/usePayments'
import { LoadingState } from '../components/LoadingState'
import { ErrorState } from '../components/ErrorState'
import { StatusBadge } from '../components/StatusBadge'
import { EmptyState } from '../components/EmptyState'

export function TransactionsPage() {
  const { data, isLoading, error, refetch } = useRecentTransactions()

  if (isLoading) return <LoadingState label="Loading transactions…" />
  if (error) {
    return (
      <ErrorState error={error as Error} onRetry={() => void refetch()} />
    )
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Recent transactions</h1>
          <p className="muted">
            Flattened from the newest payments via{' '}
            <code>/payments/&#123;id&#125;/transactions</code>
          </p>
        </div>
      </header>

      {!data?.length ? (
        <EmptyState title="No recent transactions" />
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Payment</th>
                <th>Status</th>
                <th>Message</th>
                <th>At</th>
              </tr>
            </thead>
            <tbody>
              {data.map((t) => (
                <tr key={t.id}>
                  <td>
                    <Link to={`/payments/${t.paymentId}`}>{t.paymentId}</Link>
                  </td>
                  <td>
                    <StatusBadge status={t.status} />
                  </td>
                  <td>{t.message}</td>
                  <td className="muted">
                    {new Date(t.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
