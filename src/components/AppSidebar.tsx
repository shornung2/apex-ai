import {
  LayoutDashboard,
  BookOpen,
  Clock,
  Settings,
  Briefcase,
  Megaphone,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import logoDark from "@/assets/logo-dark.jpg";
import logoLight from "@/assets/logo-light.jpg";

const topItems = [
  { title: "Overview", url: "/", icon: LayoutDashboard },
];

const departmentItems = [
  { title: "Sales", url: "/departments/sales", icon: Briefcase },
  { title: "Marketing", url: "/departments/marketing", icon: Megaphone },
];

const toolItems = [
  { title: "Capabilities", url: "/capabilities", icon: Sparkles },
  { title: "Knowledge Base", url: "/knowledge", icon: BookOpen },
  { title: "History", url: "/history", icon: Clock },
];

const bottomItems = [
  { title: "Settings", url: "/settings", icon: Settings },
];

const TOKEN_BUDGET = 50_000;

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const deptOpen = location.pathname.startsWith("/departments");
  const { resolvedTheme } = useTheme();

  const [tokensUsed, setTokensUsed] = useState<number | null>(null);

  useEffect(() => {
    supabase
      .from("agent_jobs")
      .select("tokens_used")
      .then(({ data }) => {
        if (data) {
          const total = data.reduce((sum, row) => sum + (row.tokens_used || 0), 0);
          setTokensUsed(total);
        }
      });
  }, []);

  const tokenPercent = tokensUsed !== null ? Math.round((tokensUsed / TOKEN_BUDGET) * 100) : 0;
  const tokenColor =
    tokenPercent > 80 ? "bg-destructive" : tokenPercent > 60 ? "bg-amber-500" : "bg-emerald-500";

  const logo = resolvedTheme === "dark" ? logoDark : logoLight;

  const renderNavItem = (navItem: { title: string; url: string; icon: React.ElementType }, end?: boolean) => (
    <SidebarMenuItem key={navItem.title}>
      <SidebarMenuButton asChild>
        <NavLink
          to={navItem.url}
          end={end}
          className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          activeClassName="bg-sidebar-accent text-primary font-medium"
        >
          <navItem.icon className="h-4 w-4" />
          {!collapsed && <span>{navItem.title}</span>}
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <img src={logo} alt="Autopilot" className="h-8 w-8 rounded-lg object-cover" />
          {!collapsed && (
            <div>
              <h2 className="text-sm font-bold tracking-tight text-foreground">Autopilot</h2>
              <p className="text-[10px] text-muted-foreground">AI Operating System</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {topItems.map((item) => renderNavItem(item, item.url === "/"))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <Collapsible defaultOpen={deptOpen || true}>
            <CollapsibleTrigger className="w-full">
              <SidebarGroupLabel className="text-muted-foreground/60 text-[10px] uppercase tracking-widest cursor-pointer flex items-center justify-between pr-2">
                Departments
                {!collapsed && <ChevronDown className="h-3 w-3" />}
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {departmentItems.map((item) => renderNavItem(item))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground/60 text-[10px] uppercase tracking-widest">
            Tools
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {toolItems.map((item) => renderNavItem(item))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="space-y-3">
        {!collapsed && (
          <div className="px-3 space-y-1.5">
            {tokensUsed === null ? (
              <Skeleton className="h-6 w-full" />
            ) : (
              <>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>Token Usage</span>
                  <span>{tokensUsed.toLocaleString()} / {TOKEN_BUDGET.toLocaleString()}</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${tokenColor}`}
                    style={{ width: `${tokenPercent}%` }}
                  />
                </div>
              </>
            )}
          </div>
        )}
        <SidebarMenu>
          {bottomItems.map((item) => renderNavItem(item))}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
