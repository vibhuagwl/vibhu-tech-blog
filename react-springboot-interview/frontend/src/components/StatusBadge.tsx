import type { PaymentStatus } from '../types/payment'

const LABELS: Record<PaymentStatus, string> = {
  PENDING: 'Pending',
  PROCESSING: 'Processing',
  SUCCESS: 'Success',
  FAILED: 'Failed',
}

export function StatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <span className={`badge badge-${status.toLowerCase()}`}>
      {LABELS[status] ?? status}
    </span>
  )
}
