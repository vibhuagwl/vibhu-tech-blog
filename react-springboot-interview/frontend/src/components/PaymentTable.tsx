import type { Payment } from '../types/payment'
import { PaymentRow } from './PaymentRow'
import { EmptyState } from './EmptyState'

export function PaymentTable({
  payments,
  onSelect,
}: {
  payments: Payment[]
  onSelect?: (id: string) => void
}) {
  if (payments.length === 0) {
    return (
      <EmptyState
        title="No payments match"
        description="Try clearing search or status filters."
      />
    )
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Reference</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Customer</th>
            <th>Email</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((p) => (
            <PaymentRow key={p.id} payment={p} onSelect={onSelect} />
          ))}
        </tbody>
      </table>
    </div>
  )
}
