"use client";

import DashboardLayout from "@/components/DashboardLayout";
import AuthGuard from "@/components/AuthGuard";

export default function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard allowedRoles={["Admin", "Employee"]}>
      <DashboardLayout role="employee">{children}</DashboardLayout>
    </AuthGuard>
  );
}
