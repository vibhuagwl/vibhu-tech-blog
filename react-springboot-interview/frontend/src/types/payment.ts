/** Shared payment domain types — mirror Spring DTOs as closely as possible. */

export type PaymentStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'RETRYING'

export type Role = 'ADMIN' | 'SUPPORT' | 'READ_ONLY'

export interface Payment {
  id: string
  reference: string
  amount: number
  currency: string
  status: PaymentStatus
  merchantId: string
  customerEmail: string
  createdAt: string
  updatedAt: string
  failureReason?: string
}

export interface Transaction {
  id: string
  paymentId: string
  type: 'AUTH' | 'CAPTURE' | 'REFUND' | 'RETRY'
  amount: number
  status: PaymentStatus
  createdAt: string
  providerRef?: string
}

export interface PaymentDetail extends Payment {
  transactions: Transaction[]
}

export interface CreatePaymentRequest {
  amount: number
  currency: string
  merchantId: string
  customerEmail: string
  reference?: string
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
  completedToday: number
  failedToday: number
  pendingCount: number
  volumeToday: number
  successRate: number
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

export interface LoginResponse {
  token: string
  user: AuthUser
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
  type: 'PAYMENT_UPDATED' | 'PAYMENT_CREATED' | 'HEARTBEAT'
  paymentId?: string
  status?: PaymentStatus
  at: string
}
