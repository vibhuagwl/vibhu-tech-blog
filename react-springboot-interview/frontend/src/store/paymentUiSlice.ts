import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { PaymentStatus } from '../types/payment'

/**
 * Tiny UI slice — interview talking point:
 * Redux for cross-cutting client UI prefs; TanStack Query for server cache.
 */
interface PaymentUiState {
  lastSelectedId: string | null
  preferredStatusFilter: PaymentStatus | ''
  createFormOpen: boolean
}

const initialState: PaymentUiState = {
  lastSelectedId: null,
  preferredStatusFilter: '',
  createFormOpen: false,
}

const paymentUiSlice = createSlice({
  name: 'paymentUi',
  initialState,
  reducers: {
    selectPayment(state, action: PayloadAction<string | null>) {
      state.lastSelectedId = action.payload
    },
    setPreferredStatus(state, action: PayloadAction<PaymentStatus | ''>) {
      state.preferredStatusFilter = action.payload
    },
    setCreateFormOpen(state, action: PayloadAction<boolean>) {
      state.createFormOpen = action.payload
    },
  },
})

export const { selectPayment, setPreferredStatus, setCreateFormOpen } =
  paymentUiSlice.actions
export default paymentUiSlice.reducer
