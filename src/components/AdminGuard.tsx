import { type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useTenant } from "@/contexts/TenantContext";

interface AdminGuardProps {
  children: ReactNode;
  requireSuperAdmin?: boolean;
}

export function AdminGuard({ children, requireSuperAdmin = false }: AdminGuardProps) {
  const { isAdmin, isSuperAdmin, isLoading } = useTenant();

  if (isLoading) return null;

  if (requireSuperAdmin && !isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  if (!requireSuperAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
