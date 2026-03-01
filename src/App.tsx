import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AppLayout } from "@/components/AppLayout";
import Dashboard from "./pages/Dashboard";
import Department from "./pages/Department";
import Capabilities from "./pages/Capabilities";
import History from "./pages/History";
import JobDetail from "./pages/JobDetail";
import Knowledge from "./pages/Knowledge";
import SettingsPage from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="dark" storageKey="autopilot-theme">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppLayout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/departments/:dept" element={<Department />} />
              <Route path="/capabilities" element={<Capabilities />} />
              <Route path="/history" element={<History />} />
              <Route path="/jobs/:jobId" element={<JobDetail />} />
              <Route path="/knowledge" element={<Knowledge />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
