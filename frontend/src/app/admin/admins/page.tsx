"use client";

import { useEffect, useState, FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/lib/store";
import {
  Card,
  LoadingSpinner,
  EmptyState,
  Modal,
  ConfirmDialog,
} from "@/components/UI";
import toast from "react-hot-toast";
import api from "@/lib/api";
import {
  UserGroupIcon,
  UserPlusIcon,
  TrashIcon,
  EnvelopeIcon,
  CalendarIcon,
  ShieldCheckIcon,
  UserIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";

interface Admin {
  id: number;
  email: string;
  fullName: string;
  createdAt: string;
}

export default function AdminsPage() {
  const { user } = useAuthStore();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [deleteAdmin, setDeleteAdmin] = useState<Admin | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Форма
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    try {
      const response = await api.get("/admin/admins");
      if (response.data.success) {
        setAdmins(response.data.data);
      }
    } catch (error) {
      console.error("Ошибка загрузки админов:", error);
      toast.error("Ошибка загрузки администраторов");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFullName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setErrors({});
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!fullName.trim()) {
      newErrors.fullName = "Введите имя";
    }

    if (!email.trim()) {
      newErrors.email = "Введите email";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Некорректный email";
    }

    if (!password) {
      newErrors.password = "Введите пароль";
    } else if (password.length < 6) {
      newErrors.password = "Пароль должен содержать минимум 6 символов";
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Пароли не совпадают";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const response = await api.post("/admin/admins", {
        fullName,
        email,
        password,
      });

      if (response.data.success) {
        toast.success("Администратор создан");
        loadAdmins();
        closeModal();
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Ошибка создания администратора"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteAdmin) return;

    try {
      const response = await api.delete(`/admin/admins/${deleteAdmin.id}`);

      if (response.data.success) {
        toast.success("Администратор удалён");
        loadAdmins();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Ошибка удаления");
    } finally {
      setDeleteAdmin(null);
    }
  };

  if (isLoading) {
    return <LoadingSpinner text="Загрузка администраторов..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4"
        >
          <div className="w-14 h-14 bg-violet-500 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-200">
            <UserGroupIcon className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-800">
              Администраторы
            </h1>
            <p className="text-slate-500 mt-1">
              Управление учетными записями администраторов
            </p>
          </div>
        </motion.div>
        <button
          onClick={() => setShowModal(true)}
          className="px-6 py-3 bg-indigo-500 text-white rounded-xl font-medium shadow-lg shadow-indigo-200 flex items-center gap-2 hover:bg-indigo-600 transition-colors"
        >
          <UserPlusIcon className="w-5 h-5" />
          Добавить админа
        </button>
      </div>

      {/* Список администраторов */}
      {admins.length === 0 ? (
        <Card borderColor="violet">
          <EmptyState
            icon={<UserGroupIcon className="w-full h-full" />}
            title="Нет администраторов"
            description="Добавьте первого администратора"
            action={{
              label: "Добавить админа",
              onClick: () => setShowModal(true),
              icon: <UserPlusIcon className="w-5 h-5" />,
            }}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {admins.map((admin, index) => (
            <motion.div
              key={admin.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card borderColor="violet" className="h-full">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-violet-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-violet-200">
                      {admin.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 text-lg">
                        {admin.fullName}
                      </h3>
                      <div className="flex items-center gap-1 text-indigo-600 text-sm">
                        <ShieldCheckIcon className="w-4 h-4" />
                        Администратор
                      </div>
                    </div>
                  </div>
                  {admin.id !== user?.id && (
                    <button
                      onClick={() => setDeleteAdmin(admin)}
                      className="p-2 bg-rose-100 text-rose-600 rounded-xl hover:bg-rose-200 transition-colors border-2 border-rose-200"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  )}
                </div>

                <div className="space-y-2 text-sm text-slate-500">
                  <p className="flex items-center gap-2">
                    <EnvelopeIcon className="w-4 h-4 text-slate-400" />
                    {admin.email}
                  </p>
                  <p className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-slate-400" />
                    Создан:{" "}
                    {new Date(admin.createdAt).toLocaleDateString("ru-RU")}
                  </p>
                </div>

                {admin.id === user?.id && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-600 rounded-full text-xs font-medium border-2 border-indigo-200">
                      Это вы
                    </span>
                  </div>
                )}
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Модальное окно создания */}
      <AnimatePresence>
        {showModal && (
          <Modal isOpen={true} onClose={closeModal} title="Новый администратор">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <UserIcon className="w-4 h-4" />
                  Полное имя *
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={`w-full px-4 py-3 border ${
                    errors.fullName ? "border-red-500" : "border-gray-300"
                  } rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50`}
                  placeholder="Иван Иванов"
                />
                {errors.fullName && (
                  <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
                )}
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <EnvelopeIcon className="w-4 h-4" />
                  Email *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full px-4 py-3 border ${
                    errors.email ? "border-red-500" : "border-gray-300"
                  } rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50`}
                  placeholder="admin@example.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <LockClosedIcon className="w-4 h-4" />
                  Пароль *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full px-4 py-3 border ${
                      errors.password ? "border-red-500" : "border-gray-300"
                    } rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 pr-12`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="w-5 h-5" />
                    ) : (
                      <EyeIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <LockClosedIcon className="w-4 h-4" />
                  Подтвердите пароль *
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full px-4 py-3 border ${
                    errors.confirmPassword
                      ? "border-red-500"
                      : "border-gray-300"
                  } rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50`}
                  placeholder="••••••••"
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {isSubmitting ? "Создание..." : "Создать"}
                </button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>

      {/* Диалог удаления */}
      <ConfirmDialog
        isOpen={!!deleteAdmin}
        onClose={() => setDeleteAdmin(null)}
        onConfirm={handleDelete}
        title="Удалить администратора?"
        message={`Вы уверены, что хотите удалить администратора "${deleteAdmin?.fullName}"?`}
        confirmText="Удалить"
        confirmVariant="danger"
      />
    </div>
  );
}
