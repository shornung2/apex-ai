import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AppLayout } from "@/components/AppLayout";
import { AuthGuard } from "@/components/AuthGuard";
import { TenantProvider } from "@/contexts/TenantContext";
import Dashboard from "./pages/Dashboard";
import Department from "./pages/Department";
import Capabilities from "./pages/Capabilities";
import History from "./pages/History";
import JobDetail from "./pages/JobDetail";
import Knowledge from "./pages/Knowledge";
import ContentLibrary from "./pages/ContentLibrary";
import Help from "./pages/Help";
import SettingsPage from "./pages/Settings";
import WorkspaceAdmin from "./pages/WorkspaceAdmin";
import NotFound from "./pages/NotFound";
import Tasks from "./pages/Tasks";
import Auth from "./pages/Auth";
import SuperAdmin from "./pages/SuperAdmin";
import { Navigate } from "react-router-dom";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="dark" storageKey="apex-ai-theme">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/about" element={<AboutRedirect />} />
            <Route
              path="/*"
              element={
                <AuthGuard>
                  <TenantProvider>
                    <AppLayout>
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/departments/:dept" element={<Department />} />
                        <Route path="/capabilities" element={<Capabilities />} />
                        <Route path="/history" element={<History />} />
                        <Route path="/jobs/:jobId" element={<JobDetail />} />
                        <Route path="/knowledge" element={<Knowledge />} />
                        <Route path="/content-library" element={<ContentLibrary />} />
                        <Route path="/tasks" element={<Tasks />} />
                        <Route path="/help" element={<Help />} />
                        <Route path="/settings" element={<SettingsPage />} />
                        <Route path="/workspace-admin" element={<WorkspaceAdmin />} />
                        <Route path="/super-admin" element={<SuperAdmin />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </AppLayout>
                  </TenantProvider>
                </AuthGuard>
              }
            />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
