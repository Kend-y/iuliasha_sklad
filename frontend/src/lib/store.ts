import { create } from "zustand";
import { persist } from "zustand/middleware";

// Типы данных
export interface User {
  id: number;
  email: string;
  fullName: string;
  role: "admin" | "client";
}

export interface Order {
  id: number;
  description: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  updatedAt?: string;
  userId: number;
  userName: string;
  userEmail: string;
  warehouseId: number;
  warehouseName: string;
}

export interface Warehouse {
  id: number;
  name: string;
  address: string;
  description: string;
  status: "active" | "suspended" | "deleted";
  createdAt: string;
  ordersCount: number;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  orderId?: number;
  warehouseId?: number;
}

// ========== Auth Store ==========
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: (user, token) => {
        set({ user, token, isAuthenticated: true });
        if (typeof window !== "undefined") {
          localStorage.setItem("token", token);
        }
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
        if (typeof window !== "undefined") {
          localStorage.removeItem("token");
        }
      },

      updateUser: (user) => set({ user }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// ========== Notifications Store ==========
interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  setUnreadCount: (count: number) => void;
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
}

export const useNotificationsStore = create<NotificationsState>((set) => ({
  notifications: [],
  unreadCount: 0,

  setNotifications: (notifications) => set({ notifications }),

  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    })),

  setUnreadCount: (count) => set({ unreadCount: count }),

  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),

  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    })),
}));

// ========== Orders Store ==========
interface OrdersState {
  orders: Order[];
  setOrders: (orders: Order[]) => void;
  updateOrderStatus: (orderId: number, status: string) => void;
  addOrder: (order: Order) => void;
}

export const useOrdersStore = create<OrdersState>((set) => ({
  orders: [],

  setOrders: (orders) => set({ orders }),

  updateOrderStatus: (orderId, status) =>
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === orderId ? { ...o, status: status as Order["status"] } : o
      ),
    })),

  addOrder: (order) => set((state) => ({ orders: [order, ...state.orders] })),
}));
