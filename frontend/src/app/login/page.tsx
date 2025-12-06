"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {}
  );

  // Валидация формы
  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = "Email обязателен";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Неверный формат email";
    }

    if (!password) {
      newErrors.password = "Пароль обязателен";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const response = await authApi.login(email, password);

      if (response.success) {
        login(response.user, response.token);
        toast.success("Вход выполнен успешно!");

        // Перенаправляем в зависимости от роли
        if (response.user.role?.toLowerCase() === "admin") {
          router.push("/admin");
        } else {
          router.push("/client");
        }
      } else {
        toast.error(response.message || "Ошибка входа");
      }
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Ошибка при входе в систему";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-violet-50 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        {/* Логотип */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <span className="text-xl">📦</span>
            </div>
            <span className="text-2xl font-semibold text-slate-800">
              FBS Warehouses
            </span>
          </Link>
        </div>

        {/* Форма */}
        <div className="bg-white rounded-2xl p-8 shadow-xl shadow-slate-200/50">
          <h1 className="text-xl font-semibold text-slate-800 text-center mb-1">
            Вход в систему
          </h1>
          <p className="text-slate-500 text-center text-sm mb-6">
            Введите свои данные для входа
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="label">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`input-field ${errors.email ? "input-error" : ""}`}
                placeholder="example@mail.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-rose-500">{errors.email}</p>
              )}
            </div>

            {/* Пароль */}
            <div>
              <label htmlFor="password" className="label">
                Пароль
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`input-field ${
                  errors.password ? "input-error" : ""
                }`}
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-rose-500">{errors.password}</p>
              )}
            </div>

            {/* Кнопка входа */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-2.5"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Вход...
                </span>
              ) : (
                "Войти"
              )}
            </button>
          </form>

          {/* Ссылка на регистрацию */}
          <p className="mt-6 text-center text-slate-500 text-sm">
            Нет аккаунта?{" "}
            <Link
              href="/register"
              className="text-indigo-500 hover:text-indigo-600 font-medium"
            >
              Зарегистрироваться
            </Link>
          </p>

          {/* Тестовые данные */}
          <div className="mt-6 p-3 bg-indigo-50 rounded-xl">
            <p className="text-xs text-indigo-600 text-center">
              Тестовый аккаунт админа:
            </p>
            <p className="text-sm text-indigo-700 text-center font-mono mt-1">
              admin@warehouse.com / admin123
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
