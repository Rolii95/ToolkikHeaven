import {configureStore} from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import productsReducer from './slices/productsSlice';
import cartReducer from './slices/cartSlice';
import ordersReducer from './slices/ordersSlice';
import notificationsReducer from './slices/notificationsSlice';

type ConfigureStoreOptions = Parameters<typeof configureStore>[0];
type MiddlewareFactory = Exclude<ConfigureStoreOptions['middleware'], undefined>;

const configureMiddleware: MiddlewareFactory = (getDefaultMiddleware) =>
  getDefaultMiddleware({
    serializableCheck: {
      ignoredActions: ['persist/PERSIST'],
    },
  });

const reducer = {
  auth: authReducer,
  products: productsReducer,
  cart: cartReducer,
  orders: ordersReducer,
  notifications: notificationsReducer,
};

export const store = configureStore({
  reducer,
  middleware: configureMiddleware,
});

type ReducerMap = typeof reducer;
export type RootState = {
  [Key in keyof ReducerMap]: ReturnType<ReducerMap[Key]>;
};
export type AppDispatch = typeof store.dispatch;
