import { useForm } from 'react-hook-form'
import type { CreatePaymentRequest } from '../types/payment'
import { useCreatePayment } from '../hooks/usePayments'
import { usePermissions } from '../hooks/usePermissions'

type FormValues = {
  amount: number
  currency: string
  merchantId: string
  customerEmail: string
  reference: string
}

export function CreatePaymentForm({ onCreated }: { onCreated?: () => void }) {
  const { canCreatePayments } = usePermissions()
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
      merchantId: 'mrc_demo',
      customerEmail: 'customer@example.com',
      reference: '',
    },
  })

  if (!canCreatePayments) {
    return (
      <p className="muted">Read-only role cannot create payments.</p>
    )
  }

  const onSubmit = handleSubmit(async (values) => {
    const body: CreatePaymentRequest = {
      amount: Number(values.amount),
      currency: values.currency,
      merchantId: values.merchantId,
      customerEmail: values.customerEmail,
      reference: values.reference || undefined,
    }
    await create.mutateAsync(body)
    reset()
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
            {...register('amount', { required: true, min: 0.01 })}
          />
          {errors.amount && <span className="field-error">Required</span>}
        </label>
        <label>
          Currency
          <input {...register('currency', { required: true, minLength: 3 })} />
        </label>
        <label>
          Merchant ID
          <input {...register('merchantId', { required: true })} />
        </label>
        <label>
          Customer email
          <input
            type="email"
            {...register('customerEmail', { required: true })}
          />
        </label>
        <label className="span-2">
          Reference (optional)
          <input {...register('reference')} />
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
