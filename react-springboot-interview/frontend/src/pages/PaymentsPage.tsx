import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useDebounce } from '../hooks/useDebounce'
import { usePayments } from '../hooks/usePayments'
import { useAppDispatch } from '../hooks/useAuth'
import { selectPayment, setCreateFormOpen } from '../store/paymentUiSlice'
import { useAppSelector } from '../hooks/useAuth'
import { SearchBar } from '../components/SearchBar'
import { PaymentTable } from '../components/PaymentTable'
import { Pagination } from '../components/Pagination'
import { LoadingState } from '../components/LoadingState'
import { ErrorState } from '../components/ErrorState'
import { CreatePaymentForm } from '../components/CreatePaymentForm'
import type { PaymentStatus } from '../types/payment'

const STATUSES: Array<PaymentStatus | ''> = [
  '',
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
  'CANCELLED',
  'RETRYING',
]

/**
 * URL query state = shareable filters (interview: lift state to the URL).
 * Debounced search avoids hammering Spring on every keystroke.
 */
export function PaymentsPage() {
  const [params, setParams] = useSearchParams()
  const dispatch = useAppDispatch()
  const createOpen = useAppSelector((s) => s.paymentUi.createFormOpen)

  const q = params.get('q') ?? ''
  const status = (params.get('status') ?? '') as PaymentStatus | ''
  const sort = params.get('sort') ?? 'createdAt,desc'
  const page = Number.parseInt(params.get('page') ?? '0', 10) || 0
  const size = Number.parseInt(params.get('size') ?? '20', 10) || 20

  const debouncedQ = useDebounce(q, 350)

  const queryParams = useMemo(
    () => ({
      q: debouncedQ || undefined,
      status: status || undefined,
      sort,
      page,
      size,
    }),
    [debouncedQ, status, sort, page, size],
  )

  const { data, isLoading, error, refetch, isFetching } =
    usePayments(queryParams)

  const patch = (patchObj: Record<string, string | null>) => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        for (const [k, v] of Object.entries(patchObj)) {
          if (v == null || v === '') next.delete(k)
          else next.set(k, v)
        }
        return next
      },
      { replace: true },
    )
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Payments</h1>
          <p className="muted">
            Search · filter · sort · paginate — all mirrored in the URL
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => dispatch(setCreateFormOpen(!createOpen))}
        >
          {createOpen ? 'Hide form' : 'New payment'}
        </button>
      </header>

      {createOpen && (
        <CreatePaymentForm
          onCreated={() => dispatch(setCreateFormOpen(false))}
        />
      )}

      <div className="toolbar">
        <SearchBar
          value={q}
          onChange={(v) => patch({ q: v, page: '0' })}
          placeholder="Search reference, email, merchant…"
        />
        <select
          value={status}
          onChange={(e) =>
            patch({ status: e.target.value || null, page: '0' })
          }
          aria-label="Filter by status"
        >
          {STATUSES.map((s) => (
            <option key={s || 'all'} value={s}>
              {s || 'All statuses'}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => patch({ sort: e.target.value })}
          aria-label="Sort"
        >
          <option value="createdAt,desc">Newest</option>
          <option value="createdAt,asc">Oldest</option>
          <option value="amount,desc">Amount ↓</option>
          <option value="amount,asc">Amount ↑</option>
          <option value="status,asc">Status</option>
        </select>
        {isFetching && !isLoading && (
          <span className="muted">Updating…</span>
        )}
      </div>

      {isLoading && <LoadingState />}
      {error && (
        <ErrorState error={error as Error} onRetry={() => void refetch()} />
      )}
      {data && (
        <>
          <PaymentTable
            payments={data.content}
            onSelect={(id) => dispatch(selectPayment(id))}
          />
          <Pagination
            page={data.page}
            totalPages={data.totalPages}
            onPageChange={(p) => patch({ page: String(p) })}
          />
        </>
      )}
    </div>
  )
}
