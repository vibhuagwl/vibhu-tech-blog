import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { paymentApi } from '../services/paymentApi'
import type {
  CreatePaymentRequest,
  Payment,
  PaymentListParams,
} from '../types/payment'

export const paymentKeys = {
  all: ['payments'] as const,
  lists: () => [...paymentKeys.all, 'list'] as const,
  list: (params: PaymentListParams) =>
    [...paymentKeys.lists(), params] as const,
  details: () => [...paymentKeys.all, 'detail'] as const,
  detail: (id: string) => [...paymentKeys.details(), id] as const,
  metrics: () => [...paymentKeys.all, 'metrics'] as const,
  transactions: () => [...paymentKeys.all, 'transactions'] as const,
}

export function usePayments(params: PaymentListParams) {
  return useQuery({
    queryKey: paymentKeys.list(params),
    queryFn: ({ signal }) => paymentApi.list(params, signal),
  })
}

export function usePayment(id: string | undefined) {
  return useQuery({
    queryKey: paymentKeys.detail(id ?? ''),
    queryFn: ({ signal }) => paymentApi.getById(id!, signal),
    enabled: Boolean(id),
  })
}

export function usePaymentMetrics() {
  return useQuery({
    queryKey: paymentKeys.metrics(),
    queryFn: ({ signal }) => paymentApi.metrics(signal),
  })
}

export function useRecentTransactions() {
  return useQuery({
    queryKey: paymentKeys.transactions(),
    queryFn: ({ signal }) => paymentApi.recentTransactions(signal),
  })
}

export function useCreatePayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreatePaymentRequest) => paymentApi.create(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: paymentKeys.lists() })
      void qc.invalidateQueries({ queryKey: paymentKeys.metrics() })
    },
  })
}

/** Optimistic retry via TanStack Query — interview classic */
export function useRetryPayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => paymentApi.retry(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: paymentKeys.detail(id) })
      const previous = qc.getQueryData<Payment>(paymentKeys.detail(id))
      if (previous) {
        qc.setQueryData(paymentKeys.detail(id), {
          ...previous,
          status: 'RETRYING',
        })
      }
      return { previous }
    },
    onError: (_err, id, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(paymentKeys.detail(id), ctx.previous)
      }
    },
    onSettled: (_data, _err, id) => {
      void qc.invalidateQueries({ queryKey: paymentKeys.detail(id) })
      void qc.invalidateQueries({ queryKey: paymentKeys.lists() })
    },
  })
}
