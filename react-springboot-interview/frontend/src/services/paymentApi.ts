import type {
  CreatePaymentRequest,
  DashboardMetrics,
  PageResponse,
  Payment,
  PaymentDetail,
  PaymentListParams,
  Transaction,
} from '../types/payment'
import { apiClient } from './apiClient'

function toQuery(params: PaymentListParams): string {
  const q = new URLSearchParams()
  if (params.q) q.set('q', params.q)
  if (params.status) q.set('status', params.status)
  if (params.sort) q.set('sort', params.sort)
  if (params.page != null) q.set('page', String(params.page))
  if (params.size != null) q.set('size', String(params.size))
  const s = q.toString()
  return s ? `?${s}` : ''
}

export const paymentApi = {
  list(params: PaymentListParams = {}, signal?: AbortSignal) {
    return apiClient<PageResponse<Payment>>(`/api/payments${toQuery(params)}`, {
      signal,
    })
  },

  getById(id: string, signal?: AbortSignal) {
    return apiClient<PaymentDetail>(`/api/payments/${id}`, { signal })
  },

  create(body: CreatePaymentRequest) {
    return apiClient<Payment>('/api/payments', { method: 'POST', body })
  },

  retry(id: string) {
    return apiClient<Payment>(`/api/payments/${id}/retry`, { method: 'POST' })
  },

  metrics(signal?: AbortSignal) {
    return apiClient<DashboardMetrics>('/api/payments/metrics', { signal })
  },

  recentTransactions(signal?: AbortSignal) {
    return apiClient<Transaction[]>('/api/transactions/recent', { signal })
  },
}
