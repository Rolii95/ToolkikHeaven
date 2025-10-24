import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import type {Draft} from 'immer';

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  status:
    | 'pending'
    | 'confirmed'
    | 'processing'
    | 'shipped'
    | 'delivered'
    | 'cancelled';
  total: number;
  items: OrderItem[];
  createdAt: string;
  estimatedDelivery?: string;
  trackingNumber?: string;
}

interface OrdersState {
  orders: Order[];
  currentOrder: Order | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: OrdersState = {
  orders: [],
  currentOrder: null,
  isLoading: false,
  error: null,
};

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    setOrders: (state: Draft<OrdersState>, action: PayloadAction<Order[]>) => {
      state.orders = action.payload;
    },
    addOrder: (state: Draft<OrdersState>, action: PayloadAction<Order>) => {
      state.orders.unshift(action.payload);
    },
    updateOrderStatus: (
      state: Draft<OrdersState>,
      action: PayloadAction<{id: string; status: Order['status']}>,
    ) => {
      const order = state.orders.find((entry) => entry.id === action.payload.id);
      if (order) {
        order.status = action.payload.status;
      }
      if (state.currentOrder?.id === action.payload.id) {
        state.currentOrder.status = action.payload.status;
      }
    },
    setCurrentOrder: (
      state: Draft<OrdersState>,
      action: PayloadAction<Order | null>,
    ) => {
      state.currentOrder = action.payload;
    },
    setLoading: (state: Draft<OrdersState>, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (
      state: Draft<OrdersState>,
      action: PayloadAction<string | null>,
    ) => {
      state.error = action.payload;
    },
  },
});

export const {
  setOrders,
  addOrder,
  updateOrderStatus,
  setCurrentOrder,
  setLoading,
  setError,
} = ordersSlice.actions;

export default ordersSlice.reducer;
