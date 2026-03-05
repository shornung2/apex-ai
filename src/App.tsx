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
import SuccessProfileList from "./pages/onboarding/SuccessProfileList";
import SuccessProfileBuilder from "./pages/onboarding/SuccessProfileBuilder";
import ProgramList from "./pages/onboarding/ProgramList";
import ProgramBuilder from "./pages/onboarding/ProgramBuilder";
import AdminDashboard from "./pages/onboarding/AdminDashboard";
import LearnerJourney from "./pages/onboarding/LearnerJourney";
import LearnerNotebook from "./pages/onboarding/LearnerNotebook";
import CheckpointSession from "./pages/onboarding/CheckpointSession";
import RolePlaySessionPage from "./pages/onboarding/RolePlaySessionPage";

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
                        <Route path="/talent/onboarding/profiles" element={<SuccessProfileList />} />
                        <Route path="/talent/onboarding/profiles/new" element={<SuccessProfileBuilder />} />
                        <Route path="/talent/onboarding/profiles/:id/edit" element={<SuccessProfileBuilder />} />
                        <Route path="/talent/onboarding/programs" element={<ProgramList />} />
                        <Route path="/talent/onboarding/programs/new" element={<ProgramBuilder />} />
                        <Route path="/talent/onboarding/programs/:id/edit" element={<ProgramBuilder />} />
                        <Route path="/talent/onboarding/assignments" element={<AdminDashboard />} />
                        <Route path="/talent/onboarding/my-journey" element={<LearnerJourney />} />
                        <Route path="/talent/onboarding/my-journey/notebook" element={<LearnerNotebook />} />
                        <Route path="/talent/onboarding/my-journey/checkpoint/:phase" element={<CheckpointSession />} />
                        <Route path="/talent/onboarding/my-journey/roleplay/:sessionType" element={<RolePlaySessionPage />} />
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
