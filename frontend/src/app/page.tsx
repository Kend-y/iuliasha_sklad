"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import { motion } from "framer-motion";
import Link from "next/link";

// SVG иконки
const BoxIcon = () => (
  <svg
    className="w-8 h-8"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
    />
  </svg>
);

const BellIcon = () => (
  <svg
    className="w-8 h-8"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
    />
  </svg>
);

const WarehouseIcon = () => (
  <svg
    className="w-8 h-8"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
    />
  </svg>
);

const LogoIcon = () => (
  <svg
    className="w-9 h-9"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
    />
  </svg>
);

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role?.toLowerCase() === "admin") {
        router.push("/admin");
      } else {
        router.push("/client");
      }
    }
  }, [isAuthenticated, user, router]);

  const features = [
    {
      icon: <BoxIcon />,
      title: "Заказы",
      desc: "Создавайте и отслеживайте статус ваших заказов",
      color: "from-blue-500 to-indigo-600",
    },
    {
      icon: <BellIcon />,
      title: "Уведомления",
      desc: "Получайте уведомления об изменении статусов",
      color: "from-amber-500 to-orange-600",
    },
    {
      icon: <WarehouseIcon />,
      title: "Склады",
      desc: "Выбирайте удобные склады для доставки",
      color: "from-emerald-500 to-teal-600",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Навигация */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white">
              <LogoIcon />
            </div>
            <span className="text-xl font-bold text-slate-800">Склады</span>
          </div>
          <div className="flex gap-3">
            <Link
              href="/login"
              className="text-slate-600 hover:text-indigo-600 transition-colors px-4 py-2 font-medium"
            >
              Вход
            </Link>
            <Link
              href="/register"
              className="bg-indigo-500 text-white px-5 py-2 rounded-xl font-medium hover:bg-indigo-600 transition-colors"
            >
              Регистрация
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero секция */}
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Бейдж */}
            <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-full text-sm font-medium mb-8">
              <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
              Система управления складами
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-800 mb-6 leading-tight">
              Управление складами
              <br />
              <span className="text-indigo-500">просто и эффективно</span>
            </h1>

            <p className="text-lg text-slate-500 mb-10 max-w-xl mx-auto leading-relaxed">
              Современная система для управления заказами и складами.
              Отслеживайте статусы заказов в реальном времени.
            </p>

            <div className="flex gap-4 justify-center flex-wrap">
              <Link
                href="/register"
                className="bg-indigo-500 text-white px-8 py-3.5 rounded-xl font-semibold text-lg hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30"
              >
                Начать работу
              </Link>
              <Link
                href="/login"
                className="bg-white border-2 border-slate-200 text-slate-700 px-8 py-3.5 rounded-xl font-semibold text-lg hover:border-indigo-300 hover:text-indigo-600 transition-all"
              >
                Войти в систему
              </Link>
            </div>
          </motion.div>

          {/* Карточки преимуществ */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-20 grid md:grid-cols-3 gap-6"
          >
            {features.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                className="bg-white rounded-2xl p-6 text-left border-2 border-slate-100 hover:border-indigo-200 transition-all hover:shadow-lg group"
              >
                <div
                  className={`w-14 h-14 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white mb-5 group-hover:scale-110 transition-transform`}
                >
                  {item.icon}
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">
                  {item.title}
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-slate-400 text-sm">
        <p>© 2025 Разработано Цвигуненко Юлией 415 группа</p>
      </footer>
    </div>
  );
}
