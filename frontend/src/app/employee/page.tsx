"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { itemsApi, storageLocationsApi } from "@/lib/api";
import { Card, LoadingSpinner, StatusBadge } from "@/components/UI";
import {
  CubeIcon,
  MapPinIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

export default function EmployeeDashboard() {
  const [stats, setStats] = useState({
    pendingIntake: 0,
    pendingRelease: 0,
    stored: 0,
    availableLocations: 0,
    occupiedLocations: 0,
  });
  const [recentItems, setRecentItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Загружаем все вещи для статистики
      const [itemsResponse, locationsResponse] = await Promise.all([
        itemsApi.getAllItems(),
        storageLocationsApi.getAllLocations(),
      ]);

      if (itemsResponse.success) {
        const items = itemsResponse.data;
        const pendingIntake = items.filter((i: any) => i.status === "pending_intake");
        const pendingRelease = items.filter((i: any) => i.status === "pending_release");
        const stored = items.filter((i: any) => i.status === "stored");

        setStats((prev) => ({
          ...prev,
          pendingIntake: pendingIntake.length,
          pendingRelease: pendingRelease.length,
          stored: stored.length,
        }));

        // Последние вещи
        setRecentItems(items.slice(0, 5));
      }

      if (locationsResponse.success) {
        const locations = locationsResponse.data;
        setStats((prev) => ({
          ...prev,
          availableLocations: locations.filter((l: any) => !l.isOccupied && l.isActive).length,
          occupiedLocations: locations.filter((l: any) => l.isOccupied).length,
        }));
      }
    } catch (error) {
      console.error("Ошибка загрузки данных:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner text="Загрузка..." />;
  }

  const statusLabels: Record<string, { label: string; type: "success" | "warning" | "error" | "neutral" }> = {
    pending_intake: { label: "Ожидает приёма", type: "warning" },
    stored: { label: "На хранении", type: "success" },
    pending_release: { label: "Ожидает выдачи", type: "warning" },
    released: { label: "Выдано", type: "neutral" },
  };

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Панель сотрудника</h1>
          <p className="text-slate-500">Управление приёмом и выдачей вещей</p>
        </div>
      </div>

      {/* Карточки статистики */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Link href="/employee/items?status=pending_intake">
            <Card className="p-5 hover:shadow-lg transition-shadow cursor-pointer bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center">
                  <ArrowDownTrayIcon className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-amber-600">{stats.pendingIntake}</p>
                  <p className="text-sm text-amber-700">Ожидают приёма</p>
                </div>
              </div>
            </Card>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Link href="/employee/items?status=pending_release">
            <Card className="p-5 hover:shadow-lg transition-shadow cursor-pointer bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                  <ArrowUpTrayIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-blue-600">{stats.pendingRelease}</p>
                  <p className="text-sm text-blue-700">Ожидают выдачи</p>
                </div>
              </div>
            </Card>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Link href="/employee/items?status=stored">
            <Card className="p-5 hover:shadow-lg transition-shadow cursor-pointer bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
                  <CubeIcon className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-green-600">{stats.stored}</p>
                  <p className="text-sm text-green-700">На хранении</p>
                </div>
              </div>
            </Card>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Link href="/employee/locations">
            <Card className="p-5 hover:shadow-lg transition-shadow cursor-pointer bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center">
                  <MapPinIcon className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-purple-600">
                    {stats.availableLocations}/{stats.availableLocations + stats.occupiedLocations}
                  </p>
                  <p className="text-sm text-purple-700">Свободных мест</p>
                </div>
              </div>
            </Card>
          </Link>
        </motion.div>
      </div>

      {/* Быстрые действия */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Требуют внимания */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-amber-500" />
            Требуют внимания
          </h2>

          <div className="space-y-4">
            {stats.pendingIntake > 0 && (
              <Link href="/employee/items?status=pending_intake">
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ArrowDownTrayIcon className="w-5 h-5 text-amber-600" />
                      <span className="text-amber-800 font-medium">
                        {stats.pendingIntake} вещей ожидают приёма
                      </span>
                    </div>
                    <span className="text-amber-600">→</span>
                  </div>
                </div>
              </Link>
            )}

            {stats.pendingRelease > 0 && (
              <Link href="/employee/items?status=pending_release">
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer mt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ArrowUpTrayIcon className="w-5 h-5 text-blue-600" />
                      <span className="text-blue-800 font-medium">
                        {stats.pendingRelease} вещей ожидают выдачи
                      </span>
                    </div>
                    <span className="text-blue-600">→</span>
                  </div>
                </div>
              </Link>
            )}

            {stats.pendingIntake === 0 && stats.pendingRelease === 0 && (
              <div className="text-center py-8 text-slate-500">
                <ClockIcon className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p>Нет вещей, требующих внимания</p>
              </div>
            )}
          </div>
        </Card>

        {/* Последние вещи */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <ClockIcon className="w-5 h-5 text-indigo-500" />
            Последние вещи
          </h2>

          {recentItems.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <CubeIcon className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>Пока нет вещей</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentItems.map((item) => (
                <Link key={item.id} href={`/employee/items/${item.id}`}>
                  <div className="p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{item.categoryIcon || "📦"}</span>
                        <div>
                          <p className="font-medium text-slate-800">{item.name}</p>
                          <p className="text-xs text-slate-500">{item.uniqueCode}</p>
                        </div>
                      </div>
                      <StatusBadge
                        status={statusLabels[item.status]?.label || item.status}
                        type={statusLabels[item.status]?.type || "neutral"}
                      />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <Link
            href="/employee/items"
            className="block mt-4 text-center text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Все вещи →
          </Link>
        </Card>
      </div>
    </div>
  );
}
