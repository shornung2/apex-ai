import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

async function ensureUserProfile(userId: string, email: string | undefined) {
  // Check if profile already exists
  const { data: existing } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (existing) return; // already provisioned

  // Look up tenant by email domain
  const domain = email?.split("@")[1];
  if (!domain) {
    console.error("Cannot provision user profile: no email domain");
    return;
  }

  // Find tenant whose allowed_domains contains this domain
  const { data: tenants } = await supabase
    .from("tenants")
    .select("id, allowed_domains");

  // RLS won't let us see tenants before we have a profile, so we use a
  // workaround: call a database function that runs as SECURITY DEFINER
  // For now, we'll try matching from what we can see. If no tenant found,
  // the insert will fail gracefully.
  
  // Since we can't query tenants without a profile (RLS), we need to use
  // a different approach - try inserting with the matching tenant
  // We'll use an RPC call or rely on a trigger. For now, use the anon-accessible
  // approach: call an edge function or use a DB function.
  
  // Simple approach: use the get_tenant_for_domain DB function
  const { data: tenantId } = await supabase.rpc("get_tenant_for_domain", { _domain: domain });
  
  if (!tenantId) {
    console.error("No tenant found for domain:", domain);
    return;
  }

  await supabase.from("user_profiles").insert({
    id: userId,
    tenant_id: tenantId,
    email,
    full_name: email?.split("@")[0] || null,
    role: "member",
  });
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!initialized.current) return;
        setAuthenticated(!!session);
        if (!session) navigate("/auth");
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      initialized.current = true;
      setAuthenticated(!!session);
      if (!session) {
        navigate("/auth");
      } else {
        // Auto-provision user profile if needed
        await ensureUserProfile(session.user.id, session.user.email);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!authenticated) return null;

  return <>{children}</>;
}
