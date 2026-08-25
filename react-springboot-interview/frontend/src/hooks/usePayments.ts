import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { paymentApi } from '../services/paymentApi'
import type {
  CreatePaymentRequest,
  Payment,
  PaymentDetail,
  PaymentListParams,
  Transaction,
} from '../types/payment'

export const paymentKeys = {
  all: ['payments'] as const,
  lists: () => [...paymentKeys.all, 'list'] as const,
  list: (params: PaymentListParams) =>
    [...paymentKeys.lists(), params] as const,
  details: () => [...paymentKeys.all, 'detail'] as const,
  detail: (id: string) => [...paymentKeys.details(), id] as const,
  metrics: () => [...paymentKeys.all, 'metrics'] as const,
  customers: () => [...paymentKeys.all, 'customers'] as const,
  recentTx: () => [...paymentKeys.all, 'recent-tx'] as const,
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
    queryFn: async ({ signal }): Promise<PaymentDetail> => {
      const [payment, transactions] = await Promise.all([
        paymentApi.getById(id!, signal),
        paymentApi.transactions(id!, signal),
      ])
      return { ...payment, transactions }
    },
    enabled: Boolean(id),
  })
}

export function usePaymentMetrics() {
  return useQuery({
    queryKey: paymentKeys.metrics(),
    queryFn: ({ signal }) => paymentApi.metrics(signal),
  })
}

export function useCustomers() {
  return useQuery({
    queryKey: paymentKeys.customers(),
    queryFn: ({ signal }) => paymentApi.customers(signal),
  })
}

/** Recent ledger lines — flatten tx from the newest payments page. */
export function useRecentTransactions() {
  return useQuery({
    queryKey: paymentKeys.recentTx(),
    queryFn: async ({ signal }) => {
      const page = await paymentApi.list(
        { page: 0, size: 8, sort: 'createdAt,desc' },
        signal,
      )
      const batches = await Promise.all(
        page.content.map((p) => paymentApi.transactions(p.id, signal)),
      )
      const flat: Transaction[] = batches.flat()
      flat.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      return flat.slice(0, 40)
    },
  })
}

export function useCreatePayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreatePaymentRequest) =>
      paymentApi.create(body, crypto.randomUUID()),
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
    mutationFn: (id: string) => paymentApi.retry(id, crypto.randomUUID()),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: paymentKeys.detail(id) })
      const previous = qc.getQueryData<PaymentDetail>(paymentKeys.detail(id))
      if (previous) {
        qc.setQueryData(paymentKeys.detail(id), {
          ...previous,
          status: 'PROCESSING' as const,
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
      void qc.invalidateQueries({ queryKey: paymentKeys.recentTx() })
    },
  })
}

// re-export Payment for callers that typed against mutation cache
export type { Payment }
