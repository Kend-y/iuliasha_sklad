"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ordersApi, warehousesApi } from "@/lib/api";
import { Warehouse } from "@/lib/store";
import { Card, LoadingSpinner } from "@/components/UI";
import toast from "react-hot-toast";
import {
  BuildingStorefrontIcon,
  DocumentTextIcon,
  ArrowLeftIcon,
  PlusCircleIcon,
  InformationCircleIcon,
  CheckIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

export default function NewOrderPage() {
  const router = useRouter();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [description, setDescription] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState<number | null>(
    null
  );
  const [errors, setErrors] = useState<{
    description?: string;
    warehouse?: string;
  }>({});

  useEffect(() => {
    const loadWarehouses = async () => {
      try {
        const response = await warehousesApi.getWarehouses();
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

    loadWarehouses();
  }, []);

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!description.trim()) {
      newErrors.description = "Описание заказа обязательно";
    } else if (description.trim().length < 10) {
      newErrors.description = "Описание должно содержать минимум 10 символов";
    }

    if (!selectedWarehouse) {
      newErrors.warehouse = "Выберите склад";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const response = await ordersApi.createOrder(
        description,
        selectedWarehouse!
      );

      if (response.success) {
        toast.success("Заказ успешно создан!");
        router.push("/client/orders");
      } else {
        toast.error(response.message || "Ошибка создания заказа");
      }
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Ошибка при создании заказа";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner text="Загрузка складов..." />;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <div className="w-14 h-14 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
          <PlusCircleIcon className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Новый заказ</h1>
          <p className="text-slate-500 mt-1">
            Создайте новый заказ, выбрав склад и описав товары
          </p>
        </div>
      </motion.div>

      <Card borderColor="indigo">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Описание заказа */}
          <div>
            <label
              htmlFor="description"
              className="flex items-center gap-2 text-slate-700 font-medium mb-2"
            >
              <DocumentTextIcon className="w-5 h-5 text-indigo-500" />
              Описание заказа
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`w-full px-4 py-3 bg-white border-2 ${
                errors.description ? "border-rose-400" : "border-slate-200"
              } rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 min-h-[120px] resize-y transition-all`}
              placeholder="Опишите товары для заказа, количество и другие детали..."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-rose-500">{errors.description}</p>
            )}
          </div>

          {/* Выбор склада */}
          <div>
            <label className="flex items-center gap-2 text-slate-700 font-medium mb-2">
              <BuildingStorefrontIcon className="w-5 h-5 text-indigo-500" />
              Выберите склад
            </label>
            {errors.warehouse && (
              <p className="mb-2 text-sm text-rose-500">{errors.warehouse}</p>
            )}

            {warehouses.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-xl border-2 border-slate-200">
                <BuildingStorefrontIcon className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="mt-2 text-slate-500">Нет доступных складов</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {warehouses.map((warehouse, index) => (
                  <motion.div
                    key={warehouse.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <label
                      className={`flex items-start gap-4 p-4 rounded-xl cursor-pointer border-2 transition-all duration-200 ${
                        selectedWarehouse === warehouse.id
                          ? "border-indigo-400 bg-indigo-50 shadow-lg shadow-indigo-100"
                          : "border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="warehouse"
                        value={warehouse.id}
                        checked={selectedWarehouse === warehouse.id}
                        onChange={() => setSelectedWarehouse(warehouse.id)}
                        className="sr-only"
                      />
                      <div
                        className={`p-3 rounded-xl ${
                          selectedWarehouse === warehouse.id
                            ? "bg-indigo-500"
                            : "bg-slate-100"
                        }`}
                      >
                        {selectedWarehouse === warehouse.id ? (
                          <CheckIcon className="w-6 h-6 text-white" />
                        ) : (
                          <BuildingStorefrontIcon className="w-6 h-6 text-slate-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3
                          className={`font-semibold ${
                            selectedWarehouse === warehouse.id
                              ? "text-indigo-600"
                              : "text-slate-800"
                          }`}
                        >
                          {warehouse.name}
                        </h3>
                        <p className="text-slate-500 mt-1">
                          {warehouse.address}
                        </p>
                        {warehouse.description && (
                          <p className="text-sm text-slate-400 mt-1">
                            {warehouse.description}
                          </p>
                        )}
                      </div>
                    </label>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Кнопки */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium border-2 border-slate-200 hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              Отмена
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-indigo-500 text-white rounded-xl font-medium shadow-lg shadow-indigo-200 hover:bg-indigo-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.div
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                  Создание...
                </span>
              ) : (
                <>
                  <SparklesIcon className="w-5 h-5" />
                  Создать заказ
                </>
              )}
            </button>
          </div>
        </form>
      </Card>

      {/* Информация */}
      <Card borderColor="cyan">
        <div className="flex gap-4">
          <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center flex-shrink-0 border-2 border-cyan-200">
            <InformationCircleIcon className="w-6 h-6 text-cyan-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">Как это работает?</h3>
            <ul className="text-slate-500 mt-2 space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <CheckIcon className="w-4 h-4 text-emerald-500" />
                После создания заказа администратор получит уведомление
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon className="w-4 h-4 text-emerald-500" />
                Администратор проверит и одобрит или отклонит заказ
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon className="w-4 h-4 text-emerald-500" />
                Вы получите уведомление о решении в реальном времени
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
