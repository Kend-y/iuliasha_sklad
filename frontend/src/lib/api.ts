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

// ========== Categories API ==========
export const categoriesApi = {
  getCategories: async (includeInactive = false) => {
    const response = await api.get(`/categories?includeInactive=${includeInactive}`);
    return response.data;
  },

  getAllCategories: async (includeInactive = false) => {
    const response = await api.get(`/categories?includeInactive=${includeInactive}`);
    return response.data;
  },

  getCategory: async (id: number) => {
    const response = await api.get(`/categories/${id}`);
    return response.data;
  },

  createCategory: async (name: string, description: string, icon: string) => {
    const response = await api.post("/categories", { name, description, icon });
    return response.data;
  },

  updateCategory: async (id: number, data: { name?: string; description?: string; icon?: string; isActive?: boolean }) => {
    const response = await api.put(`/categories/${id}`, data);
    return response.data;
  },

  deleteCategory: async (id: number) => {
    const response = await api.delete(`/categories/${id}`);
    return response.data;
  },
};

// ========== Storage Locations API ==========
export const storageLocationsApi = {
  getAllLocations: async (warehouseId?: number, availableOnly?: boolean, size?: string) => {
    const params = new URLSearchParams();
    if (warehouseId) params.append("warehouseId", String(warehouseId));
    if (availableOnly) params.append("availableOnly", "true");
    if (size) params.append("size", size);
    const response = await api.get(`/storagelocations?${params}`);
    return response.data;
  },

  getLocation: async (id: number) => {
    const response = await api.get(`/storagelocations/${id}`);
    return response.data;
  },

  createLocation: async (data: {
    code: string;
    name?: string;
    section?: string;
    shelf?: string;
    cell?: string;
    size?: string;
    dailyRate?: number;
    warehouseId: number;
  }) => {
    const response = await api.post("/storagelocations", data);
    return response.data;
  },

  updateLocation: async (id: number, data: { name?: string; size?: string; dailyRate?: number; status?: string }) => {
    const response = await api.put(`/storagelocations/${id}`, data);
    return response.data;
  },

  deleteLocation: async (id: number) => {
    const response = await api.delete(`/storagelocations/${id}`);
    return response.data;
  },

  // Автоматический подбор оптимального места
  suggestLocation: async (warehouseId: number, preferredSize?: string) => {
    const params = new URLSearchParams();
    params.append("warehouseId", String(warehouseId));
    if (preferredSize) params.append("preferredSize", preferredSize);
    const response = await api.get(`/storagelocations/suggest?${params}`);
    return response.data;
  },

  // Резервирование места
  reserveLocation: async (id: number, reserveHours?: number) => {
    const response = await api.post(`/storagelocations/${id}/reserve`, { reserveHours });
    return response.data;
  },

  // Снятие резервации
  unreserveLocation: async (id: number) => {
    const response = await api.post(`/storagelocations/${id}/unreserve`);
    return response.data;
  },
};

// ========== Items API ==========
export const itemsApi = {
  getMyItems: async (page = 1, pageSize = 10, status?: string, categoryId?: number) => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (status) params.append("status", status);
    if (categoryId) params.append("categoryId", String(categoryId));
    const response = await api.get(`/items/my?${params}`);
    return response.data;
  },

  getAllItems: async (page = 1, pageSize = 10, filters?: {
    status?: string;
    categoryId?: number;
    warehouseId?: number;
    ownerId?: number;
    search?: string;
  }) => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (filters?.status) params.append("status", filters.status);
    if (filters?.categoryId) params.append("categoryId", String(filters.categoryId));
    if (filters?.warehouseId) params.append("warehouseId", String(filters.warehouseId));
    if (filters?.ownerId) params.append("ownerId", String(filters.ownerId));
    if (filters?.search) params.append("search", filters.search);
    const response = await api.get(`/items?${params}`);
    return response.data;
  },

  getItem: async (id: number) => {
    const response = await api.get(`/items/${id}`);
    return response.data;
  },

  createItem: async (data: {
    name: string;
    description?: string;
    condition?: string;
    photoUrl?: string;
    estimatedValue?: number;
    plannedReleaseDate?: string;
    notes?: string;
    categoryId: number;
    warehouseId: number;
    storageLocationId?: number;
  }) => {
    const response = await api.post("/items", data);
    return response.data;
  },

  updateItem: async (id: number, data: {
    name?: string;
    description?: string;
    condition?: string;
    photoUrl?: string;
    estimatedValue?: number;
    plannedReleaseDate?: string;
    notes?: string;
    categoryId?: number;
  }) => {
    const response = await api.put(`/items/${id}`, data);
    return response.data;
  },

  // Приём вещи на хранение (сотрудник)
  intakeItem: async (id: number, storageLocationId: number, notes?: string) => {
    const response = await api.post(`/items/${id}/intake`, { storageLocationId, notes });
    return response.data;
  },

  // Приём вещи - альтернативный вызов с объектом
  intake: async (id: number, data: { storageLocationId: number; actualCondition?: string; notes?: string }) => {
    const response = await api.post(`/items/${id}/intake`, data);
    return response.data;
  },

  // Выдача вещи (сотрудник)
  releaseItem: async (id: number, notes?: string) => {
    const response = await api.post(`/items/${id}/release`, { notes });
    return response.data;
  },

  // Выдача - альтернативный вызов
  release: async (id: number, data: { notes?: string }) => {
    const response = await api.post(`/items/${id}/release`, data);
    return response.data;
  },

  // Запрос выдачи (клиент)
  requestRelease: async (id: number) => {
    const response = await api.post(`/items/${id}/request-release`);
    return response.data;
  },

  // Перемещение вещи (сотрудник)
  moveItem: async (id: number, newStorageLocationId: number, notes?: string) => {
    const response = await api.post(`/items/${id}/move`, { newStorageLocationId, notes });
    return response.data;
  },

  // Перемещение - альтернативный вызов
  move: async (id: number, data: { newStorageLocationId: number; notes?: string }) => {
    const response = await api.post(`/items/${id}/move`, data);
    return response.data;
  },

  // История перемещений
  getItemHistory: async (id: number) => {
    const response = await api.get(`/items/${id}/history`);
    return response.data;
  },
};

export default api;
