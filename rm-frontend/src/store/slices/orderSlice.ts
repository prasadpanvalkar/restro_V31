// src/store/slices/orderSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Order } from '@/types/order.types';

interface OrderState {
  orders: Order[];
  activeOrders: Order[];
  loading: boolean;
}

const initialState: OrderState = {
  orders: [],
  activeOrders: [],
  loading: false,
};

const orderSlice = createSlice({
  name: 'order',
  initialState,
  reducers: {
    setOrders: (state, action: PayloadAction<Order[]>) => {
      state.orders = action.payload;
    },
    addOrder: (state, action: PayloadAction<Order>) => {
      state.orders.push(action.payload);
    },
    updateOrderStatus: (state, action: PayloadAction<{ orderId: number; status: string }>) => {
      const order = state.orders.find(o => o.id === action.payload.orderId);
      if (order) {
        order.payment_status = action.payload.status as any;
      }
    },
  },
});

export const { setOrders, addOrder, updateOrderStatus } = orderSlice.actions;
export default orderSlice.reducer;