"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { itemsApi, categoriesApi } from "@/lib/api";
import { Item, Category, useItemsStore } from "@/lib/store";
import { Card, StatusBadge, LoadingSpinner, EmptyState } from "@/components/UI";
import toast from "react-hot-toast";
import {
  CubeIcon,
  PlusIcon,
  FunnelIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MapPinIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  ArrowPathIcon,
  EyeIcon,
  ArrowUpTrayIcon,
} from "@heroicons/react/24/outline";

const statusLabels: Record<string, { label: string; color: string }> = {
  pending_intake: { label: "Ожидает приёма", color: "yellow" },
  stored: { label: "На хранении", color: "green" },
  pending_release: { label: "Ожидает выдачи", color: "blue" },
  released: { label: "Выдано", color: "gray" },
  disposed: { label: "Утилизировано", color: "red" },
};

const conditionLabels: Record<string, string> = {
  new: "Новое",
  good: "Хорошее",
  fair: "Удовл.",
  poor: "Плохое",
  damaged: "Повреждено",
};

export default function ClientItemsPage() {
  const { items, setItems } = useItemsStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadItems();
  }, [statusFilter, categoryFilter, page]);

  const loadCategories = async () => {
    try {
      const response = await categoriesApi.getCategories();
      if (response.success) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error("Ошибка загрузки категорий:", error);
    }
  };

  const loadItems = async () => {
    setIsLoading(true);
    try {
      const status = statusFilter === "all" ? undefined : statusFilter;
      const response = await itemsApi.getMyItems(page, 10, status, categoryFilter || undefined);

      if (response.success) {
        setItems(response.data || []);
        setTotalPages(Math.ceil((response.totalCount || 0) / 10));
        setTotalCount(response.totalCount || 0);
      } else {
        toast.error(response.message || "Ошибка загрузки вещей");
        setItems([]);
      }
    } catch (error: any) {
      console.error("Ошибка загрузки вещей:", error);
      toast.error(error.response?.data?.message || "Ошибка загрузки вещей");
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestRelease = async (itemId: number) => {
    try {
      const response = await itemsApi.requestRelease(itemId);
      if (response.success) {
        toast.success("Запрос на выдачу отправлен");
        loadItems();
      } else {
        toast.error(response.message);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Ошибка отправки запроса");
    }
  };

  const statusFilters = [
    { value: "all", label: "Все" },
    { value: "pending_intake", label: "Ожидает приёма" },
    { value: "stored", label: "На хранении" },
    { value: "pending_release", label: "Ожидает выдачи" },
    { value: "released", label: "Выдано" },
  ];

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-4"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-200">
            <CubeIcon className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Мои вещи</h1>
            <p className="text-slate-500 mt-1">
              {totalCount} {totalCount === 1 ? "вещь" : "вещей"} на хранении
            </p>
          </div>
        </div>
        <Link
          href="/client/new-item"
          className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl font-semibold shadow-lg shadow-purple-200 hover:shadow-xl hover:scale-105 transition-all duration-200"
        >
          <PlusIcon className="w-5 h-5" />
          Сдать вещь
        </Link>
      </motion.div>

      {/* Фильтры */}
      <div className="flex gap-4 flex-wrap items-center">
        <div className="flex gap-2 items-center flex-wrap">
          <FunnelIcon className="w-5 h-5 text-slate-400" />
          {statusFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => {
                setStatusFilter(f.value);
                setPage(1);
              }}
              className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                statusFilter === f.value
                  ? "bg-indigo-500 text-white shadow-lg shadow-indigo-200"
                  : "bg-white text-slate-600 hover:bg-slate-50 border-2 border-slate-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Фильтр по категории */}
        <select
          value={categoryFilter || ""}
          onChange={(e) => {
            setCategoryFilter(e.target.value ? Number(e.target.value) : null);
            setPage(1);
          }}
          className="px-4 py-2 rounded-xl border-2 border-slate-200 bg-white text-slate-600 font-medium"
        >
          <option value="">Все категории</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.icon} {cat.name}
            </option>
          ))}
        </select>

        <button
          onClick={loadItems}
          className="p-2 rounded-xl bg-white border-2 border-slate-200 hover:bg-slate-50 transition-colors"
        >
          <ArrowPathIcon className="w-5 h-5 text-slate-500" />
        </button>
      </div>

      {/* Список вещей */}
      {isLoading ? (
        <LoadingSpinner text="Загрузка вещей..." />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<CubeIcon className="w-16 h-16" />}
          title="Нет вещей"
          description="У вас пока нет вещей на хранении. Сдайте первую вещь!"
          action={
            <Link
              href="/client/new-item"
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl font-semibold"
            >
              <PlusIcon className="w-5 h-5" />
              Сдать вещь
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4">
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="p-5 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Иконка категории */}
                    <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                      {item.categoryIcon || "📦"}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-slate-800 text-lg">
                          {item.name}
                        </h3>
                        <span className="text-xs px-2 py-1 bg-slate-100 rounded-lg text-slate-500 font-mono">
                          {item.uniqueCode}
                        </span>
                      </div>
                      
                      <p className="text-slate-500 text-sm mt-1 line-clamp-1">
                        {item.description || "Без описания"}
                      </p>
                      
                      <div className="flex items-center gap-4 mt-3 flex-wrap text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <span className="text-lg">{item.categoryIcon}</span>
                          {item.categoryName}
                        </span>
                        
                        {item.storageLocationCode && (
                          <span className="flex items-center gap-1">
                            <MapPinIcon className="w-4 h-4" />
                            {item.storageLocationCode}
                          </span>
                        )}
                        
                        {item.intakeDate && (
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="w-4 h-4" />
                            {new Date(item.intakeDate).toLocaleDateString("ru")}
                          </span>
                        )}
                        
                        {item.status === "stored" && item.storageDays > 0 && (
                          <span className="flex items-center gap-1 text-amber-600">
                            <CurrencyDollarIcon className="w-4 h-4" />
                            {item.totalStorageCost.toFixed(0)} ₽ ({item.storageDays} дн.)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <StatusBadge
                      status={statusLabels[item.status]?.label || item.status}
                      type={
                        item.status === "stored"
                          ? "success"
                          : item.status === "pending_intake" || item.status === "pending_release"
                          ? "warning"
                          : item.status === "released"
                          ? "neutral"
                          : "error"
                      }
                    />
                    
                    <span className="text-xs text-slate-400">
                      {conditionLabels[item.condition] || item.condition}
                    </span>
                    
                    <div className="flex gap-2 mt-2">
                      <Link
                        href={`/client/items/${item.id}`}
                        className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
                        title="Подробнее"
                      >
                        <EyeIcon className="w-5 h-5 text-slate-600" />
                      </Link>
                      
                      {item.status === "stored" && (
                        <button
                          onClick={() => handleRequestRelease(item.id)}
                          className="p-2 rounded-lg bg-blue-100 hover:bg-blue-200 transition-colors"
                          title="Запросить выдачу"
                        >
                          <ArrowUpTrayIcon className="w-5 h-5 text-blue-600" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Пагинация */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-xl bg-white border-2 border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          
          <span className="px-4 py-2 bg-white border-2 border-slate-200 rounded-xl font-medium">
            {page} / {totalPages}
          </span>
          
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-xl bg-white border-2 border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
