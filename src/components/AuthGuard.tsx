import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        // Skip the INITIAL_SESSION event — handled by getSession below
        if (!initialized.current) return;
        setAuthenticated(!!session);
        if (!session) navigate("/auth");
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      initialized.current = true;
      setAuthenticated(!!session);
      if (!session) navigate("/auth");
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
