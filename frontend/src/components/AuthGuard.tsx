"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "client" | "employee" | null;
  allowedRoles?: string[];
}

/**
 * Компонент для защиты маршрутов
 * Проверяет аутентификацию и роль пользователя
 */
export default function AuthGuard({
  children,
  requiredRole = null,
  allowedRoles,
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

    const userRole = user?.role;
    const userRoleLower = userRole?.toLowerCase();

    // Проверяем список разрешённых ролей
    if (allowedRoles && allowedRoles.length > 0) {
      const isAllowed = allowedRoles.some(
        (role) => role.toLowerCase() === userRoleLower
      );
      if (!isAllowed) {
        // Перенаправляем на соответствующий дашборд
        if (userRoleLower === "admin") {
          router.push("/admin");
        } else if (userRoleLower === "employee") {
          router.push("/employee");
        } else {
          router.push("/client");
        }
        return;
      }
    }
    // Проверяем конкретную роль (case-insensitive)
    else if (requiredRole && userRoleLower !== requiredRole) {
      // Перенаправляем на соответствующий дашборд
      if (userRoleLower === "admin") {
        router.push("/admin");
      } else if (userRoleLower === "employee") {
        router.push("/employee");
      } else {
        router.push("/client");
      }
      return;
    }

    setIsLoading(false);
  }, [isAuthenticated, user, requiredRole, allowedRoles, router]);

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
