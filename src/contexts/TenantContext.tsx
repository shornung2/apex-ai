import { createContext, useContext, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

type TenantPlan = "starter" | "managed" | "enterprise";
type TenantStatus = "active" | "suspended" | "trial";
type UserRole = "super_admin" | "admin" | "member";

interface TenantContextValue {
  tenantId: string | null;
  tenantName: string | null;
  tenantPlan: TenantPlan | null;
  tenantStatus: TenantStatus | null;
  userRole: UserRole | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  onboardingComplete: boolean;
  hasActiveAssignment: boolean;
  isLoading: boolean;
}

const TenantContext = createContext<TenantContextValue>({
  tenantId: null,
  tenantName: null,
  tenantPlan: null,
  tenantStatus: null,
  userRole: null,
  isAdmin: false,
  isSuperAdmin: false,
  onboardingComplete: false,
  hasActiveAssignment: false,
  isLoading: true,
});

export function TenantProvider({ children }: { children: ReactNode }) {
  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ["my-profile"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("user_profiles")
        .select("tenant_id, role, full_name, email, onboarding_complete, tenants(name, plan, status)")
        .eq("id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const userId = profile ? profile.id ?? null : null;

  const { data: hasActiveAssignment = false, isLoading: loadingAssignment } = useQuery({
    queryKey: ["my-active-assignment", userId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      const { data, error } = await supabase
        .from("onboarding_assignments")
        .select("id")
        .eq("user_id", user.id)
        .in("status", ["active", "paused"])
        .limit(1);
      if (error) return false;
      return (data?.length ?? 0) > 0;
    },
    staleTime: 2 * 60 * 1000,
  });

  const isLoading = loadingProfile || loadingAssignment;
  const tenant = profile?.tenants as { name: string; plan: string; status: string } | null;

  const value: TenantContextValue = {
    tenantId: profile?.tenant_id ?? null,
    tenantName: tenant?.name ?? null,
    tenantPlan: (tenant?.plan as TenantPlan) ?? null,
    tenantStatus: (tenant?.status as TenantStatus) ?? null,
    userRole: (profile?.role as UserRole) ?? null,
    isAdmin: profile?.role === "admin" || profile?.role === "super_admin",
    isSuperAdmin: profile?.role === "super_admin",
    onboardingComplete: profile?.onboarding_complete ?? false,
    hasActiveAssignment,
    isLoading,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export function useTenant() {
  return useContext(TenantContext);
}
