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

// ========== Items Types ==========
export interface Category {
  id: number;
  name: string;
  description: string;
  icon: string;
  itemsCount: number;
  isActive: boolean;
}

export interface StorageLocation {
  id: number;
  code: string;
  name: string;
  section: string;
  shelf: string;
  cell: string;
  size: "small" | "medium" | "large" | "extra_large";
  isOccupied: boolean;
  isActive: boolean;
  dailyRate: number;
  status: "active" | "maintenance" | "reserved";
  reservedUntil?: string;
  warehouseId: number;
  warehouseName: string;
  itemsCount: number;
  currentItemName?: string;
}

export interface Item {
  id: number;
  uniqueCode: string;
  name: string;
  description: string;
  condition: "new" | "good" | "fair" | "poor" | "damaged";
  status: "pending_intake" | "stored" | "pending_release" | "released" | "disposed";
  photoUrl?: string;
  estimatedValue?: number;
  dailyStorageCost: number;
  intakeDate?: string;
  plannedReleaseDate?: string;
  actualReleaseDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  ownerId: number;
  ownerName: string;
  ownerEmail: string;
  categoryId: number;
  categoryName: string;
  categoryIcon: string;
  storageLocationId?: number;
  storageLocationCode?: string;
  warehouseId: number;
  warehouseName: string;
  storageDays: number;
  totalStorageCost: number;
}

export interface ItemMovement {
  id: number;
  actionType: string;
  description: string;
  fromLocationId?: number;
  fromLocationCode?: string;
  toLocationId?: number;
  toLocationCode?: string;
  previousCondition?: string;
  newCondition?: string;
  previousStatus?: string;
  newStatus?: string;
  notes?: string;
  createdAt: string;
  itemId: number;
  itemName: string;
  performedById: number;
  performedByName: string;
}

// ========== Items Store ==========
interface ItemsState {
  items: Item[];
  setItems: (items: Item[]) => void;
  updateItemStatus: (itemId: number, status: Item["status"]) => void;
  addItem: (item: Item) => void;
}

export const useItemsStore = create<ItemsState>((set) => ({
  items: [],

  setItems: (items) => set({ items }),

  updateItemStatus: (itemId, status) =>
    set((state) => ({
      items: state.items.map((i) =>
        i.id === itemId ? { ...i, status } : i
      ),
    })),

  addItem: (item) => set((state) => ({ items: [item, ...state.items] })),
}));
