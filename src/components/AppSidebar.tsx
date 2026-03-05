import {
  LayoutDashboard,
  BookOpen,
  Clock,
  Settings,
  Briefcase,
  Megaphone,
  GraduationCap,
  Sparkles,
  ChevronDown,
  FolderOpen,
  HelpCircle,
  CalendarClock,
  LogOut,
  Shield,
  Building2,
  UserCheck,
  ListChecks,
  Route,
  Compass,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useTenant } from "@/contexts/TenantContext";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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
import apexLogo from "@/assets/apex-ai-logo.png";

const topItems = [
  { title: "Overview", url: "/", icon: LayoutDashboard },
];

const departmentItems = [
  { title: "Sales", url: "/departments/sales", icon: Briefcase },
  { title: "Marketing", url: "/departments/marketing", icon: Megaphone },
  { title: "Talent", url: "/departments/talent", icon: GraduationCap },
];

const onboardingItems = [
  { title: "Success Profiles", url: "/talent/onboarding/profiles", icon: UserCheck },
  { title: "Programs", url: "/talent/onboarding/programs", icon: ListChecks },
  { title: "Assignments", url: "/talent/onboarding/assignments", icon: Route },
  { title: "My Journey", url: "/talent/onboarding/my-journey", icon: Compass },
];

const toolItems = [
  { title: "Tasks", url: "/tasks", icon: CalendarClock },
  { title: "Capabilities", url: "/capabilities", icon: Sparkles },
  { title: "Content Library", url: "/content-library", icon: FolderOpen },
  { title: "Knowledge Base", url: "/knowledge", icon: BookOpen },
  { title: "History", url: "/history", icon: Clock },
];

const bottomItems = [
  { title: "Help", url: "/help", icon: HelpCircle },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin, isSuperAdmin } = useTenant();
  const deptOpen = location.pathname.startsWith("/departments");

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const logo = apexLogo;

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
      <SidebarHeader className="px-4 pt-5 pb-6">
        <div className="flex flex-col items-center gap-1.5">
          <img src={logo} alt="Apex AI" className="h-20 w-20 rounded-2xl object-cover shrink-0" />
          {!collapsed && (
            <div className="text-center">
              <p className="text-[11px] text-foreground/80">by Solutionment</p>
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
              <SidebarGroupLabel className="text-foreground/70 text-[10px] uppercase tracking-widest cursor-pointer flex items-center justify-between pr-2">
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
          <Collapsible defaultOpen={location.pathname.startsWith("/talent/onboarding")}>
            <CollapsibleTrigger className="w-full">
              <SidebarGroupLabel className="text-foreground/70 text-[10px] uppercase tracking-widest cursor-pointer flex items-center justify-between pr-2">
                Onboarding
                {!collapsed && <ChevronDown className="h-3 w-3" />}
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {onboardingItems.map((item) => renderNavItem(item))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-foreground/70 text-[10px] uppercase tracking-widest">
            Tools
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {toolItems.map((item) => renderNavItem(item))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          {bottomItems.map((item) => renderNavItem(item))}
          {isAdmin && (
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <NavLink
                  to="/workspace-admin"
                  className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                  activeClassName="bg-sidebar-accent text-primary font-medium"
                >
                  <Building2 className="h-4 w-4" />
                  {!collapsed && <span>Workspace Admin</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          {isSuperAdmin && (
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <NavLink
                  to="/super-admin"
                  className="text-amber-400 hover:bg-amber-500/10 hover:text-amber-300 transition-colors"
                  activeClassName="bg-amber-500/10 text-amber-300 font-medium"
                >
                  <Shield className="h-4 w-4" />
                  {!collapsed && <span>Super Admin</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
              {!collapsed && <span>Sign Out</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
