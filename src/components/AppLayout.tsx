import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AlexChat } from "@/components/AlexChat";
import { OnboardingWizard } from "@/components/OnboardingWizard";
import { useTenant } from "@/contexts/TenantContext";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { onboardingComplete, isLoading } = useTenant();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b border-border/50 px-4 shrink-0">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
          </header>
          <main className="flex-1 overflow-auto p-6">{children}</main>
        </div>
      </div>
      <AlexChat />
      {!isLoading && !onboardingComplete && <OnboardingWizard />}
    </SidebarProvider>
  );
}
