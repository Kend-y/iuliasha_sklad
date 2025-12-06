"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { storageLocationsApi, warehousesApi } from "@/lib/api";
import { StorageLocation } from "@/lib/store";
import { Card, StatusBadge, LoadingSpinner } from "@/components/UI";
import toast from "react-hot-toast";
import {
  MapPinIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CubeIcon,
  CheckCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const sizeOptions = [
  { value: "small", label: "Маленький (S)", icon: "📦" },
  { value: "medium", label: "Средний (M)", icon: "📦📦" },
  { value: "large", label: "Большой (L)", icon: "📦📦📦" },
  { value: "extra_large", label: "Очень большой (XL)", icon: "🏠" },
];

const sizeLabels: Record<string, { label: string; color: string }> = {
  small: { label: "S", color: "bg-slate-100 text-slate-600" },
  medium: { label: "M", color: "bg-blue-100 text-blue-600" },
  large: { label: "L", color: "bg-purple-100 text-purple-600" },
  extra_large: { label: "XL", color: "bg-amber-100 text-amber-600" },
};

interface Warehouse {
  id: number;
  name: string;
}

export default function EmployeeLocationsPage() {
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<StorageLocation | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Фильтры
  const [filters, setFilters] = useState({
    search: "",
    warehouseId: "",
    size: "",
    occupied: "",
  });

  // Форма
  const [form, setForm] = useState({
    warehouseId: "",
    code: "",
    section: "",
    shelf: "",
    cell: "",
    size: "medium",
    dailyRate: "",
    description: "",
  });

  useEffect(() => {
    loadWarehouses();
    loadLocations();
  }, []);

  const loadWarehouses = async () => {
    try {
      const response = await warehousesApi.getAllWarehouses();
      if (response.success) {
        setWarehouses(response.data);
      }
    } catch (error) {
      console.error("Ошибка загрузки складов:", error);
    }
  };

  const loadLocations = async () => {
    setIsLoading(true);
    try {
      const response = await storageLocationsApi.getAllLocations();
      if (response.success) {
        setLocations(response.data);
      }
    } catch (error) {
      console.error("Ошибка загрузки:", error);
      toast.error("Ошибка загрузки мест хранения");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLocations = locations.filter((loc) => {
    if (filters.search) {
      const search = filters.search.toLowerCase();
      if (
        !loc.code.toLowerCase().includes(search) &&
        !loc.section?.toLowerCase().includes(search)
      ) {
        return false;
      }
    }
    if (filters.warehouseId && loc.warehouseId !== Number(filters.warehouseId)) {
      return false;
    }
    if (filters.size && loc.size !== filters.size) {
      return false;
    }
    if (filters.occupied === "true" && !loc.isOccupied) {
      return false;
    }
    if (filters.occupied === "false" && loc.isOccupied) {
      return false;
    }
    return true;
  });

  // Статистика
  const stats = {
    total: locations.length,
    available: locations.filter((l) => !l.isOccupied && l.isActive).length,
    occupied: locations.filter((l) => l.isOccupied).length,
  };

  const openCreateModal = () => {
    setEditingLocation(null);
    setForm({
      warehouseId: warehouses[0]?.id.toString() || "",
      code: "",
      section: "",
      shelf: "",
      cell: "",
      size: "medium",
      dailyRate: "100",
      description: "",
    });
    setShowModal(true);
  };

  const openEditModal = (loc: StorageLocation) => {
    setEditingLocation(loc);
    setForm({
      warehouseId: loc.warehouseId.toString(),
      code: loc.code,
      section: loc.section || "",
      shelf: loc.shelf || "",
      cell: loc.cell || "",
      size: loc.size,
      dailyRate: loc.dailyRate.toString(),
      description: loc.description || "",
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.warehouseId || !form.code || !form.dailyRate) {
      toast.error("Заполните обязательные поля");
      return;
    }

    setIsSubmitting(true);
    try {
      const data = {
        warehouseId: Number(form.warehouseId),
        code: form.code,
        section: form.section || undefined,
        shelf: form.shelf || undefined,
        cell: form.cell || undefined,
        size: form.size,
        dailyRate: Number(form.dailyRate),
        description: form.description || undefined,
      };

      let response;
      if (editingLocation) {
        response = await storageLocationsApi.updateLocation(editingLocation.id, data);
      } else {
        response = await storageLocationsApi.createLocation(data);
      }

      if (response.success) {
        toast.success(editingLocation ? "Место обновлено" : "Место создано");
        setShowModal(false);
        loadLocations();
      } else {
        toast.error(response.message);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Ошибка сохранения");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (loc: StorageLocation) => {
    if (loc.isOccupied) {
      toast.error("Нельзя удалить занятое место");
      return;
    }

    if (!confirm(`Удалить место ${loc.code}?`)) return;

    try {
      const response = await storageLocationsApi.deleteLocation(loc.id);
      if (response.success) {
        toast.success("Место удалено");
        loadLocations();
      } else {
        toast.error(response.message);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Ошибка удаления");
    }
  };

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Места хранения</h1>
          <p className="text-slate-500">Управление ячейками и полками склада</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
        >
          <PlusIcon className="w-5 h-5" />
          Добавить место
        </button>
      </div>

      {/* Статистика */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-200 rounded-xl flex items-center justify-center">
              <MapPinIcon className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
              <p className="text-sm text-slate-500">Всего мест</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircleIcon className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-700">{stats.available}</p>
              <p className="text-sm text-green-600">Свободно</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <CubeIcon className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-700">{stats.occupied}</p>
              <p className="text-sm text-amber-600">Занято</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Поиск и фильтры */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Поиск по коду или секции..."
              className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-0 transition-colors"
            />
          </div>

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

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-4 mt-4 border-t border-slate-200 grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Склад</label>
                  <select
                    value={filters.warehouseId}
                    onChange={(e) => setFilters({ ...filters, warehouseId: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-0"
                  >
                    <option value="">Все склады</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Размер</label>
                  <select
                    value={filters.size}
                    onChange={(e) => setFilters({ ...filters, size: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-0"
                  >
                    <option value="">Любой размер</option>
                    {sizeOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Статус</label>
                  <select
                    value={filters.occupied}
                    onChange={(e) => setFilters({ ...filters, occupied: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-0"
                  >
                    <option value="">Все</option>
                    <option value="false">Свободные</option>
                    <option value="true">Занятые</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Список мест */}
      {isLoading ? (
        <LoadingSpinner text="Загрузка..." />
      ) : filteredLocations.length === 0 ? (
        <Card className="p-12 text-center">
          <MapPinIcon className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          <h3 className="text-xl font-semibold text-slate-600 mb-2">Нет мест хранения</h3>
          <p className="text-slate-400">Создайте первое место хранения</p>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredLocations.map((loc, index) => (
            <motion.div
              key={loc.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <Card
                className={`p-4 h-full flex flex-col ${
                  loc.isOccupied
                    ? "bg-gradient-to-br from-amber-50/50 to-orange-50/50 border-amber-200"
                    : loc.isActive
                    ? "bg-gradient-to-br from-green-50/50 to-emerald-50/50 border-green-200"
                    : "bg-slate-50 border-slate-200 opacity-60"
                }`}
              >
                {/* Заголовок */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-slate-800">{loc.code}</span>
                    <span
                      className={`px-2 py-0.5 rounded-lg text-xs font-bold ${
                        sizeLabels[loc.size]?.color || "bg-slate-100"
                      }`}
                    >
                      {sizeLabels[loc.size]?.label || loc.size}
                    </span>
                  </div>
                  <StatusBadge
                    status={loc.isOccupied ? "Занято" : loc.isActive ? "Свободно" : "Неактивно"}
                    type={loc.isOccupied ? "warning" : loc.isActive ? "success" : "neutral"}
                  />
                </div>

                {/* Расположение */}
                <div className="flex-1 space-y-2 text-sm">
                  {(loc.section || loc.shelf || loc.cell) && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <MapPinIcon className="w-4 h-4 text-slate-400" />
                      <span>
                        {[loc.section, loc.shelf, loc.cell].filter(Boolean).join(" → ")}
                      </span>
                    </div>
                  )}

                  {loc.currentItemName && (
                    <div className="flex items-center gap-2 text-amber-700 bg-amber-100/50 px-2 py-1 rounded-lg">
                      <CubeIcon className="w-4 h-4" />
                      <span className="truncate">{loc.currentItemName}</span>
                    </div>
                  )}

                  <div className="text-lg font-bold text-indigo-600">
                    {loc.dailyRate} ₽<span className="text-xs font-normal text-slate-500">/день</span>
                  </div>
                </div>

                {/* Действия */}
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-200">
                  <button
                    onClick={() => openEditModal(loc)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 text-sm font-medium transition-colors"
                  >
                    <PencilIcon className="w-4 h-4" />
                    Изменить
                  </button>

                  {!loc.isOccupied && (
                    <button
                      onClick={() => handleDelete(loc)}
                      className="p-2 hover:bg-red-100 rounded-lg text-red-500 transition-colors"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Модальное окно */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-slate-800">
                {editingLocation ? "Редактировать место" : "Новое место хранения"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Склад *</label>
                <select
                  value={form.warehouseId}
                  onChange={(e) => setForm({ ...form, warehouseId: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-0"
                  required
                >
                  <option value="">Выберите склад</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Код места *</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-0"
                  placeholder="A-01-03"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Секция</label>
                  <input
                    type="text"
                    value={form.section}
                    onChange={(e) => setForm({ ...form, section: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-0"
                    placeholder="A"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Полка</label>
                  <input
                    type="text"
                    value={form.shelf}
                    onChange={(e) => setForm({ ...form, shelf: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-0"
                    placeholder="01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ячейка</label>
                  <input
                    type="text"
                    value={form.cell}
                    onChange={(e) => setForm({ ...form, cell: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-0"
                    placeholder="03"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Размер</label>
                <select
                  value={form.size}
                  onChange={(e) => setForm({ ...form, size: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-0"
                >
                  {sizeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.icon} {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Тариф (₽/день) *
                </label>
                <input
                  type="number"
                  value={form.dailyRate}
                  onChange={(e) => setForm({ ...form, dailyRate: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-0"
                  min="0"
                  step="10"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Описание</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-0 resize-none"
                  placeholder="Дополнительная информация..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-semibold disabled:opacity-50 transition-all"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircleIcon className="w-5 h-5" />
                    {editingLocation ? "Сохранить" : "Создать"}
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
