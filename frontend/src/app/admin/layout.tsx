"use client";

import AuthGuard from "@/components/AuthGuard";
import DashboardLayout from "@/components/DashboardLayout";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard requiredRole="admin">
      <DashboardLayout>{children}</DashboardLayout>
    </AuthGuard>
  );
}
