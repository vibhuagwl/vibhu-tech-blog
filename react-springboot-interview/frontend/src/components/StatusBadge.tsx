import type { PaymentStatus } from '../types/payment'

const LABELS: Record<PaymentStatus, string> = {
  PENDING: 'Pending',
  PROCESSING: 'Processing',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
  CANCELLED: 'Cancelled',
  RETRYING: 'Retrying',
}

export function StatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <span className={`badge badge-${status.toLowerCase()}`}>
      {LABELS[status] ?? status}
    </span>
  )
}
