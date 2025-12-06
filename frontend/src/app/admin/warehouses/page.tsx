"use client";

import { useEffect, useState, FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { warehousesApi } from "@/lib/api";
import { Warehouse } from "@/lib/store";
import {
  Card,
  StatusBadge,
  LoadingSpinner,
  EmptyState,
  Modal,
  ConfirmDialog,
} from "@/components/UI";
import toast from "react-hot-toast";
import {
  BuildingStorefrontIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  PauseIcon,
  PlayIcon,
  MapPinIcon,
  DocumentTextIcon,
  CubeIcon,
} from "@heroicons/react/24/outline";

export default function AdminWarehousesPage() {
  const searchParams = useSearchParams();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(
    null
  );
  const [deleteWarehouse, setDeleteWarehouse] = useState<Warehouse | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Форма
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<{ name?: string }>({});

  useEffect(() => {
    loadWarehouses();

    // Открываем модальное окно если есть параметр action=new
    if (searchParams.get("action") === "new") {
      setShowModal(true);
    }
  }, [searchParams]);

  const loadWarehouses = async () => {
    try {
      const response = await warehousesApi.getWarehouses(true);
      if (response.success) {
        setWarehouses(response.data);
      }
    } catch (error) {
      console.error("Ошибка загрузки складов:", error);
      toast.error("Ошибка загрузки складов");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setAddress("");
    setDescription("");
    setErrors({});
    setEditingWarehouse(null);
  };

  const openModal = (warehouse?: Warehouse) => {
    if (warehouse) {
      setEditingWarehouse(warehouse);
      setName(warehouse.name);
      setAddress(warehouse.address);
      setDescription(warehouse.description);
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const validateForm = (): boolean => {
    const newErrors: { name?: string } = {};

    if (!name.trim()) {
      newErrors.name = "Название склада обязательно";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      if (editingWarehouse) {
        // Обновление
        const response = await warehousesApi.updateWarehouse(
          editingWarehouse.id,
          {
            name,
            address,
            description,
          }
        );

        if (response.success) {
          toast.success("Склад обновлён");
          loadWarehouses();
          closeModal();
        }
      } else {
        // Создание
        const response = await warehousesApi.createWarehouse(
          name,
          address,
          description
        );

        if (response.success) {
          toast.success("Склад создан");
          loadWarehouses();
          closeModal();
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Ошибка сохранения");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (warehouse: Warehouse) => {
    const newStatus = warehouse.status === "active" ? "suspended" : "active";
    const statusText =
      newStatus === "suspended" ? "приостановлен" : "активирован";

    try {
      const response = await warehousesApi.updateWarehouse(warehouse.id, {
        status: newStatus,
      });

      if (response.success) {
        toast.success(`Склад "${warehouse.name}" ${statusText}`);
        loadWarehouses();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Ошибка обновления");
    }
  };

  const handleDelete = async () => {
    if (!deleteWarehouse) return;

    try {
      const response = await warehousesApi.deleteWarehouse(deleteWarehouse.id);

      if (response.success) {
        toast.success(`Склад "${deleteWarehouse.name}" удалён`);
        loadWarehouses();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Ошибка удаления");
    } finally {
      setDeleteWarehouse(null);
    }
  };

  if (isLoading) {
    return <LoadingSpinner text="Загрузка складов..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4"
        >
          <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200">
            <BuildingStorefrontIcon className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-800">
              Управление складами
            </h1>
            <p className="text-slate-500 mt-1">
              Добавляйте, редактируйте и управляйте статусом складов
            </p>
          </div>
        </motion.div>
        <button
          onClick={() => openModal()}
          className="px-6 py-3 bg-indigo-500 text-white rounded-xl font-medium shadow-lg shadow-indigo-200 flex items-center gap-2 hover:bg-indigo-600 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          Добавить склад
        </button>
      </div>

      {/* Список складов */}
      {warehouses.length === 0 ? (
        <Card borderColor="emerald">
          <EmptyState
            icon={<BuildingStorefrontIcon className="w-full h-full" />}
            title="Нет складов"
            description="Добавьте первый склад"
            action={{
              label: "Добавить склад",
              onClick: () => openModal(),
              icon: <PlusIcon className="w-5 h-5" />,
            }}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {warehouses.map((warehouse, index) => (
            <motion.div
              key={warehouse.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card
                borderColor={
                  warehouse.status === "active" ? "emerald" : "amber"
                }
                className={`h-full ${
                  warehouse.status === "suspended" ? "opacity-80" : ""
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-100 rounded-xl border-2 border-emerald-200">
                      <BuildingStorefrontIcon className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 text-lg">
                        {warehouse.name}
                      </h3>
                      <StatusBadge status={warehouse.status as any} />
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-slate-500 mb-4">
                  <p className="flex items-center gap-2">
                    <MapPinIcon className="w-4 h-4 text-slate-400" />
                    {warehouse.address || "Адрес не указан"}
                  </p>
                  {warehouse.description && (
                    <p className="flex items-center gap-2">
                      <DocumentTextIcon className="w-4 h-4 text-slate-400" />
                      {warehouse.description}
                    </p>
                  )}
                  <p className="flex items-center gap-2">
                    <CubeIcon className="w-4 h-4 text-slate-400" />
                    {warehouse.ordersCount} заказов
                  </p>
                </div>

                <div className="flex gap-2 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => openModal(warehouse)}
                    className="flex-1 px-3 py-2 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    <PencilIcon className="w-4 h-4" />
                    Изменить
                  </button>
                  <button
                    onClick={() => handleToggleStatus(warehouse)}
                    className={`flex-1 text-sm flex items-center justify-center gap-2 ${
                      warehouse.status === "active"
                        ? "bg-amber-100 text-amber-700 border-2 border-amber-200"
                        : "bg-emerald-100 text-emerald-700 border-2 border-emerald-200"
                    } px-3 py-2 rounded-xl font-medium transition-colors hover:opacity-80`}
                  >
                    {warehouse.status === "active" ? (
                      <>
                        <PauseIcon className="w-4 h-4" />
                        Стоп
                      </>
                    ) : (
                      <>
                        <PlayIcon className="w-4 h-4" />
                        Старт
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setDeleteWarehouse(warehouse)}
                    className="bg-rose-100 text-rose-600 border-2 border-rose-200 px-3 py-2 rounded-xl font-medium transition-colors text-sm hover:bg-rose-200"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Модальное окно создания/редактирования */}
      <AnimatePresence>
        {showModal && (
          <Modal
            isOpen={true}
            onClose={closeModal}
            title={editingWarehouse ? "Редактировать склад" : "Новый склад"}
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Название склада *
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full px-4 py-3 border ${
                    errors.name ? "border-red-500" : "border-gray-300"
                  } rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent`}
                  placeholder="Центральный склад"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="address"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Адрес
                </label>
                <input
                  type="text"
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent"
                  placeholder="г. Москва, ул. Складская, д. 1"
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Описание
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent min-h-[80px] resize-y"
                  placeholder="Дополнительная информация о складе..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 shadow-lg shadow-indigo-200 transition-all disabled:opacity-50"
                >
                  {isSubmitting
                    ? "Сохранение..."
                    : editingWarehouse
                    ? "Сохранить"
                    : "Создать"}
                </button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>

      {/* Диалог подтверждения удаления */}
      <ConfirmDialog
        isOpen={!!deleteWarehouse}
        onClose={() => setDeleteWarehouse(null)}
        onConfirm={handleDelete}
        title="Удалить склад?"
        message={`Вы уверены, что хотите удалить склад "${deleteWarehouse?.name}"? Это действие нельзя отменить.`}
        confirmText="Удалить"
        confirmVariant="danger"
      />
    </div>
  );
}
