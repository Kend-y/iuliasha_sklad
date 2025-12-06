"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore, useNotificationsStore, Notification } from "@/lib/store";
import { notificationsApi } from "@/lib/api";
import {
  startConnection,
  stopConnection,
  subscribeToNotifications,
  subscribeToOrderStatusChanges,
  unsubscribeAll,
} from "@/lib/signalr";
import toast from "react-hot-toast";
import {
  BuildingStorefrontIcon,
  ClipboardDocumentListIcon,
  PlusIcon,
  ChartBarIcon,
  ClockIcon,
  BellIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
  CubeIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserGroupIcon,
  Bars3Icon,
  XMarkIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { NotificationBadge } from "./UI";

interface LayoutProps {
  children: React.ReactNode;
  role?: "admin" | "employee" | "client";
}

/**
 * Основной Layout с градиентным фоном и glassmorphism
 */
export default function DashboardLayout({ children, role }: LayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, token } = useAuthStore();
  const {
    notifications,
    unreadCount,
    setNotifications,
    setUnreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
  } = useNotificationsStore();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const userRole = role || user?.role?.toLowerCase();
  const isAdmin = userRole === "admin";
  const isEmployee = userRole === "employee";
  const basePath = isAdmin ? "/admin" : isEmployee ? "/employee" : "/client";

  // Навигационные ссылки с Heroicons
  const getNavLinks = () => {
    if (isAdmin) {
      return [
        { href: "/admin", label: "Дашборд", icon: ChartBarIcon },
        {
          href: "/admin/orders",
          label: "Заказы",
          icon: ClipboardDocumentListIcon,
        },
        {
          href: "/admin/warehouses",
          label: "Склады",
          icon: BuildingStorefrontIcon,
        },
        { href: "/admin/admins", label: "Админы", icon: UserGroupIcon },
        { href: "/admin/history", label: "История", icon: ClockIcon },
      ];
    }
    
    if (isEmployee) {
      return [
        { href: "/employee", label: "Дашборд", icon: ChartBarIcon },
        { href: "/employee/items", label: "Вещи", icon: CubeIcon },
        { href: "/employee/locations", label: "Места хранения", icon: BuildingStorefrontIcon },
      ];
    }
    
    // Client
    return [
      { href: "/client", label: "Дашборд", icon: ChartBarIcon },
      { href: "/client/items", label: "Мои вещи", icon: CubeIcon },
      { href: "/client/new-item", label: "Сдать вещь", icon: PlusIcon },
      {
        href: "/client/orders",
        label: "Мои заказы",
        icon: ClipboardDocumentListIcon,
      },
      { href: "/client/new-order", label: "Новый заказ", icon: PlusIcon },
    ];
  };
  
  const navLinks = getNavLinks();

  // Загрузка уведомлений
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const [notifResponse, countResponse] = await Promise.all([
          notificationsApi.getNotifications(),
          notificationsApi.getUnreadCount(),
        ]);

        if (notifResponse.success) {
          setNotifications(notifResponse.data);
        }
        if (countResponse.success) {
          setUnreadCount(countResponse.data);
        }
      } catch (error) {
        console.error("Ошибка загрузки уведомлений:", error);
      }
    };

    loadNotifications();
  }, [setNotifications, setUnreadCount]);

  // Подключение SignalR
  useEffect(() => {
    if (!token) return;

    const initSignalR = async () => {
      try {
        await startConnection(token);

        // Подписываемся на уведомления
        subscribeToNotifications((notification: Notification) => {
          addNotification(notification);
          toast.success(notification.title, {
            duration: 5000,
            icon: "🔔",
          });
        });

        // Подписываемся на изменение статуса заказов (для клиентов)
        if (!isAdmin) {
          subscribeToOrderStatusChanges(({ orderId, newStatus }) => {
            const statusText =
              newStatus === "approved" ? "одобрен" : "отклонён";
            toast.success(`Заказ #${orderId} был ${statusText}`, {
              duration: 5000,
              icon: newStatus === "approved" ? "✅" : "❌",
            });
          });
        }
      } catch (error) {
        console.error("SignalR connection error:", error);
      }
    };

    initSignalR();

    return () => {
      unsubscribeAll();
      stopConnection();
    };
  }, [token, isAdmin, addNotification]);

  // Закрытие меню при клике вне
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      markAllAsRead();
    } catch (error) {
      toast.error("Ошибка при обновлении уведомлений");
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationsApi.markAsRead(id);
      markAsRead(id);
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Навигация */}
      <nav className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14">
            {/* Логотип и навигация */}
            <div className="flex items-center">
              <Link href={basePath} className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-indigo-500 rounded-xl flex items-center justify-center">
                  <CubeIcon className="w-5 h-5 text-white" />
                </div>
                <span className="font-semibold text-lg text-slate-800">
                  FBS Warehouses
                </span>
              </Link>

              {/* Desktop навигация */}
              <div className="hidden md:flex ml-8 space-x-1">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${
                        isActive
                          ? "bg-indigo-50 text-indigo-600"
                          : "text-slate-600 hover:text-indigo-600 hover:bg-indigo-50"
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 ${
                          isActive ? "text-indigo-500" : ""
                        }`}
                      />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Правая часть */}
            <div className="flex items-center gap-2">
              {/* Уведомления */}
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                >
                  <BellIcon className="w-5 h-5" />
                  <NotificationBadge count={unreadCount} />
                </button>

                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-lg shadow-slate-200/50 overflow-hidden"
                    >
                      <div className="p-3 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="font-medium text-slate-800 text-sm">
                          Уведомления
                        </h3>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllAsRead}
                            className="text-xs text-indigo-500 hover:text-indigo-600"
                          >
                            Прочитать все
                          </button>
                        )}
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-slate-400">
                            <BellIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Нет уведомлений</p>
                          </div>
                        ) : (
                          notifications.slice(0, 10).map((notification) => (
                            <div
                              key={notification.id}
                              onClick={() => handleMarkAsRead(notification.id)}
                              className={`p-3 border-b border-slate-100 cursor-pointer transition-colors ${
                                !notification.isRead
                                  ? "bg-indigo-50"
                                  : "hover:bg-slate-50"
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 mt-0.5">
                                  {notification.type === "new_order" ? (
                                    <CubeIcon className="w-5 h-5 text-indigo-500" />
                                  ) : notification.type === "order_approved" ? (
                                    <CheckCircleIcon className="w-5 h-5 text-emerald-500" />
                                  ) : notification.type === "order_rejected" ? (
                                    <XCircleIcon className="w-5 h-5 text-rose-500" />
                                  ) : (
                                    <BellIcon className="w-5 h-5 text-slate-400" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm text-slate-800">
                                    {notification.title}
                                  </p>
                                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                                    {notification.message}
                                  </p>
                                  <p className="text-xs text-slate-400 mt-1">
                                    {new Date(
                                      notification.createdAt
                                    ).toLocaleString("ru-RU")}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Профиль пользователя */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1.5 hover:bg-indigo-50 rounded-xl transition-colors"
                >
                  <div className="w-8 h-8 bg-indigo-500 rounded-xl flex items-center justify-center text-white font-medium text-sm">
                    {user?.fullName?.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-slate-800">
                      {user?.fullName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {isAdmin ? "Администратор" : "Клиент"}
                    </p>
                  </div>
                  <ChevronDownIcon
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      showUserMenu ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-lg shadow-slate-200/50 overflow-hidden"
                    >
                      <div className="p-3 border-b border-slate-100">
                        <p className="font-medium text-sm text-slate-800">
                          {user?.fullName}
                        </p>
                        <p className="text-xs text-slate-500">{user?.email}</p>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full p-3 text-left text-rose-500 hover:bg-rose-50 transition-colors flex items-center gap-2 text-sm"
                      >
                        <ArrowRightOnRectangleIcon className="w-4 h-4" />
                        Выйти
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Мобильное меню */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl"
              >
                {showMobileMenu ? (
                  <XMarkIcon className="w-5 h-5" />
                ) : (
                  <Bars3Icon className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Мобильная навигация */}
        <AnimatePresence>
          {showMobileMenu && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-slate-100 bg-white"
            >
              <div className="py-2 px-4 space-y-1">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setShowMobileMenu(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                        isActive
                          ? "bg-indigo-50 text-indigo-600"
                          : "text-slate-600 hover:text-indigo-600 hover:bg-indigo-50"
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 ${
                          isActive ? "text-indigo-500" : ""
                        }`}
                      />
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Основной контент */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
}
