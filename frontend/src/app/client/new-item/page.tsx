"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { itemsApi, categoriesApi, warehousesApi, storageLocationsApi } from "@/lib/api";
import { Category, Warehouse, StorageLocation } from "@/lib/store";
import { Card, LoadingSpinner } from "@/components/UI";
import toast from "react-hot-toast";
import {
  CubeIcon,
  ArrowLeftIcon,
  CheckIcon,
  PhotoIcon,
  MapPinIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

export default function NewItemPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [storageLocations, setStorageLocations] = useState<StorageLocation[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    condition: "good",
    categoryId: 0,
    warehouseId: 0,
    storageLocationId: null as number | null,
    estimatedValue: "",
    plannedReleaseDate: "",
    notes: "",
    photoUrl: "",
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (formData.warehouseId) {
      loadStorageLocations(formData.warehouseId);
    }
  }, [formData.warehouseId]);

  const loadInitialData = async () => {
    try {
      const [catRes, whRes] = await Promise.all([
        categoriesApi.getCategories(),
        warehousesApi.getWarehouses(),
      ]);

      if (catRes.success) {
        setCategories(catRes.data);
        if (catRes.data.length > 0) {
          setFormData((prev) => ({ ...prev, categoryId: catRes.data[0].id }));
        }
      }

      if (whRes.success) {
        setWarehouses(whRes.data);
        if (whRes.data.length > 0) {
          setFormData((prev) => ({ ...prev, warehouseId: whRes.data[0].id }));
        }
      }
    } catch (error) {
      console.error("Ошибка загрузки данных:", error);
      toast.error("Ошибка загрузки данных");
    } finally {
      setLoadingData(false);
    }
  };

  const loadStorageLocations = async (warehouseId: number) => {
    try {
      const response = await storageLocationsApi.getStorageLocations(warehouseId, true);
      if (response.success) {
        setStorageLocations(response.data);
      }
    } catch (error) {
      console.error("Ошибка загрузки мест хранения:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Введите название вещи");
      return;
    }

    if (!formData.categoryId) {
      toast.error("Выберите категорию");
      return;
    }

    if (!formData.warehouseId) {
      toast.error("Выберите склад");
      return;
    }

    setIsLoading(true);
    try {
      const response = await itemsApi.createItem({
        name: formData.name.trim(),
        description: formData.description.trim(),
        condition: formData.condition,
        categoryId: formData.categoryId,
        warehouseId: formData.warehouseId,
        storageLocationId: formData.storageLocationId || undefined,
        estimatedValue: formData.estimatedValue ? parseFloat(formData.estimatedValue) : undefined,
        plannedReleaseDate: formData.plannedReleaseDate || undefined,
        notes: formData.notes.trim() || undefined,
        photoUrl: formData.photoUrl.trim() || undefined,
      });

      if (response.success) {
        toast.success("Заявка на хранение создана!");
        router.push("/client/items");
      } else {
        toast.error(response.message || "Ошибка создания заявки");
      }
    } catch (error: any) {
      console.error("Ошибка:", error);
      toast.error(error.response?.data?.message || "Ошибка создания заявки");
    } finally {
      setIsLoading(false);
    }
  };

  const conditions = [
    { value: "new", label: "Новое", emoji: "✨" },
    { value: "good", label: "Хорошее", emoji: "👍" },
    { value: "fair", label: "Удовлетворительное", emoji: "👌" },
    { value: "poor", label: "Плохое", emoji: "👎" },
    { value: "damaged", label: "Повреждено", emoji: "⚠️" },
  ];

  if (loadingData) {
    return <LoadingSpinner text="Загрузка..." />;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Заголовок */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <Link
          href="/client/items"
          className="p-2 rounded-xl bg-white border-2 border-slate-200 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5 text-slate-600" />
        </Link>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-200">
            <CubeIcon className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Сдать вещь на хранение</h1>
            <p className="text-slate-500 mt-1">Заполните информацию о вещи</p>
          </div>
        </div>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Основная информация */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <InformationCircleIcon className="w-5 h-5 text-indigo-500" />
            Основная информация
          </h2>

          <div className="space-y-4">
            {/* Название */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Название вещи *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Например: Зимняя куртка, Ноутбук HP..."
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                required
              />
            </div>

            {/* Описание */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Описание
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Опишите вещь подробнее: размер, цвет, особенности..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all resize-none"
              />
            </div>

            {/* Категория */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Категория *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, categoryId: cat.id })}
                    className={`p-3 rounded-xl border-2 transition-all flex items-center gap-2 ${
                      formData.categoryId === cat.id
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <span className="text-xl">{cat.icon}</span>
                    <span className="font-medium text-sm">{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Состояние */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Состояние вещи
              </label>
              <div className="flex flex-wrap gap-2">
                {conditions.map((cond) => (
                  <button
                    key={cond.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, condition: cond.value })}
                    className={`px-4 py-2 rounded-xl border-2 transition-all flex items-center gap-2 ${
                      formData.condition === cond.value
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <span>{cond.emoji}</span>
                    <span className="font-medium">{cond.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Место хранения */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <MapPinIcon className="w-5 h-5 text-indigo-500" />
            Место хранения
          </h2>

          <div className="space-y-4">
            {/* Склад */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Склад *
              </label>
              <select
                value={formData.warehouseId}
                onChange={(e) => setFormData({ ...formData, warehouseId: Number(e.target.value), storageLocationId: null })}
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
              >
                {warehouses.map((wh) => (
                  <option key={wh.id} value={wh.id}>
                    {wh.name} — {wh.address}
                  </option>
                ))}
              </select>
            </div>

            {/* Место хранения (опционально) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Предпочтительное место (опционально)
              </label>
              <select
                value={formData.storageLocationId || ""}
                onChange={(e) => setFormData({ ...formData, storageLocationId: e.target.value ? Number(e.target.value) : null })}
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
              >
                <option value="">Автоматический выбор</option>
                {storageLocations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.code} — {loc.name} ({loc.size}, {loc.dailyRate} ₽/день)
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-1">
                Если не выбрано, сотрудник склада назначит место автоматически
              </p>
            </div>
          </div>
        </Card>

        {/* Дополнительная информация */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-indigo-500" />
            Дополнительно
          </h2>

          <div className="grid sm:grid-cols-2 gap-4">
            {/* Оценочная стоимость */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Оценочная стоимость (₽)
              </label>
              <div className="relative">
                <CurrencyDollarIcon className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  value={formData.estimatedValue}
                  onChange={(e) => setFormData({ ...formData, estimatedValue: e.target.value })}
                  placeholder="0"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                />
              </div>
            </div>

            {/* Планируемая дата выдачи */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Планируемая дата выдачи
              </label>
              <input
                type="date"
                value={formData.plannedReleaseDate}
                onChange={(e) => setFormData({ ...formData, plannedReleaseDate: e.target.value })}
                min={new Date().toISOString().split("T")[0]}
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
              />
            </div>
          </div>

          {/* Примечания */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Примечания
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Дополнительные пожелания или информация..."
              rows={2}
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all resize-none"
            />
          </div>

          {/* Фото URL */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Ссылка на фото (опционально)
            </label>
            <div className="relative">
              <PhotoIcon className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="url"
                value={formData.photoUrl}
                onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                placeholder="https://..."
                className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
              />
            </div>
          </div>
        </Card>

        {/* Кнопка отправки */}
        <motion.button
          type="submit"
          disabled={isLoading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl font-semibold shadow-lg shadow-purple-200 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Отправка...
            </>
          ) : (
            <>
              <CheckIcon className="w-5 h-5" />
              Отправить заявку на хранение
            </>
          )}
        </motion.button>
      </form>
    </div>
  );
}
