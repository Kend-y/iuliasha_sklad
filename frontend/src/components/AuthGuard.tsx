"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "client" | null;
}

/**
 * Компонент для защиты маршрутов
 * Проверяет аутентификацию и роль пользователя
 */
export default function AuthGuard({
  children,
  requiredRole = null,
}: AuthGuardProps) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Проверяем аутентификацию
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    const userRole = user?.role?.toLowerCase();

    // Проверяем роль (case-insensitive)
    if (requiredRole && userRole !== requiredRole) {
      // Перенаправляем на соответствующий дашборд
      if (userRole === "admin") {
        router.push("/admin");
      } else {
        router.push("/client");
      }
      return;
    }

    setIsLoading(false);
  }, [isAuthenticated, user, requiredRole, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
