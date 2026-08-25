import { memo } from 'react'
import { Link } from 'react-router-dom'
import type { Payment } from '../types/payment'
import { StatusBadge } from './StatusBadge'

export type PaymentRowProps = {
  payment: Payment
  onSelect?: (id: string) => void
}

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
  }).format(amount)
}

/** memo — skips re-render when payment props are shallow-equal (list + Redux noise). */
function PaymentRowInner({ payment, onSelect }: PaymentRowProps) {
  return (
    <tr
      data-testid="payment-row"
      onClick={() => onSelect?.(String(payment.id))}
      className="clickable-row"
    >
      <td>
        <Link
          to={`/payments/${payment.id}`}
          onClick={(e) => e.stopPropagation()}
        >
          {payment.reference}
        </Link>
      </td>
      <td>{formatMoney(Number(payment.amount), payment.currency)}</td>
      <td>
        <StatusBadge status={payment.status} />
      </td>
      <td>{payment.customerName}</td>
      <td className="muted">{payment.customerEmail}</td>
      <td className="muted">
        {new Date(payment.createdAt).toLocaleString()}
      </td>
    </tr>
  )
}

export const PaymentRow = memo(PaymentRowInner)
