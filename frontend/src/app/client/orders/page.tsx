"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ordersApi } from "@/lib/api";
import { Order, useOrdersStore } from "@/lib/store";
import { Card, StatusBadge, LoadingSpinner, EmptyState } from "@/components/UI";
import toast from "react-hot-toast";
import {
  ClipboardDocumentListIcon,
  CubeIcon,
  BuildingStorefrontIcon,
  CalendarIcon,
  ArrowPathIcon,
  PlusIcon,
  FunnelIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";

export default function ClientOrdersPage() {
  const { orders, setOrders } = useOrdersStore();
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadOrders();
  }, [filter, page]);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const status = filter === "all" ? undefined : filter;
      const response = await ordersApi.getMyOrders(page, 10, status);

      if (response.success) {
        setOrders(response.data);
        setTotalPages(Math.ceil(response.totalCount / 10));
      } else {
        toast.error(response.message || "Ошибка загрузки заказов");
      }
    } catch (error: any) {
      console.error("Ошибка загрузки заказов:", error);
      toast.error(error.response?.data?.message || "Ошибка загрузки заказов");
    } finally {
      setIsLoading(false);
    }
  };

  const filters = [
    { value: "all", label: "Все" },
    { value: "pending", label: "В обработке" },
    { value: "approved", label: "Одобренные" },
    { value: "rejected", label: "Отклонённые" },
  ];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <div className="w-14 h-14 bg-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-200">
          <ClipboardDocumentListIcon className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Мои заказы</h1>
          <p className="text-slate-500 mt-1">
            Просматривайте историю и статусы ваших заказов
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
        <Card borderColor="cyan">
          <EmptyState
            icon={<CubeIcon className="w-full h-full" />}
            title="Заказы не найдены"
            description={
              filter === "all"
                ? "У вас пока нет заказов"
                : `Нет заказов со статусом "${
                    filters.find((f) => f.value === filter)?.label
                  }"`
            }
            action={{
              label: "Создать заказ",
              onClick: () => (window.location.href = "/client/new-order"),
              icon: <PlusIcon className="w-5 h-5" />,
            }}
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
                    <div className="w-14 h-14 bg-cyan-100 rounded-xl flex items-center justify-center shrink-0 border-2 border-cyan-200">
                      <CubeIcon className="w-7 h-7 text-cyan-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 text-lg">
                        {order.description}
                      </h3>
                      <div className="flex flex-wrap gap-3 mt-2 text-sm text-slate-500">
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
                        {order.updatedAt && (
                          <span className="flex items-center gap-1">
                            <ArrowPathIcon className="w-4 h-4" /> Обновлён:{" "}
                            {new Date(order.updatedAt).toLocaleDateString(
                              "ru-RU"
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={order.status} />
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
    </div>
  );
}
