import { configureStore } from '@reduxjs/toolkit'
import authReducer from './authSlice'
import paymentUiReducer from './paymentUiSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    paymentUi: paymentUiReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
