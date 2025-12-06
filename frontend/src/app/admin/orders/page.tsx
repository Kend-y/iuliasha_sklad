"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ordersApi } from "@/lib/api";
import { Order } from "@/lib/store";
import {
  Card,
  StatusBadge,
  LoadingSpinner,
  EmptyState,
  Modal,
} from "@/components/UI";
import toast from "react-hot-toast";
import {
  ClipboardDocumentListIcon,
  CubeIcon,
  UserIcon,
  EnvelopeIcon,
  BuildingStorefrontIcon,
  CalendarIcon,
  CheckIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FunnelIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadOrders();
  }, [filter, page]);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const status = filter === "all" ? undefined : filter;
      const response = await ordersApi.getAllOrders(page, 10, status);

      if (response.success) {
        setOrders(response.data);
        setTotalPages(Math.ceil(response.totalCount / 10));
      }
    } catch (error) {
      console.error("Ошибка загрузки заказов:", error);
      toast.error("Ошибка загрузки заказов");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (
    orderId: number,
    newStatus: "approved" | "rejected"
  ) => {
    setIsProcessing(true);
    try {
      const response = await ordersApi.updateOrderStatus(orderId, newStatus);

      if (response.success) {
        const statusText = newStatus === "approved" ? "одобрен" : "отклонён";
        toast.success(`Заказ #${orderId} ${statusText}`);

        setOrders(
          orders.map((o) =>
            o.id === orderId ? { ...o, status: newStatus } : o
          )
        );
        setSelectedOrder(null);
      } else {
        toast.error(response.message || "Ошибка обновления статуса");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Ошибка при обновлении");
    } finally {
      setIsProcessing(false);
    }
  };

  const filters = [
    { value: "all", label: "Все", count: 0 },
    {
      value: "pending",
      label: "В обработке",
      count: orders.filter((o) => o.status === "pending").length,
    },
    { value: "approved", label: "Одобренные", count: 0 },
    { value: "rejected", label: "Отклонённые", count: 0 },
  ];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <div className="w-14 h-14 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
          <ClipboardDocumentListIcon className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            Управление заказами
          </h1>
          <p className="text-slate-500 mt-1">
            Просматривайте и обрабатывайте заказы клиентов
          </p>
        </div>
      </motion.div>

      {/* Фильтры */}
      <div className="flex gap-2 flex-wrap items-center">
        <FunnelIcon className="w-5 h-5 text-slate-400" />
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => {
              setFilter(f.value);
              setPage(1);
            }}
            className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
              filter === f.value
                ? "bg-indigo-500 text-white shadow-lg shadow-indigo-200"
                : "bg-white text-slate-600 hover:bg-slate-50 border-2 border-slate-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Список заказов */}
      {isLoading ? (
        <LoadingSpinner text="Загрузка заказов..." />
      ) : orders.length === 0 ? (
        <Card glass>
          <EmptyState
            icon={<CubeIcon className="w-full h-full" />}
            title="Заказы не найдены"
            description={
              filter === "all"
                ? "Пока нет заказов"
                : `Нет заказов со статусом "${
                    filters.find((f) => f.value === filter)?.label
                  }"`
            }
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order, index) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card
                hoverable
                onClick={() =>
                  order.status === "pending" && setSelectedOrder(order)
                }
                borderColor={
                  order.status === "pending"
                    ? "amber"
                    : order.status === "approved"
                    ? "emerald"
                    : "rose"
                }
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${
                        order.status === "pending"
                          ? "bg-amber-100 border-2 border-amber-200"
                          : order.status === "approved"
                          ? "bg-emerald-100 border-2 border-emerald-200"
                          : "bg-rose-100 border-2 border-rose-200"
                      }`}
                    >
                      <span
                        className={`font-bold text-lg ${
                          order.status === "pending"
                            ? "text-amber-600"
                            : order.status === "approved"
                            ? "text-emerald-600"
                            : "text-rose-600"
                        }`}
                      >
                        #{order.id}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 text-lg">
                        {order.description}
                      </h3>
                      <div className="flex flex-wrap gap-3 mt-2 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <UserIcon className="w-4 h-4" /> {order.userName}
                        </span>
                        <span className="flex items-center gap-1">
                          <EnvelopeIcon className="w-4 h-4" /> {order.userEmail}
                        </span>
                        <span className="flex items-center gap-1">
                          <BuildingStorefrontIcon className="w-4 h-4" />{" "}
                          {order.warehouseName}
                        </span>
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="w-4 h-4" />{" "}
                          {new Date(order.createdAt).toLocaleDateString(
                            "ru-RU"
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={order.status} />
                    {order.status === "pending" && (
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateStatus(order.id, "approved");
                          }}
                          className="px-4 py-2 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors flex items-center gap-1 shadow-sm shadow-emerald-200"
                          disabled={isProcessing}
                        >
                          <CheckIcon className="w-4 h-4" />
                          Одобрить
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateStatus(order.id, "rejected");
                          }}
                          className="px-4 py-2 bg-rose-500 text-white rounded-xl font-medium hover:bg-rose-600 transition-colors flex items-center gap-1 shadow-sm shadow-rose-200"
                          disabled={isProcessing}
                        >
                          <XMarkIcon className="w-4 h-4" />
                          Отклонить
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Пагинация */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-white text-slate-700 rounded-xl border-2 border-slate-200 disabled:opacity-50 flex items-center gap-1 hover:bg-slate-50 transition-colors"
          >
            <ChevronLeftIcon className="w-5 h-5" />
            Назад
          </button>
          <span className="flex items-center px-4 text-slate-600">
            Страница {page} из {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 bg-white text-slate-700 rounded-xl border-2 border-slate-200 disabled:opacity-50 flex items-center gap-1 hover:bg-slate-50 transition-colors"
          >
            Вперёд
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Модальное окно для деталей заказа */}
      <AnimatePresence>
        {selectedOrder && (
          <Modal
            isOpen={true}
            onClose={() => setSelectedOrder(null)}
            title={`Заказ #${selectedOrder.id}`}
          >
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-700">Описание</h4>
                <p className="text-gray-900 mt-1">
                  {selectedOrder.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-700">Клиент</h4>
                  <p className="text-gray-900 mt-1">{selectedOrder.userName}</p>
                  <p className="text-gray-500 text-sm">
                    {selectedOrder.userEmail}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700">Склад</h4>
                  <p className="text-gray-900 mt-1">
                    {selectedOrder.warehouseName}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-700">Дата создания</h4>
                <p className="text-gray-900 mt-1">
                  {new Date(selectedOrder.createdAt).toLocaleString("ru-RU")}
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <motion.button
                  onClick={() =>
                    handleUpdateStatus(selectedOrder.id, "approved")
                  }
                  className="flex-1 px-4 py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                  disabled={isProcessing}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <CheckIcon className="w-5 h-5" />
                  {isProcessing ? "Обработка..." : "Одобрить заказ"}
                </motion.button>
                <motion.button
                  onClick={() =>
                    handleUpdateStatus(selectedOrder.id, "rejected")
                  }
                  className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                  disabled={isProcessing}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <XMarkIcon className="w-5 h-5" />
                  {isProcessing ? "Обработка..." : "Отклонить"}
                </motion.button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}
