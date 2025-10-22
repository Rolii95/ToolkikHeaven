'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
}

interface CartStore {
  // State
  items: CartItem[];
  isDrawerOpen: boolean;
  total: number;
  itemCount: number;
  
  // Actions
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  
  // Helpers
  getItemQuantity: (id: string) => number;
  isItemInCart: (id: string) => boolean;
}

// Helper function to calculate totals
const calculateTotals = (items: CartItem[]) => {
  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  return { total, itemCount };
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      // Initial state
      items: [],
      isDrawerOpen: false,
      total: 0,
      itemCount: 0,

      // Add item to cart
      addItem: (newItem) => {
        set((state) => {
          const existingItem = state.items.find(item => item.id === newItem.id);
          
          let updatedItems: CartItem[];
          if (existingItem) {
            // Update quantity if item exists
            updatedItems = state.items.map(item =>
              item.id === newItem.id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            );
          } else {
            // Add new item
            updatedItems = [...state.items, { ...newItem, quantity: 1 }];
          }
          
          const { total, itemCount } = calculateTotals(updatedItems);
          
          // Show a simple browser notification (optional)
          if (typeof window !== 'undefined') {
            // Create a custom event for item added
            window.dispatchEvent(new CustomEvent('cartItemAdded', {
              detail: { item: newItem }
            }));
          }
          
          return {
            items: updatedItems,
            total,
            itemCount,
            isDrawerOpen: true, // Automatically open drawer when item is added
          };
        });
      },

      // Remove item from cart
      removeItem: (id) => {
        set((state) => {
          const updatedItems = state.items.filter(item => item.id !== id);
          const { total, itemCount } = calculateTotals(updatedItems);
          
          return {
            items: updatedItems,
            total,
            itemCount,
          };
        });
      },

      // Update item quantity
      updateQuantity: (id, quantity) => {
        set((state) => {
          if (quantity <= 0) {
            // Remove item if quantity is 0 or less
            const updatedItems = state.items.filter(item => item.id !== id);
            const { total, itemCount } = calculateTotals(updatedItems);
            
            return {
              items: updatedItems,
              total,
              itemCount,
            };
          }
          
          const updatedItems = state.items.map(item =>
            item.id === id ? { ...item, quantity } : item
          );
          
          const { total, itemCount } = calculateTotals(updatedItems);
          
          return {
            items: updatedItems,
            total,
            itemCount,
          };
        });
      },

      // Clear all items from cart
      clearCart: () => {
        set({
          items: [],
          total: 0,
          itemCount: 0,
          isDrawerOpen: false,
        });
      },

      // Drawer controls
      openDrawer: () => set({ isDrawerOpen: true }),
      closeDrawer: () => set({ isDrawerOpen: false }),
      toggleDrawer: () => set((state) => ({ isDrawerOpen: !state.isDrawerOpen })),

      // Helper functions
      getItemQuantity: (id) => {
        const item = get().items.find(item => item.id === id);
        return item ? item.quantity : 0;
      },

      isItemInCart: (id) => {
        return get().items.some(item => item.id === id);
      },
    }),
    {
      name: 'aurora-cart-storage', // localStorage key
      partialize: (state) => ({
        items: state.items,
        total: state.total,
        itemCount: state.itemCount,
        // Don't persist drawer state
      }),
    }
  )
);

// Selectors for better performance
export const useCartItems = () => useCartStore(state => state.items);
export const useCartTotal = () => useCartStore(state => state.total);
export const useCartItemCount = () => useCartStore(state => state.itemCount);
export const useCartDrawer = () => useCartStore(state => ({
  isOpen: state.isDrawerOpen,
  open: state.openDrawer,
  close: state.closeDrawer,
  toggle: state.toggleDrawer,
}));