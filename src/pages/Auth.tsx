import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import apexLogo from "@/assets/apex-ai-logo.png";

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      toast({
        title: "Authentication Error",
        description: decodeURIComponent(error),
        variant: "destructive",
      });
      window.history.replaceState({}, '', '/auth');
    }

    const token = searchParams.get('token');
    const type = searchParams.get('type');
    
    if (token && type) {
      handleTokenVerification(token, type);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/");
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, searchParams, toast]);

  const handleTokenVerification = async (token: string, type: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: type as 'magiclink' | 'email',
      });

      if (error) {
        console.error('Token verification error:', error);
        toast({
          title: "Authentication Error",
          description: error.message,
          variant: "destructive",
        });
        setLoading(false);
        window.history.replaceState({}, '', '/auth');
        return;
      }

      if (data.session) {
        window.history.replaceState({}, '', '/auth');
        navigate("/");
        return;
      }
      
      setLoading(false);
      window.history.replaceState({}, '', '/auth');
    } catch (error) {
      console.error('Token verification error:', error);
      toast({
        title: "Authentication Error",
        description: "Failed to verify authentication token",
        variant: "destructive",
      });
      setLoading(false);
      window.history.replaceState({}, '', '/auth');
    }
  };

  const handleMicrosoftSignIn = async () => {
    setIsSigningIn(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const redirectTo = encodeURIComponent(window.location.origin + '/auth');
      const loginUrl = `${supabaseUrl}/functions/v1/auth-azure-login?redirect_to=${redirectTo}`;
      
      try {
        if (window.top && window.top !== window.self) {
          window.top.location.href = loginUrl;
        } else {
          window.location.href = loginUrl;
        }
      } catch {
        window.open(loginUrl, "_blank", "noopener,noreferrer");
      }
    } catch (error) {
      console.error("Sign in error:", error);
      toast({
        title: "Sign In Error",
        description: "Failed to initiate sign in",
        variant: "destructive",
      });
      setIsSigningIn(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg border-border">
        <CardContent className="pt-8 pb-8 px-8">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <img src={apexLogo} alt="Apex AI" className="h-20 w-20 rounded-2xl object-cover" />
            </div>

            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Apex AI
              </h1>
              <p className="text-muted-foreground text-sm">
                by Solutionment
              </p>
            </div>

            <p className="text-sm text-muted-foreground">
              Sign in with your Solutionment Microsoft account
            </p>

            <Button
              onClick={handleMicrosoftSignIn}
              disabled={isSigningIn}
              className="w-full h-12 font-medium"
              variant="default"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
                <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
                <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
                <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
                <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
              </svg>
              {isSigningIn ? "Signing in..." : "Sign in with Microsoft"}
            </Button>

            <p className="text-xs text-muted-foreground">
              Only Solutionment employees (@solutionment.com) can access this application.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
