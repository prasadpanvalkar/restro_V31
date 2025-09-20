// src/store/slices/billingSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Order } from '@/types/order.types';

interface BillingState {
  pendingBills: Order[];
  paidBills: Order[];
  analytics: any;
}

const initialState: BillingState = {
  pendingBills: [],
  paidBills: [],
  analytics: null,
};

const billingSlice = createSlice({
  name: 'billing',
  initialState,
  reducers: {
    setPendingBills: (state, action: PayloadAction<Order[]>) => {
      state.pendingBills = action.payload;
    },
    markBillPaid: (state, action: PayloadAction<number>) => {
      const bill = state.pendingBills.find(b => b.id === action.payload);
      if (bill) {
        state.paidBills.push(bill);
        state.pendingBills = state.pendingBills.filter(b => b.id !== action.payload);
      }
    },
    setAnalytics: (state, action: PayloadAction<any>) => {
      state.analytics = action.payload;
    },
  },
});

export const { setPendingBills, markBillPaid, setAnalytics } = billingSlice.actions;
export default billingSlice.reducer;