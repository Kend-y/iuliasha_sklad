"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { itemsApi } from "@/lib/api";
import { Item, ItemMovement } from "@/lib/store";
import { Card, StatusBadge, LoadingSpinner } from "@/components/UI";
import toast from "react-hot-toast";
import {
  CubeIcon,
  ArrowLeftIcon,
  MapPinIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  ClockIcon,
  ArrowUpTrayIcon,
  ArrowPathIcon,
  UserIcon,
  TagIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";

const statusLabels: Record<string, { label: string; color: string }> = {
  pending_intake: { label: "Ожидает приёма", color: "yellow" },
  stored: { label: "На хранении", color: "green" },
  pending_release: { label: "Ожидает выдачи", color: "blue" },
  released: { label: "Выдано", color: "gray" },
  disposed: { label: "Утилизировано", color: "red" },
};

const conditionLabels: Record<string, { label: string; emoji: string }> = {
  new: { label: "Новое", emoji: "✨" },
  good: { label: "Хорошее", emoji: "👍" },
  fair: { label: "Удовлетворительное", emoji: "👌" },
  poor: { label: "Плохое", emoji: "👎" },
  damaged: { label: "Повреждено", emoji: "⚠️" },
};

const actionTypeLabels: Record<string, { label: string; color: string }> = {
  intake: { label: "Приём", color: "bg-green-100 text-green-700" },
  release: { label: "Выдача", color: "bg-blue-100 text-blue-700" },
  move: { label: "Перемещение", color: "bg-purple-100 text-purple-700" },
  condition_change: { label: "Изменение состояния", color: "bg-amber-100 text-amber-700" },
  status_change: { label: "Изменение статуса", color: "bg-slate-100 text-slate-700" },
};

export default function ItemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const itemId = Number(params.id);

  const [item, setItem] = useState<Item | null>(null);
  const [history, setHistory] = useState<ItemMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    loadItem();
    loadHistory();
  }, [itemId]);

  const loadItem = async () => {
    setIsLoading(true);
    try {
      const response = await itemsApi.getItem(itemId);
      if (response.success) {
        setItem(response.data);
      } else {
        toast.error("Вещь не найдена");
        router.push("/client/items");
      }
    } catch (error: any) {
      console.error("Ошибка:", error);
      toast.error("Ошибка загрузки данных");
      router.push("/client/items");
    } finally {
      setIsLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const response = await itemsApi.getItemHistory(itemId);
      if (response.success) {
        setHistory(response.data);
      }
    } catch (error) {
      console.error("Ошибка загрузки истории:", error);
    }
  };

  const handleRequestRelease = async () => {
    if (!item) return;
    setIsRequesting(true);
    try {
      const response = await itemsApi.requestRelease(item.id);
      if (response.success) {
        toast.success("Запрос на выдачу отправлен");
        loadItem();
        loadHistory();
      } else {
        toast.error(response.message);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Ошибка отправки запроса");
    } finally {
      setIsRequesting(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner text="Загрузка..." />;
  }

  if (!item) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Заголовок */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <Link
            href="/client/items"
            className="p-2 rounded-xl bg-white border-2 border-slate-200 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 text-slate-600" />
          </Link>
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-3xl">
            {item.categoryIcon || "📦"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-800">{item.name}</h1>
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
            </div>
            <p className="text-slate-500 font-mono text-sm mt-1">{item.uniqueCode}</p>
          </div>
        </div>

        {item.status === "stored" && (
          <button
            onClick={handleRequestRelease}
            disabled={isRequesting}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 transition-all"
          >
            {isRequesting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Отправка...
              </>
            ) : (
              <>
                <ArrowUpTrayIcon className="w-5 h-5" />
                Запросить выдачу
              </>
            )}
          </button>
        )}
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Основная информация */}
        <div className="lg:col-span-2 space-y-6">
          {/* Описание */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <InformationCircleIcon className="w-5 h-5 text-indigo-500" />
              Информация о вещи
            </h2>

            <div className="space-y-4">
              {item.description && (
                <div>
                  <label className="text-sm text-slate-500">Описание</label>
                  <p className="text-slate-800 mt-1">{item.description}</p>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-500">Категория</label>
                  <p className="text-slate-800 mt-1 flex items-center gap-2">
                    <span className="text-xl">{item.categoryIcon}</span>
                    {item.categoryName}
                  </p>
                </div>

                <div>
                  <label className="text-sm text-slate-500">Состояние</label>
                  <p className="text-slate-800 mt-1 flex items-center gap-2">
                    <span>{conditionLabels[item.condition]?.emoji || "📦"}</span>
                    {conditionLabels[item.condition]?.label || item.condition}
                  </p>
                </div>

                {item.estimatedValue && (
                  <div>
                    <label className="text-sm text-slate-500">Оценочная стоимость</label>
                    <p className="text-slate-800 mt-1 flex items-center gap-2">
                      <CurrencyDollarIcon className="w-5 h-5 text-green-500" />
                      {item.estimatedValue.toLocaleString()} ₽
                    </p>
                  </div>
                )}

                <div>
                  <label className="text-sm text-slate-500">Склад</label>
                  <p className="text-slate-800 mt-1">{item.warehouseName}</p>
                </div>
              </div>

              {item.notes && (
                <div>
                  <label className="text-sm text-slate-500">Примечания</label>
                  <p className="text-slate-800 mt-1 bg-slate-50 p-3 rounded-xl">{item.notes}</p>
                </div>
              )}
            </div>
          </Card>

          {/* История перемещений */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <ClockIcon className="w-5 h-5 text-indigo-500" />
              История ({history.length})
            </h2>

            {history.length === 0 ? (
              <p className="text-slate-500 text-center py-8">История пуста</p>
            ) : (
              <div className="space-y-4">
                {history.map((movement, index) => (
                  <motion.div
                    key={movement.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex gap-4"
                  >
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          actionTypeLabels[movement.actionType]?.color || "bg-slate-100"
                        }`}
                      >
                        {movement.actionType === "intake" && <ArrowPathIcon className="w-5 h-5" />}
                        {movement.actionType === "release" && <ArrowUpTrayIcon className="w-5 h-5" />}
                        {movement.actionType === "move" && <MapPinIcon className="w-5 h-5" />}
                        {movement.actionType === "condition_change" && <TagIcon className="w-5 h-5" />}
                        {movement.actionType === "status_change" && <CubeIcon className="w-5 h-5" />}
                      </div>
                      {index < history.length - 1 && (
                        <div className="w-0.5 h-full bg-slate-200 my-2" />
                      )}
                    </div>

                    <div className="flex-1 pb-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2 py-1 rounded-lg text-xs font-medium ${
                            actionTypeLabels[movement.actionType]?.color || "bg-slate-100"
                          }`}
                        >
                          {actionTypeLabels[movement.actionType]?.label || movement.actionType}
                        </span>
                        <span className="text-xs text-slate-400">
                          {new Date(movement.createdAt).toLocaleString("ru")}
                        </span>
                      </div>

                      <p className="text-slate-800 mt-2">{movement.description}</p>

                      <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
                        <UserIcon className="w-4 h-4" />
                        {movement.performedByName}
                      </div>

                      {movement.notes && (
                        <p className="text-sm text-slate-500 mt-2 bg-slate-50 p-2 rounded-lg">
                          {movement.notes}
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Боковая панель */}
        <div className="space-y-6">
          {/* Хранение */}
          <Card className="p-6">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <MapPinIcon className="w-5 h-5 text-indigo-500" />
              Хранение
            </h3>

            <div className="space-y-3">
              {item.storageLocationCode ? (
                <div className="bg-indigo-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-indigo-600">{item.storageLocationCode}</p>
                  <p className="text-sm text-indigo-500 mt-1">Место хранения</p>
                </div>
              ) : (
                <div className="bg-slate-50 rounded-xl p-4 text-center">
                  <p className="text-slate-500">Место не назначено</p>
                </div>
              )}

              {item.intakeDate && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Дата приёма:</span>
                  <span className="text-slate-800 font-medium">
                    {new Date(item.intakeDate).toLocaleDateString("ru")}
                  </span>
                </div>
              )}

              {item.plannedReleaseDate && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">План. выдача:</span>
                  <span className="text-slate-800 font-medium">
                    {new Date(item.plannedReleaseDate).toLocaleDateString("ru")}
                  </span>
                </div>
              )}

              {item.actualReleaseDate && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Факт. выдача:</span>
                  <span className="text-slate-800 font-medium">
                    {new Date(item.actualReleaseDate).toLocaleDateString("ru")}
                  </span>
                </div>
              )}
            </div>
          </Card>

          {/* Стоимость */}
          {item.status === "stored" && (
            <Card className="p-6 bg-gradient-to-br from-amber-50 to-orange-50">
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <CurrencyDollarIcon className="w-5 h-5 text-amber-500" />
                Стоимость хранения
              </h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Тариф:</span>
                  <span className="text-slate-800 font-medium">{item.dailyStorageCost} ₽/день</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Дней на хранении:</span>
                  <span className="text-slate-800 font-medium">{item.storageDays}</span>
                </div>

                <div className="border-t border-amber-200 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 font-medium">Итого:</span>
                    <span className="text-2xl font-bold text-amber-600">
                      {item.totalStorageCost.toFixed(0)} ₽
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Даты */}
          <Card className="p-6">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-indigo-500" />
              Даты
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Создано:</span>
                <span className="text-slate-800">
                  {new Date(item.createdAt).toLocaleDateString("ru")}
                </span>
              </div>

              {item.updatedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Обновлено:</span>
                  <span className="text-slate-800">
                    {new Date(item.updatedAt).toLocaleDateString("ru")}
                  </span>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
