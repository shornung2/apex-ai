import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface UserProfile {
  tenant_id: string;
  role: string;
  full_name: string | null;
  email: string | null;
}

export function useTenant() {
  const { data: profile, isLoading, error } = useQuery({
    queryKey: ["my-profile"],
    queryFn: async (): Promise<UserProfile> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("user_profiles")
        .select("tenant_id, role, full_name, email")
        .eq("id", user.id)
        .single();
      if (error) throw error;
      return data as UserProfile;
    },
    staleTime: 5 * 60 * 1000, // cache for 5 minutes
  });

  return {
    profile,
    tenantId: profile?.tenant_id ?? null,
    role: profile?.role ?? null,
    isLoading,
    error,
  };
}
