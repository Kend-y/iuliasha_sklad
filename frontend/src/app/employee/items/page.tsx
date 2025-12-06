"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { itemsApi, categoriesApi } from "@/lib/api";
import { Item, Category } from "@/lib/store";
import { Card, StatusBadge, LoadingSpinner } from "@/components/UI";
import toast from "react-hot-toast";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  CubeIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";

const statusOptions = [
  { value: "", label: "Все статусы" },
  { value: "pending_intake", label: "Ожидают приёма" },
  { value: "stored", label: "На хранении" },
  { value: "pending_release", label: "Ожидают выдачи" },
  { value: "released", label: "Выдано" },
];

const statusLabels: Record<string, { label: string; type: "success" | "warning" | "error" | "neutral" }> = {
  pending_intake: { label: "Ожидает приёма", type: "warning" },
  stored: { label: "На хранении", type: "success" },
  pending_release: { label: "Ожидает выдачи", type: "warning" },
  released: { label: "Выдано", type: "neutral" },
  disposed: { label: "Утилизировано", type: "error" },
};

export default function EmployeeItemsPage() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status") || "";

  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Фильтры
  const [filters, setFilters] = useState({
    search: "",
    status: initialStatus,
    categoryId: "",
  });

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadItems();
  }, [filters]);

  const loadCategories = async () => {
    try {
      const response = await categoriesApi.getAllCategories();
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
      const response = await itemsApi.getAllItems(1, 100, {
        status: filters.status || undefined,
        categoryId: filters.categoryId ? Number(filters.categoryId) : undefined,
      });

      if (response.success) {
        let filtered = response.data;

        // Фильтр по поиску
        if (filters.search) {
          const search = filters.search.toLowerCase();
          filtered = filtered.filter(
            (item: Item) =>
              item.name.toLowerCase().includes(search) ||
              item.uniqueCode.toLowerCase().includes(search) ||
              item.ownerName?.toLowerCase().includes(search)
          );
        }

        setItems(filtered);
      }
    } catch (error) {
      console.error("Ошибка загрузки:", error);
      toast.error("Ошибка загрузки данных");
    } finally {
      setIsLoading(false);
    }
  };

  const handleIntake = async (itemId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const response = await itemsApi.intake(itemId, {});
      if (response.success) {
        toast.success("Вещь принята на склад");
        loadItems();
      } else {
        toast.error(response.message);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Ошибка приёма");
    }
  };

  const handleRelease = async (itemId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const response = await itemsApi.release(itemId, {});
      if (response.success) {
        toast.success("Вещь выдана владельцу");
        loadItems();
      } else {
        toast.error(response.message);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Ошибка выдачи");
    }
  };

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Управление вещами</h1>
          <p className="text-slate-500">Приём, хранение и выдача вещей клиентов</p>
        </div>
      </div>

      {/* Поиск и фильтры */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Поиск */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Поиск по названию, коду или владельцу..."
              className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-0 transition-colors"
            />
          </div>

          {/* Кнопка фильтров */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-colors ${
              showFilters
                ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                : "border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <FunnelIcon className="w-5 h-5" />
            Фильтры
          </button>
        </div>

        {/* Расширенные фильтры */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-4 mt-4 border-t border-slate-200 grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Статус</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-0"
                  >
                    {statusOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Категория</label>
                  <select
                    value={filters.categoryId}
                    onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-0"
                  >
                    <option value="">Все категории</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Список вещей */}
      {isLoading ? (
        <LoadingSpinner text="Загрузка..." />
      ) : items.length === 0 ? (
        <Card className="p-12 text-center">
          <CubeIcon className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          <h3 className="text-xl font-semibold text-slate-600 mb-2">Нет вещей</h3>
          <p className="text-slate-400">Измените фильтры для поиска</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link href={`/employee/items/${item.id}`}>
                <Card className="p-4 hover:shadow-lg transition-all cursor-pointer group">
                  <div className="flex items-center gap-4">
                    {/* Иконка категории */}
                    <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-3xl group-hover:bg-indigo-50 transition-colors">
                      {item.categoryIcon || "📦"}
                    </div>

                    {/* Информация */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-800 truncate">{item.name}</h3>
                        <StatusBadge
                          status={statusLabels[item.status]?.label || item.status}
                          type={statusLabels[item.status]?.type || "neutral"}
                        />
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                        <span className="font-mono">{item.uniqueCode}</span>
                        <span>•</span>
                        <span>{item.ownerName}</span>
                        {item.storageLocationCode && (
                          <>
                            <span>•</span>
                            <span className="text-indigo-600 font-medium">
                              📍 {item.storageLocationCode}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Действия */}
                    <div className="flex items-center gap-2">
                      {item.status === "pending_intake" && (
                        <button
                          onClick={(e) => handleIntake(item.id, e)}
                          className="flex items-center gap-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl text-sm font-semibold hover:shadow-lg transition-all"
                        >
                          <ArrowDownTrayIcon className="w-4 h-4" />
                          Принять
                        </button>
                      )}

                      {item.status === "pending_release" && (
                        <button
                          onClick={(e) => handleRelease(item.id, e)}
                          className="flex items-center gap-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:shadow-lg transition-all"
                        >
                          <ArrowUpTrayIcon className="w-4 h-4" />
                          Выдать
                        </button>
                      )}

                      <span className="p-2 rounded-xl bg-slate-100 text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                        <EyeIcon className="w-5 h-5" />
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
