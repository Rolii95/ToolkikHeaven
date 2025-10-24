export const API_BASE_URL = 'http://localhost:3000/api';

export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  REFRESH_TOKEN: '/auth/refresh',
  
  // Product endpoints
  PRODUCTS: '/products',
  PRODUCT_BY_ID: (id: string) => `/products/${id}`,
  SEARCH_PRODUCTS: '/products/search',
  
  // Cart endpoints
  CART: '/cart',
  ADD_TO_CART: '/cart/add',
  UPDATE_CART: '/cart/update',
  REMOVE_FROM_CART: '/cart/remove',
  
  // Order endpoints
  ORDERS: '/orders',
  ORDER_BY_ID: (id: string) => `/orders/${id}`,
  CREATE_ORDER: '/orders/create',
  
  // Analytics endpoints
  ANALYTICS: '/analytics',
  TRACK_EVENT: '/analytics/track',
  
  // Push notifications
  REGISTER_PUSH_TOKEN: '/notifications/register',
};