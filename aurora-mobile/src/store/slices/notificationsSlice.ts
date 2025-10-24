import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import type {Draft} from 'immer';

export interface Notification {
  id: string;
  title: string;
  body: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'order' | 'promotion';
  isRead: boolean;
  createdAt: string;
  data?: Record<string, unknown>;
}

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  pushToken: string | null;
  permissionGranted: boolean;
}

const initialState: NotificationsState = {
  notifications: [],
  unreadCount: 0,
  pushToken: null,
  permissionGranted: false,
};

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (
      state: Draft<NotificationsState>,
      action: PayloadAction<Omit<Notification, 'id' | 'isRead' | 'createdAt'>>,
    ) => {
      const notification: Notification = {
        ...action.payload,
        id: Date.now().toString(),
        isRead: false,
        createdAt: new Date().toISOString(),
      };
      state.notifications.unshift(notification);
      state.unreadCount += 1;
    },
    markAsRead: (state: Draft<NotificationsState>, action: PayloadAction<string>) => {
      const notification = state.notifications.find(
        (item) => item.id === action.payload,
      );
      if (notification && !notification.isRead) {
        notification.isRead = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    markAllAsRead: (state: Draft<NotificationsState>) => {
      state.notifications.forEach((notification) => {
        notification.isRead = true;
      });
      state.unreadCount = 0;
    },
    removeNotification: (
      state: Draft<NotificationsState>,
      action: PayloadAction<string>,
    ) => {
      const index = state.notifications.findIndex(
        (item) => item.id === action.payload,
      );
      if (index !== -1) {
        const notification = state.notifications[index];
        if (!notification.isRead) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        state.notifications.splice(index, 1);
      }
    },
    clearAll: (state: Draft<NotificationsState>) => {
      state.notifications = [];
      state.unreadCount = 0;
    },
    setPushToken: (
      state: Draft<NotificationsState>,
      action: PayloadAction<string | null>,
    ) => {
      state.pushToken = action.payload;
    },
    setPermissionGranted: (
      state: Draft<NotificationsState>,
      action: PayloadAction<boolean>,
    ) => {
      state.permissionGranted = action.payload;
    },
  },
});

export const {
  addNotification,
  markAsRead,
  markAllAsRead,
  removeNotification,
  clearAll,
  setPushToken,
  setPermissionGranted,
} = notificationsSlice.actions;

export default notificationsSlice.reducer;
