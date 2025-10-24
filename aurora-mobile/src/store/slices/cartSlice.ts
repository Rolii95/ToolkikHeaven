import {
  createSlice,
  createAsyncThunk,
  PayloadAction,
  type ActionReducerMapBuilder,
} from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {Draft} from 'immer';

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
}

interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
  isLoading: boolean;
  error: string | null;
}

const initialState: CartState = {
  items: [],
  total: 0,
  itemCount: 0,
  isLoading: false,
  error: null,
};

const calculateTotal = (items: CartItem[]) =>
  items.reduce((total, item) => total + item.price * item.quantity, 0);

const calculateItemCount = (items: CartItem[]) =>
  items.reduce((count, item) => count + item.quantity, 0);

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Unknown error';

export const loadCartFromStorage = createAsyncThunk<
  CartItem[],
  void,
  {rejectValue: string}
>('cart/loadFromStorage', async (_unused, {rejectWithValue}) => {
  try {
    const cartData = await AsyncStorage.getItem('cart');
    return cartData ? (JSON.parse(cartData) as CartItem[]) : [];
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

export const saveCartToStorage = createAsyncThunk<
  CartItem[],
  CartItem[],
  {rejectValue: string}
>('cart/saveToStorage', async (items, {rejectWithValue}) => {
  try {
    await AsyncStorage.setItem('cart', JSON.stringify(items));
    return items;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (
      state: Draft<CartState>,
      action: PayloadAction<Omit<CartItem, 'id'>>,
    ) => {
      const existingItem = state.items.find(
        (item) => item.productId === action.payload.productId,
      );

      if (existingItem) {
        existingItem.quantity += action.payload.quantity;
      } else {
        state.items.push({
          ...action.payload,
          id: Date.now().toString(),
        });
      }

      state.total = calculateTotal(state.items);
      state.itemCount = calculateItemCount(state.items);
    },
    removeFromCart: (state: Draft<CartState>, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
      state.total = calculateTotal(state.items);
      state.itemCount = calculateItemCount(state.items);
    },
    updateQuantity: (
      state: Draft<CartState>,
      action: PayloadAction<{id: string; quantity: number}>,
    ) => {
      const item = state.items.find((current) => current.id === action.payload.id);
      if (item) {
        item.quantity = action.payload.quantity;
        if (item.quantity <= 0) {
          state.items = state.items.filter((current) => current.id !== action.payload.id);
        }
      }
      state.total = calculateTotal(state.items);
      state.itemCount = calculateItemCount(state.items);
    },
    clearCart: (state: Draft<CartState>) => {
      state.items = [];
      state.total = 0;
      state.itemCount = 0;
    },
  },
  extraReducers: (builder: ActionReducerMapBuilder<CartState>) => {
    builder
      .addCase(loadCartFromStorage.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadCartFromStorage.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
        state.total = calculateTotal(state.items);
        state.itemCount = calculateItemCount(state.items);
      })
      .addCase(loadCartFromStorage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Failed to load cart';
      })
      .addCase(saveCartToStorage.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(saveCartToStorage.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
        state.total = calculateTotal(state.items);
        state.itemCount = calculateItemCount(state.items);
      })
      .addCase(saveCartToStorage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Failed to save cart';
      });
  },
});

export const {addToCart, removeFromCart, updateQuantity, clearCart} =
  cartSlice.actions;
export default cartSlice.reducer;
