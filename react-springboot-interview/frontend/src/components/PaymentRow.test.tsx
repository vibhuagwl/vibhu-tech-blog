import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { PaymentRow } from '../components/PaymentRow'
import type { Payment } from '../types/payment'

const sample: Payment = {
  id: 'p1',
  reference: 'PAY-1001',
  amount: 42.5,
  currency: 'USD',
  status: 'COMPLETED',
  merchantId: 'mrc_1',
  customerEmail: 'a@example.com',
  createdAt: '2026-01-15T10:00:00Z',
  updatedAt: '2026-01-15T10:01:00Z',
}

describe('PaymentRow', () => {
  it('renders reference and status', () => {
    render(
      <MemoryRouter>
        <table>
          <tbody>
            <PaymentRow payment={sample} />
          </tbody>
        </table>
      </MemoryRouter>,
    )

    expect(screen.getByTestId('payment-row')).toBeInTheDocument()
    expect(screen.getByText('PAY-1001')).toBeInTheDocument()
    expect(screen.getByText('Completed')).toBeInTheDocument()
    expect(screen.getByText('a@example.com')).toBeInTheDocument()
  })
})
