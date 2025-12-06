"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { itemsApi, storageLocationsApi } from "@/lib/api";
import { Item, ItemMovement, StorageLocation } from "@/lib/store";
import { Card, StatusBadge, LoadingSpinner } from "@/components/UI";
import toast from "react-hot-toast";
import {
  CubeIcon,
  ArrowLeftIcon,
  MapPinIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  ClockIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ArrowsRightLeftIcon,
  UserIcon,
  TagIcon,
  InformationCircleIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

const statusLabels: Record<string, { label: string; color: string }> = {
  pending_intake: { label: "Ожидает приёма", color: "yellow" },
  stored: { label: "На хранении", color: "green" },
  pending_release: { label: "Ожидает выдачи", color: "blue" },
  released: { label: "Выдано", color: "gray" },
  disposed: { label: "Утилизировано", color: "red" },
};

const conditionOptions = [
  { value: "new", label: "Новое ✨" },
  { value: "good", label: "Хорошее 👍" },
  { value: "fair", label: "Удовлетворительное 👌" },
  { value: "poor", label: "Плохое 👎" },
  { value: "damaged", label: "Повреждено ⚠️" },
];

const actionTypeLabels: Record<string, { label: string; color: string }> = {
  intake: { label: "Приём", color: "bg-green-100 text-green-700" },
  release: { label: "Выдача", color: "bg-blue-100 text-blue-700" },
  move: { label: "Перемещение", color: "bg-purple-100 text-purple-700" },
  condition_change: { label: "Изменение состояния", color: "bg-amber-100 text-amber-700" },
  status_change: { label: "Изменение статуса", color: "bg-slate-100 text-slate-700" },
};

export default function EmployeeItemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const itemId = Number(params.id);

  const [item, setItem] = useState<Item | null>(null);
  const [history, setHistory] = useState<ItemMovement[]>([]);
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Модальные окна
  const [showIntakeModal, setShowIntakeModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showReleaseModal, setShowReleaseModal] = useState(false);

  // Формы
  const [intakeForm, setIntakeForm] = useState({
    storageLocationId: "",
    condition: "",
    notes: "",
  });
  const [moveForm, setMoveForm] = useState({
    newStorageLocationId: "",
    notes: "",
  });
  const [releaseForm, setReleaseForm] = useState({
    notes: "",
  });

  useEffect(() => {
    loadItem();
    loadHistory();
    loadLocations();
  }, [itemId]);

  const loadItem = async () => {
    setIsLoading(true);
    try {
      const response = await itemsApi.getItem(itemId);
      if (response.success) {
        setItem(response.data);
        setIntakeForm((prev) => ({ ...prev, condition: response.data.condition }));
      } else {
        toast.error("Вещь не найдена");
        router.push("/employee/items");
      }
    } catch (error) {
      toast.error("Ошибка загрузки данных");
      router.push("/employee/items");
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

  const loadLocations = async () => {
    try {
      const response = await storageLocationsApi.getAllLocations();
      if (response.success) {
        setLocations(response.data.filter((l: StorageLocation) => l.isActive && !l.isOccupied));
      }
    } catch (error) {
      console.error("Ошибка загрузки мест:", error);
    }
  };

  const handleIntake = async () => {
    if (!intakeForm.storageLocationId) {
      toast.error("Выберите место хранения");
      return;
    }

    setIsProcessing(true);
    try {
      const response = await itemsApi.intake(itemId, {
        storageLocationId: Number(intakeForm.storageLocationId),
        actualCondition: intakeForm.condition || undefined,
        notes: intakeForm.notes || undefined,
      });

      if (response.success) {
        toast.success("Вещь принята на склад");
        setShowIntakeModal(false);
        loadItem();
        loadHistory();
        loadLocations();
      } else {
        toast.error(response.message);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Ошибка приёма");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMove = async () => {
    if (!moveForm.newStorageLocationId) {
      toast.error("Выберите новое место хранения");
      return;
    }

    setIsProcessing(true);
    try {
      const response = await itemsApi.move(itemId, {
        newStorageLocationId: Number(moveForm.newStorageLocationId),
        notes: moveForm.notes || undefined,
      });

      if (response.success) {
        toast.success("Вещь перемещена");
        setShowMoveModal(false);
        loadItem();
        loadHistory();
        loadLocations();
      } else {
        toast.error(response.message);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Ошибка перемещения");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRelease = async () => {
    setIsProcessing(true);
    try {
      const response = await itemsApi.release(itemId, {
        notes: releaseForm.notes || undefined,
      });

      if (response.success) {
        toast.success("Вещь выдана владельцу");
        setShowReleaseModal(false);
        loadItem();
        loadHistory();
        loadLocations();
      } else {
        toast.error(response.message);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Ошибка выдачи");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner text="Загрузка..." />;
  }

  if (!item) {
    return null;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Заголовок */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between gap-4 flex-wrap"
      >
        <div className="flex items-center gap-4">
          <Link
            href="/employee/items"
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

        {/* Действия */}
        <div className="flex items-center gap-2 flex-wrap">
          {item.status === "pending_intake" && (
            <button
              onClick={() => setShowIntakeModal(true)}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              <ArrowDownTrayIcon className="w-5 h-5" />
              Принять
            </button>
          )}

          {item.status === "stored" && (
            <>
              <button
                onClick={() => setShowMoveModal(true)}
                className="flex items-center gap-2 px-4 py-3 bg-white border-2 border-purple-300 text-purple-700 rounded-xl font-semibold hover:bg-purple-50 transition-all"
              >
                <ArrowsRightLeftIcon className="w-5 h-5" />
                Переместить
              </button>
            </>
          )}

          {item.status === "pending_release" && (
            <button
              onClick={() => setShowReleaseModal(true)}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              <ArrowUpTrayIcon className="w-5 h-5" />
              Выдать
            </button>
          )}
        </div>
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
                  <label className="text-sm text-slate-500">Владелец</label>
                  <p className="text-slate-800 mt-1 flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-slate-400" />
                    {item.ownerName}
                  </p>
                </div>

                <div>
                  <label className="text-sm text-slate-500">Категория</label>
                  <p className="text-slate-800 mt-1 flex items-center gap-2">
                    <span className="text-xl">{item.categoryIcon}</span>
                    {item.categoryName}
                  </p>
                </div>

                <div>
                  <label className="text-sm text-slate-500">Состояние</label>
                  <p className="text-slate-800 mt-1">{item.condition}</p>
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
              </div>

              {item.notes && (
                <div>
                  <label className="text-sm text-slate-500">Примечания</label>
                  <p className="text-slate-800 mt-1 bg-slate-50 p-3 rounded-xl">{item.notes}</p>
                </div>
              )}
            </div>
          </Card>

          {/* История */}
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
                        {movement.actionType === "intake" && <ArrowDownTrayIcon className="w-5 h-5" />}
                        {movement.actionType === "release" && <ArrowUpTrayIcon className="w-5 h-5" />}
                        {movement.actionType === "move" && <ArrowsRightLeftIcon className="w-5 h-5" />}
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

              <div>
                <label className="text-sm text-slate-500">Склад</label>
                <p className="text-slate-800">{item.warehouseName}</p>
              </div>
            </div>
          </Card>

          {/* Стоимость хранения */}
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

              {item.intakeDate && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Дата приёма:</span>
                  <span className="text-slate-800">
                    {new Date(item.intakeDate).toLocaleDateString("ru")}
                  </span>
                </div>
              )}

              {item.plannedReleaseDate && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">План. выдача:</span>
                  <span className="text-slate-800">
                    {new Date(item.plannedReleaseDate).toLocaleDateString("ru")}
                  </span>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Модальное окно приёма */}
      {showIntakeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
          >
            <h3 className="text-xl font-semibold text-slate-800 mb-4">Приём вещи на склад</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Место хранения *
                </label>
                <select
                  value={intakeForm.storageLocationId}
                  onChange={(e) =>
                    setIntakeForm({ ...intakeForm, storageLocationId: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-0"
                  required
                >
                  <option value="">Выберите место</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.code} ({loc.size}) - {loc.dailyRate} ₽/день
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Состояние при приёме
                </label>
                <select
                  value={intakeForm.condition}
                  onChange={(e) => setIntakeForm({ ...intakeForm, condition: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-0"
                >
                  {conditionOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Примечания</label>
                <textarea
                  value={intakeForm.notes}
                  onChange={(e) => setIntakeForm({ ...intakeForm, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-0 resize-none"
                  placeholder="Дополнительные заметки..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowIntakeModal(false)}
                className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleIntake}
                disabled={isProcessing}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold disabled:opacity-50 transition-all"
              >
                {isProcessing ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircleIcon className="w-5 h-5" />
                    Принять
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Модальное окно перемещения */}
      {showMoveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
          >
            <h3 className="text-xl font-semibold text-slate-800 mb-4">Переместить вещь</h3>

            <div className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-sm text-slate-500">Текущее место:</p>
                <p className="font-semibold text-slate-800">{item.storageLocationCode}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Новое место хранения *
                </label>
                <select
                  value={moveForm.newStorageLocationId}
                  onChange={(e) =>
                    setMoveForm({ ...moveForm, newStorageLocationId: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-0"
                  required
                >
                  <option value="">Выберите место</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.code} ({loc.size}) - {loc.dailyRate} ₽/день
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Причина перемещения
                </label>
                <textarea
                  value={moveForm.notes}
                  onChange={(e) => setMoveForm({ ...moveForm, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-0 resize-none"
                  placeholder="Укажите причину..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowMoveModal(false)}
                className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleMove}
                disabled={isProcessing}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-violet-600 text-white rounded-xl font-semibold disabled:opacity-50 transition-all"
              >
                {isProcessing ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <ArrowsRightLeftIcon className="w-5 h-5" />
                    Переместить
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Модальное окно выдачи */}
      {showReleaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
          >
            <h3 className="text-xl font-semibold text-slate-800 mb-4">Выдача вещи</h3>

            <div className="space-y-4">
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                <p className="text-amber-800 font-medium">Подтвердите выдачу вещи владельцу:</p>
                <p className="text-amber-700 mt-2 text-lg">{item.name}</p>
                <p className="text-amber-600 text-sm">Владелец: {item.ownerName}</p>
              </div>

              {item.status === "stored" && (
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-sm text-slate-500">К оплате:</p>
                  <p className="text-2xl font-bold text-slate-800">{item.totalStorageCost.toFixed(0)} ₽</p>
                  <p className="text-xs text-slate-400">
                    {item.storageDays} дней × {item.dailyStorageCost} ₽/день
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Примечания при выдаче
                </label>
                <textarea
                  value={releaseForm.notes}
                  onChange={(e) => setReleaseForm({ ...releaseForm, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-0 resize-none"
                  placeholder="Дополнительные заметки..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowReleaseModal(false)}
                className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleRelease}
                disabled={isProcessing}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold disabled:opacity-50 transition-all"
              >
                {isProcessing ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircleIcon className="w-5 h-5" />
                    Выдать
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
