"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ordersApi, warehousesApi, historyApi } from "@/lib/api";
import { useAuthStore, Order, Warehouse } from "@/lib/store";
import { Card, StatCard, StatusBadge, LoadingSpinner } from "@/components/UI";
import {
  CubeIcon,
  ClockIcon,
  BuildingStorefrontIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
  PlusIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  Cog6ToothIcon,
  CommandLineIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

interface Stats {
  orders: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  warehouses: {
    total: number;
    active: number;
  };
  clients: number;
}

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [ordersRes, warehousesRes, statsRes] = await Promise.all([
          ordersApi.getAllOrders(1, 5, "pending"),
          warehousesApi.getWarehouses(true),
          historyApi.getStats(),
        ]);

        if (ordersRes.success) {
          setPendingOrders(ordersRes.data);
        }

        if (warehousesRes.success) {
          setWarehouses(warehousesRes.data);
        }

        if (statsRes.success) {
          setStats(statsRes.data);
        }
      } catch (error) {
        console.error("Ошибка загрузки данных:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  if (isLoading) {
    return <LoadingSpinner text="Загрузка данных..." />;
  }

  return (
    <div className="space-y-8">
      {/* Приветствие */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
          <ShieldCheckIcon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">
            Панель администратора
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Добро пожаловать, {user?.fullName}
          </p>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Всего заказов"
          value={stats?.orders.total || 0}
          icon={<CubeIcon className="w-5 h-5" />}
          color="blue"
          delay={0}
        />
        <StatCard
          title="Ожидают одобрения"
          value={stats?.orders.pending || 0}
          icon={<ClockIcon className="w-5 h-5" />}
          color="yellow"
          delay={0.05}
        />
        <StatCard
          title="Активных складов"
          value={stats?.warehouses.active || 0}
          icon={<BuildingStorefrontIcon className="w-5 h-5" />}
          color="green"
          delay={0.1}
        />
        <StatCard
          title="Клиентов"
          value={stats?.clients || 0}
          icon={<UsersIcon className="w-5 h-5" />}
          color="purple"
          delay={0.15}
        />
      </div>

      {/* Заказы на рассмотрении */}
      <Card>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-slate-800 flex items-center gap-2">
            <ClockIcon className="w-5 h-5 text-amber-500" />
            Заказы на рассмотрении
            {pendingOrders.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-600 text-xs rounded-full font-medium">
                {pendingOrders.length}
              </span>
            )}
          </h2>
          <Link
            href="/admin/orders"
            className="text-indigo-500 hover:text-indigo-600 text-sm flex items-center gap-1 font-medium"
          >
            Все заказы
            <ArrowRightIcon className="w-4 h-4" />
          </Link>
        </div>

        {pendingOrders.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircleIcon className="w-12 h-12 text-emerald-400 mx-auto mb-2" />
            <p className="text-slate-500">Нет заказов на рассмотрении</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pendingOrders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                    <ClockIcon className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800 text-sm">
                      {order.description}
                    </p>
                    <p className="text-xs text-slate-500">
                      От: {order.userName} • Склад: {order.warehouseName}
                    </p>
                  </div>
                </div>
                <Link href={`/admin/orders?highlight=${order.id}`}>
                  <span className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm flex items-center gap-1 transition-colors shadow-sm shadow-indigo-200">
                    Рассмотреть
                    <ArrowRightIcon className="w-3 h-3" />
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </Card>

      {/* Быстрые действия и склады */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Быстрые действия */}
        <Card>
          <h2 className="text-lg font-medium text-slate-800 mb-4 flex items-center gap-2">
            <CommandLineIcon className="w-5 h-5 text-indigo-500" />
            Быстрые действия
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/admin/orders">
              <div className="bg-indigo-50 hover:bg-indigo-100 rounded-xl p-4 cursor-pointer transition-colors">
                <ClipboardDocumentListIcon className="w-6 h-6 text-indigo-500" />
                <p className="font-medium text-slate-700 text-sm mt-2">
                  Заказы
                </p>
              </div>
            </Link>
            <Link href="/admin/warehouses">
              <div className="bg-emerald-50 hover:bg-emerald-100 rounded-xl p-4 cursor-pointer transition-colors">
                <BuildingStorefrontIcon className="w-6 h-6 text-emerald-500" />
                <p className="font-medium text-slate-700 text-sm mt-2">
                  Склады
                </p>
              </div>
            </Link>
            <Link href="/admin/history">
              <div className="bg-violet-50 hover:bg-violet-100 rounded-xl p-4 cursor-pointer transition-colors">
                <ClockIcon className="w-6 h-6 text-violet-500" />
                <p className="font-medium text-slate-700 text-sm mt-2">
                  История
                </p>
              </div>
            </Link>
            <Link href="/admin/warehouses?action=new">
              <div className="bg-amber-50 hover:bg-amber-100 rounded-xl p-4 cursor-pointer transition-colors">
                <PlusIcon className="w-6 h-6 text-amber-500" />
                <p className="font-medium text-slate-700 text-sm mt-2">
                  Новый склад
                </p>
              </div>
            </Link>
          </div>
        </Card>

        {/* Склады */}
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-slate-800 flex items-center gap-2">
              <BuildingStorefrontIcon className="w-5 h-5 text-indigo-500" />
              Склады
            </h2>
            <Link
              href="/admin/warehouses"
              className="text-indigo-500 hover:text-indigo-600 text-sm flex items-center gap-1 font-medium"
            >
              Все склады
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-2">
            {warehouses.slice(0, 4).map((warehouse, index) => (
              <motion.div
                key={warehouse.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <BuildingStorefrontIcon className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="font-medium text-slate-700 text-sm">
                      {warehouse.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {warehouse.ordersCount} заказов
                    </p>
                  </div>
                </div>
                <StatusBadge status={warehouse.status as any} />
              </motion.div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
