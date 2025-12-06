import axios from "axios";

// Базовый URL для API
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// Создаём экземпляр axios с базовыми настройками
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Интерцептор для добавления токена к запросам
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Интерцептор для обработки ошибок
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Токен истёк или невалидный
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// ========== Auth API ==========
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await api.post("/auth/login", { email, password });
    return response.data;
  },

  register: async (email: string, password: string, fullName: string) => {
    const response = await api.post("/auth/register", {
      email,
      password,
      fullName,
    });
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  },
};

// ========== Orders API ==========
export const ordersApi = {
  getMyOrders: async (page = 1, pageSize = 10, status?: string) => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    if (status) params.append("status", status);
    const response = await api.get(`/orders/my?${params}`);
    return response.data;
  },

  getAllOrders: async (
    page = 1,
    pageSize = 10,
    status?: string,
    warehouseId?: number
  ) => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    if (status) params.append("status", status);
    if (warehouseId) params.append("warehouseId", String(warehouseId));
    const response = await api.get(`/orders?${params}`);
    return response.data;
  },

  getOrder: async (id: number) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  createOrder: async (description: string, warehouseId: number) => {
    const response = await api.post("/orders", { description, warehouseId });
    return response.data;
  },

  updateOrderStatus: async (id: number, status: string) => {
    const response = await api.put(`/orders/${id}/status`, { status });
    return response.data;
  },
};

// ========== Warehouses API ==========
export const warehousesApi = {
  getWarehouses: async (includeInactive = false) => {
    const response = await api.get(
      `/warehouses?includeInactive=${includeInactive}`
    );
    return response.data;
  },

  getWarehouse: async (id: number) => {
    const response = await api.get(`/warehouses/${id}`);
    return response.data;
  },

  createWarehouse: async (
    name: string,
    address: string,
    description: string
  ) => {
    const response = await api.post("/warehouses", {
      name,
      address,
      description,
    });
    return response.data;
  },

  updateWarehouse: async (
    id: number,
    data: {
      name?: string;
      address?: string;
      description?: string;
      status?: string;
    }
  ) => {
    const response = await api.put(`/warehouses/${id}`, data);
    return response.data;
  },

  deleteWarehouse: async (id: number) => {
    const response = await api.delete(`/warehouses/${id}`);
    return response.data;
  },
};

// ========== Notifications API ==========
export const notificationsApi = {
  getNotifications: async (page = 1, pageSize = 20) => {
    const response = await api.get(
      `/notifications?page=${page}&pageSize=${pageSize}`
    );
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await api.get("/notifications/unread-count");
    return response.data;
  },

  markAsRead: async (id: number) => {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await api.put("/notifications/read-all");
    return response.data;
  },
};

// ========== History API ==========
export const historyApi = {
  getHistory: async (page = 1, pageSize = 20, actionType?: string) => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    if (actionType) params.append("actionType", actionType);
    const response = await api.get(`/history?${params}`);
    return response.data;
  },

  getStats: async () => {
    const response = await api.get("/history/stats");
    return response.data;
  },
};

export default api;
