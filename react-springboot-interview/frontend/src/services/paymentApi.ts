import type {
  CreatePaymentRequest,
  Customer,
  DashboardMetrics,
  PageResponse,
  Payment,
  PaymentListParams,
  Transaction,
} from '../types/payment'
import { apiClient } from './apiClient'

const API = '/api/v1'

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
    return apiClient<PageResponse<Payment>>(`${API}/payments${toQuery(params)}`, {
      signal,
    })
  },

  getById(id: string | number, signal?: AbortSignal) {
    return apiClient<Payment>(`${API}/payments/${id}`, { signal })
  },

  transactions(id: string | number, signal?: AbortSignal) {
    return apiClient<Transaction[]>(`${API}/payments/${id}/transactions`, {
      signal,
    })
  },

  create(body: CreatePaymentRequest, idempotencyKey?: string) {
    return apiClient<Payment>(`${API}/payments`, {
      method: 'POST',
      body,
      headers: idempotencyKey
        ? { 'Idempotency-Key': idempotencyKey }
        : undefined,
    })
  },

  retry(id: string | number, idempotencyKey?: string) {
    return apiClient<Payment>(`${API}/payments/${id}/retry`, {
      method: 'POST',
      headers: idempotencyKey
        ? { 'Idempotency-Key': idempotencyKey }
        : undefined,
    })
  },

  metrics(signal?: AbortSignal) {
    return apiClient<DashboardMetrics>(`${API}/dashboard/metrics`, { signal })
  },

  customers(signal?: AbortSignal) {
    return apiClient<Customer[]>(`${API}/customers`, { signal })
  },
}
