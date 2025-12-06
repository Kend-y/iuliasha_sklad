"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { historyApi } from "@/lib/api";
import { Card, LoadingSpinner, EmptyState } from "@/components/UI";
import {
  ClockIcon,
  CubeIcon,
  CheckCircleIcon,
  XCircleIcon,
  BuildingStorefrontIcon,
  PauseIcon,
  PlayIcon,
  TrashIcon,
  DocumentTextIcon,
  UserIcon,
  FunnelIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { ReactNode } from "react";

interface ActionHistory {
  id: number;
  actionType: string;
  description: string;
  createdAt: string;
  userName: string | null;
  userEmail: string | null;
  orderId: number | null;
  warehouseId: number | null;
}

export default function AdminHistoryPage() {
  const [history, setHistory] = useState<ActionHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadHistory();
  }, [filter, page]);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const actionType = filter === "all" ? undefined : filter;
      const response = await historyApi.getHistory(page, 15, actionType);

      if (response.success) {
        setHistory(response.data);
        setTotalPages(Math.ceil(response.totalCount / 15));
      }
    } catch (error) {
      console.error("Ошибка загрузки истории:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const actionTypeConfig: Record<
    string,
    { icon: ReactNode; label: string; color: string; glassColor: string }
  > = {
    order_created: {
      icon: <CubeIcon className="w-5 h-5" />,
      label: "Создание заказа",
      color: "bg-blue-100 text-blue-800",
      glassColor: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    },
    order_approved: {
      icon: <CheckCircleIcon className="w-5 h-5" />,
      label: "Одобрение заказа",
      color: "bg-green-100 text-green-800",
      glassColor: "bg-green-500/20 text-green-400 border-green-500/30",
    },
    order_rejected: {
      icon: <XCircleIcon className="w-5 h-5" />,
      label: "Отклонение заказа",
      color: "bg-red-100 text-red-800",
      glassColor: "bg-red-500/20 text-red-400 border-red-500/30",
    },
    warehouse_created: {
      icon: <BuildingStorefrontIcon className="w-5 h-5" />,
      label: "Создание склада",
      color: "bg-purple-100 text-purple-800",
      glassColor: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    },
    warehouse_suspended: {
      icon: <PauseIcon className="w-5 h-5" />,
      label: "Приостановка склада",
      color: "bg-orange-100 text-orange-800",
      glassColor: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    },
    warehouse_activated: {
      icon: <PlayIcon className="w-5 h-5" />,
      label: "Активация склада",
      color: "bg-green-100 text-green-800",
      glassColor: "bg-green-500/20 text-green-400 border-green-500/30",
    },
    warehouse_deleted: {
      icon: <TrashIcon className="w-5 h-5" />,
      label: "Удаление склада",
      color: "bg-red-100 text-red-800",
      glassColor: "bg-red-500/20 text-red-400 border-red-500/30",
    },
  };

  const filters = [
    { value: "all", label: "Все действия" },
    { value: "order_created", label: "Создание заказов" },
    { value: "order_approved", label: "Одобрения" },
    { value: "order_rejected", label: "Отклонения" },
    { value: "warehouse_created", label: "Создание складов" },
  ];

  const getActionConfig = (actionType: string) => {
    return (
      actionTypeConfig[actionType] || {
        icon: <DocumentTextIcon className="w-5 h-5" />,
        label: actionType,
        color: "bg-gray-100 text-gray-800",
        glassColor: "bg-white/20 text-white/80 border-white/30",
      }
    );
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-200">
          <ClockIcon className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            История действий
          </h1>
          <p className="text-slate-500 mt-1">
            Просматривайте все действия в системе
          </p>
        </div>
      </motion.div>

      {/* Фильтры */}
      <Card borderColor="amber" className="p-4">
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
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </Card>

      {/* История */}
      {isLoading ? (
        <LoadingSpinner text="Загрузка истории..." />
      ) : history.length === 0 ? (
        <Card borderColor="amber">
          <EmptyState
            icon={<ClockIcon className="w-full h-full" />}
            title="История пуста"
            description="Пока нет записей в истории"
          />
        </Card>
      ) : (
        <Card borderColor="amber">
          <div className="space-y-2">
            {history.map((item, index) => {
              const config = getActionConfig(item.actionType);

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="flex items-start gap-4 p-4 rounded-xl transition-colors border-2 border-transparent hover:border-slate-100 hover:bg-slate-50"
                >
                  {/* Иконка */}
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${config.color}`}
                  >
                    {config.icon}
                  </div>

                  {/* Контент */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}
                      >
                        {config.label}
                      </span>
                      {item.orderId && (
                        <span className="text-xs text-slate-500">
                          Заказ #{item.orderId}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-800 mt-1">{item.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-sm text-slate-500">
                      {item.userName && (
                        <span className="flex items-center gap-1">
                          <UserIcon className="w-4 h-4" /> {item.userName}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <ClockIcon className="w-4 h-4" />{" "}
                        {new Date(item.createdAt).toLocaleString("ru-RU")}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Пагинация */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-white border-2 border-slate-200 text-slate-700 rounded-xl disabled:opacity-30 flex items-center gap-1 hover:bg-slate-50 transition-colors"
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
            className="px-4 py-2 bg-white border-2 border-slate-200 text-slate-700 rounded-xl disabled:opacity-30 flex items-center gap-1 hover:bg-slate-50 transition-colors"
          >
            Вперёд
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
