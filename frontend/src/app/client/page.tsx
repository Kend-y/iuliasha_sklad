"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ordersApi, warehousesApi } from "@/lib/api";
import { useAuthStore, Order, Warehouse } from "@/lib/store";
import {
  Card,
  StatCard,
  StatusBadge,
  LoadingSpinner,
  EmptyState,
} from "@/components/UI";
import {
  CubeIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlusIcon,
  ClipboardDocumentListIcon,
  BuildingStorefrontIcon,
  ArrowRightIcon,
  SparklesIcon,
  RocketLaunchIcon,
} from "@heroicons/react/24/outline";

export default function ClientDashboard() {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [ordersRes, warehousesRes] = await Promise.all([
          ordersApi.getMyOrders(1, 5),
          warehousesApi.getWarehouses(),
        ]);

        if (ordersRes.success) {
          setOrders(ordersRes.data);

          const allOrdersRes = await ordersApi.getMyOrders(1, 100);
          if (allOrdersRes.success) {
            const allOrders = allOrdersRes.data;
            setStats({
              total: allOrders.length,
              pending: allOrders.filter((o: Order) => o.status === "pending")
                .length,
              approved: allOrders.filter((o: Order) => o.status === "approved")
                .length,
              rejected: allOrders.filter((o: Order) => o.status === "rejected")
                .length,
            });
          }
        }

        if (warehousesRes.success) {
          setWarehouses(warehousesRes.data);
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
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <div className="w-16 h-16 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
          <SparklesIcon className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            Добро пожаловать, {user?.fullName}!
          </h1>
          <p className="text-slate-500 mt-1">
            Управляйте своими заказами и отслеживайте их статус
          </p>
        </div>
      </motion.div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Всего заказов"
          value={stats.total}
          icon={<CubeIcon className="w-6 h-6" />}
          color="cyan"
          delay={0}
        />
        <StatCard
          title="В обработке"
          value={stats.pending}
          icon={<ClockIcon className="w-6 h-6" />}
          color="yellow"
          delay={0.1}
        />
        <StatCard
          title="Одобрено"
          value={stats.approved}
          icon={<CheckCircleIcon className="w-6 h-6" />}
          color="green"
          delay={0.2}
        />
        <StatCard
          title="Отклонено"
          value={stats.rejected}
          icon={<XCircleIcon className="w-6 h-6" />}
          color="red"
          delay={0.3}
        />
      </div>

      {/* Быстрые действия */}
      <Card borderColor="indigo">
        <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <RocketLaunchIcon className="w-6 h-6 text-indigo-500" />
          Быстрые действия
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/client/new-order">
            <div className="bg-indigo-50 border-2 border-indigo-200 rounded-2xl p-6 cursor-pointer group hover:bg-indigo-100 transition-colors">
              <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                <PlusIcon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mt-4 flex items-center gap-2">
                Новый заказ
                <ArrowRightIcon className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-indigo-500" />
              </h3>
              <p className="text-slate-500 mt-1">
                Создать новый заказ на склад
              </p>
            </div>
          </Link>
          <Link href="/client/orders">
            <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-6 cursor-pointer group hover:bg-slate-100 transition-colors">
              <div className="w-12 h-12 bg-slate-200 rounded-xl flex items-center justify-center">
                <ClipboardDocumentListIcon className="w-6 h-6 text-slate-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mt-4 flex items-center gap-2">
                Мои заказы
                <ArrowRightIcon className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-slate-600" />
              </h3>
              <p className="text-slate-500 mt-1">Просмотреть все заказы</p>
            </div>
          </Link>
        </div>
      </Card>

      {/* Последние заказы */}
      <Card borderColor="cyan">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
            <ClipboardDocumentListIcon className="w-6 h-6 text-cyan-500" />
            Последние заказы
          </h2>
          <Link
            href="/client/orders"
            className="text-indigo-500 hover:text-indigo-600 font-medium transition-colors flex items-center gap-1"
          >
            Все заказы
            <ArrowRightIcon className="w-4 h-4" />
          </Link>
        </div>

        {orders.length === 0 ? (
          <EmptyState
            icon={<CubeIcon className="w-full h-full" />}
            title="Нет заказов"
            description="Создайте свой первый заказ"
            action={{
              label: "Создать заказ",
              onClick: () => (window.location.href = "/client/new-order"),
              icon: <PlusIcon className="w-5 h-5" />,
            }}
          />
        ) : (
          <div className="space-y-3">
            {orders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border-2 border-slate-100 hover:border-slate-200 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center border-2 border-cyan-200">
                    <CubeIcon className="w-6 h-6 text-cyan-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">
                      {order.description}
                    </p>
                    <p className="text-sm text-slate-500">
                      {order.warehouseName} •{" "}
                      {new Date(order.createdAt).toLocaleDateString("ru-RU")}
                    </p>
                  </div>
                </div>
                <StatusBadge status={order.status} />
              </motion.div>
            ))}
          </div>
        )}
      </Card>

      {/* Доступные склады */}
      <Card borderColor="violet">
        <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <BuildingStorefrontIcon className="w-6 h-6 text-violet-500" />
          Доступные склады
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {warehouses.slice(0, 3).map((warehouse, index) => (
            <motion.div
              key={warehouse.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-violet-50 border-2 border-violet-200 rounded-xl p-4 hover:bg-violet-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center border-2 border-violet-200">
                  <BuildingStorefrontIcon className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">
                    {warehouse.name}
                  </h3>
                  <p className="text-sm text-slate-500">{warehouse.address}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>
    </div>
  );
}
