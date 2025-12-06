"use client";

import AuthGuard from "@/components/AuthGuard";
import DashboardLayout from "@/components/DashboardLayout";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard requiredRole="client">
      <DashboardLayout role="client">{children}</DashboardLayout>
    </AuthGuard>
  );
}
