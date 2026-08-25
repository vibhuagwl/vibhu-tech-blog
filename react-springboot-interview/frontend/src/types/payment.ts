/** Shared payment domain types — aligned with Spring Boot DTOs under /api/v1. */

export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED'

export type Role = 'ADMIN' | 'SUPPORT' | 'READ_ONLY'

export interface Payment {
  id: number
  reference: string
  amount: number
  currency: string
  status: PaymentStatus
  customerId: number
  customerName: string
  customerEmail: string
  createdAt: string
  updatedAt: string
}

export interface Transaction {
  id: number
  paymentId: number
  status: PaymentStatus
  message: string
  createdAt: string
}

export interface PaymentDetail extends Payment {
  transactions: Transaction[]
}

export interface CreatePaymentRequest {
  amount: number
  currency: string
  customerId: number
}

export interface Customer {
  id: number
  name: string
  email: string
  country: string
}

export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface DashboardMetrics {
  totalPayments: number
  successCount: number
  failedCount: number
  pendingCount: number
  processingCount: number
  customerCount: number
}

export interface AuthUser {
  username: string
  roles: Role[]
  displayName: string
}

export interface LoginRequest {
  username: string
  password: string
}

/** Spring LoginResponse shape */
export interface LoginResponse {
  accessToken: string
  role: Role
  username: string
}

export interface ApiErrorBody {
  code: string
  message: string
  traceId?: string
  status: number
  retryAfterSeconds?: number
}

export interface PaymentListParams {
  q?: string
  status?: PaymentStatus | ''
  sort?: string
  page?: number
  size?: number
}

export interface PaymentEvent {
  paymentId?: number
  reference?: string
  status?: PaymentStatus
  amount?: number
  currency?: string
  occurredAt?: string
  type?: string
  at?: string
}
