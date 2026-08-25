import { useOptimistic, useTransition } from 'react'
import { Link, useParams } from 'react-router-dom'
import { usePayment, useRetryPayment } from '../hooks/usePayments'
import { usePermissions } from '../hooks/usePermissions'
import { LoadingState } from '../components/LoadingState'
import { ErrorState } from '../components/ErrorState'
import { StatusBadge } from '../components/StatusBadge'
import type { PaymentDetail, PaymentStatus } from '../types/payment'

/**
 * Detail page demos BOTH:
 * 1) TanStack optimistic update (useRetryPayment)
 * 2) React 19 useOptimistic for local status flash
 */
export function PaymentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data, isLoading, error, refetch } = usePayment(id)
  const retry = useRetryPayment()
  const { canRetryPayments } = usePermissions()
  const [isPending, startTransition] = useTransition()

  const [optimisticStatus, setOptimisticStatus] = useOptimistic<
    PaymentStatus | undefined,
    PaymentStatus
  >(data?.status, (_current, next) => next)

  if (isLoading) return <LoadingState label="Loading payment…" />
  if (error) {
    return (
      <ErrorState error={error as Error} onRetry={() => void refetch()} />
    )
  }
  if (!data) return null

  const status = optimisticStatus ?? data.status

  const onRetry = () => {
    startTransition(async () => {
      setOptimisticStatus('PROCESSING')
      try {
        await retry.mutateAsync(String(data.id))
      } catch {
        /* TanStack onError rolls back query cache */
      }
    })
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="breadcrumb">
            <Link to="/payments">Payments</Link> / {data.reference}
          </p>
          <h1>{data.reference}</h1>
          <StatusBadge status={status} />
        </div>
        {canRetryPayments && data.status === 'FAILED' && (
          <button
            type="button"
            className="btn btn-primary"
            disabled={retry.isPending || isPending}
            onClick={onRetry}
          >
            {retry.isPending || isPending ? 'Retrying…' : 'Retry payment'}
          </button>
        )}
      </header>

      <div className="detail-grid">
        <section className="panel">
          <h2>Details</h2>
          <dl className="kv">
            <dt>ID</dt>
            <dd>
              <code>{data.id}</code>
            </dd>
            <dt>Amount</dt>
            <dd>
              {data.amount} {data.currency}
            </dd>
            <dt>Customer</dt>
            <dd>
              {data.customerName}
              <div className="muted">{data.customerEmail}</div>
            </dd>
            <dt>Created</dt>
            <dd>{new Date(data.createdAt).toLocaleString()}</dd>
            <dt>Updated</dt>
            <dd>{new Date(data.updatedAt).toLocaleString()}</dd>
          </dl>
        </section>

        <section className="panel">
          <h2>Transactions</h2>
          <TransactionList detail={data} />
        </section>
      </div>
    </div>
  )
}

function TransactionList({ detail }: { detail: PaymentDetail }) {
  if (!detail.transactions?.length) {
    return <p className="muted">No transactions yet.</p>
  }
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Status</th>
            <th>Message</th>
            <th>At</th>
          </tr>
        </thead>
        <tbody>
          {detail.transactions.map((t) => (
            <tr key={t.id}>
              <td>{t.id}</td>
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
  )
}
