import { useForm } from 'react-hook-form'
import type { CreatePaymentRequest } from '../types/payment'
import { useCreatePayment, useCustomers } from '../hooks/usePayments'
import { usePermissions } from '../hooks/usePermissions'
import { LoadingState } from './LoadingState'

type FormValues = {
  amount: number
  currency: string
  customerId: number
}

export function CreatePaymentForm({ onCreated }: { onCreated?: () => void }) {
  const { canCreatePayments } = usePermissions()
  const customers = useCustomers()
  const create = useCreatePayment()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      amount: 10,
      currency: 'USD',
      customerId: 0,
    },
  })

  if (!canCreatePayments) {
    return <p className="muted">Read-only role cannot create payments.</p>
  }

  if (customers.isLoading) return <LoadingState label="Loading customers…" />

  const onSubmit = handleSubmit(async (values) => {
    const body: CreatePaymentRequest = {
      amount: Number(values.amount),
      currency: values.currency.toUpperCase(),
      customerId: Number(values.customerId),
    }
    await create.mutateAsync(body)
    reset({
      amount: 10,
      currency: 'USD',
      customerId: customers.data?.[0]?.id ?? 0,
    })
    onCreated?.()
  })

  return (
    <form className="form-card" onSubmit={onSubmit} noValidate>
      <h3>Create payment</h3>
      <div className="form-grid">
        <label>
          Amount
          <input
            type="number"
            step="0.01"
            {...register('amount', { required: true, min: 0.01, valueAsNumber: true })}
          />
          {errors.amount && <span className="field-error">Required</span>}
        </label>
        <label>
          Currency
          <input
            maxLength={3}
            {...register('currency', { required: true, minLength: 3 })}
          />
        </label>
        <label className="span-2">
          Customer
          <select
            {...register('customerId', {
              required: true,
              valueAsNumber: true,
              validate: (v) => v > 0,
            })}
            defaultValue={customers.data?.[0]?.id ?? 0}
          >
            <option value={0} disabled>
              Select customer…
            </option>
            {(customers.data ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.email})
              </option>
            ))}
          </select>
          {errors.customerId && (
            <span className="field-error">Pick a customer</span>
          )}
        </label>
      </div>
      {create.isError && (
        <p className="field-error" role="alert">
          {(create.error as Error).message}
        </p>
      )}
      <button
        type="submit"
        className="btn btn-primary"
        disabled={isSubmitting || create.isPending}
      >
        {create.isPending ? 'Creating…' : 'Create'}
      </button>
    </form>
  )
}
