import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, Save, Send, Loader2, UserMinus, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTenant } from "@/contexts/TenantContext";
import { format } from "date-fns";

interface TenantDetails {
  name: string;
  plan: string;
  status: string;
  allowed_domains: string[];
}

interface TeamMember {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  created_at: string;
}

export default function TeamWorkspaceSection() {
  const { tenantId, userRole } = useTenant();
  const { toast } = useToast();

  const [tenant, setTenant] = useState<TenantDetails | null>(null);
  const [workspaceName, setWorkspaceName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
    }
    init();
  }, []);

  // Fetch tenant details
  useEffect(() => {
    if (!tenantId) return;
    async function fetchTenant() {
      const { data } = await supabase
        .from("tenants")
        .select("name, plan, status, allowed_domains")
        .eq("id", tenantId)
        .single();
      if (data) {
        setTenant(data);
        setWorkspaceName(data.name);
      }
    }
    fetchTenant();
  }, [tenantId]);

  // Fetch team members
  useEffect(() => {
    if (!tenantId) return;
    async function fetchMembers() {
      setLoadingMembers(true);
      const { data } = await supabase
        .from("user_profiles")
        .select("id, full_name, email, role, created_at")
        .eq("tenant_id", tenantId)
        .eq("status", "active")
        .order("created_at", { ascending: true });
      setMembers(data || []);
      setLoadingMembers(false);
    }
    fetchMembers();
  }, [tenantId]);

  const handleSaveName = async () => {
    if (!tenantId || !workspaceName.trim()) return;
    setSavingName(true);
    const { error } = await supabase
      .from("tenants")
      .update({ name: workspaceName.trim() })
      .eq("id", tenantId);
    setSavingName(false);
    if (error) {
      toast({ title: "Error", description: "Failed to update workspace name.", variant: "destructive" });
    } else {
      toast({ title: "Saved", description: "Workspace name updated." });
      setTenant((prev) => prev ? { ...prev, name: workspaceName.trim() } : prev);
    }
  };

  const handleRoleChange = async (profileId: string, newRole: string) => {
    if (profileId === currentUserId) {
      toast({ title: "Not allowed", description: "You cannot change your own role.", variant: "destructive" });
      return;
    }
    const { error } = await supabase
      .from("user_profiles")
      .update({ role: newRole })
      .eq("id", profileId);
    if (error) {
      toast({ title: "Error", description: "Failed to update role.", variant: "destructive" });
    } else {
      setMembers((prev) => prev.map((m) => m.id === profileId ? { ...m, role: newRole } : m));
      toast({ title: "Role updated" });
    }
  };

  const handleRemoveMember = async (profileId: string, memberName: string) => {
    if (profileId === currentUserId) {
      toast({ title: "Not allowed", description: "You cannot remove yourself.", variant: "destructive" });
      return;
    }
    const { error } = await supabase
      .from("user_profiles")
      .update({ status: "removed" } as any)
      .eq("id", profileId);
    if (error) {
      toast({ title: "Error", description: "Failed to remove member.", variant: "destructive" });
    } else {
      setMembers((prev) => prev.filter((m) => m.id !== profileId));
      toast({ title: "Member removed", description: `${memberName || "User"} has been removed from the workspace.` });
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      const { data, error } = await supabase.functions.invoke("invite-user", {
        body: { email: inviteEmail.trim() },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: "Invitation sent", description: `Invitation sent to ${inviteEmail.trim()}` });
      setInviteEmail("");
    } catch (err: any) {
      toast({ title: "Invitation failed", description: err.message || "Failed to send invitation.", variant: "destructive" });
    }
    setInviting(false);
  };

  const planBadgeClass: Record<string, string> = {
    starter: "bg-muted text-muted-foreground border-border",
    managed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    enterprise: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  };

  const statusBadgeClass: Record<string, string> = {
    active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    trial: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    suspended: "bg-destructive/20 text-destructive border-destructive/30",
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Team & Workspace
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* SUB-SECTION 1: Workspace Details */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Workspace Details</h3>
          {!tenant ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-6 w-32" />
            </div>
          ) : (
            <>
              <div className="flex items-end gap-3 max-w-md">
                <div className="flex-1 space-y-1.5">
                  <Label htmlFor="ws-name">Workspace Name</Label>
                  <Input
                    id="ws-name"
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    className="bg-muted/50 border-border/50"
                  />
                </div>
                <Button size="sm" onClick={handleSaveName} disabled={savingName || workspaceName === tenant.name}>
                  {savingName ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Save
                </Button>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">Plan:</span>
                  <Badge className={planBadgeClass[tenant.plan] || planBadgeClass.starter}>
                    {tenant.plan.charAt(0).toUpperCase() + tenant.plan.slice(1)}
                  </Badge>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">Status:</span>
                  <Badge className={statusBadgeClass[tenant.status] || statusBadgeClass.active}>
                    {tenant.status.charAt(0).toUpperCase() + tenant.status.slice(1)}
                  </Badge>
                </div>
              </div>
              {tenant.allowed_domains.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-xs text-muted-foreground">Allowed domains</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {tenant.allowed_domains.map((d) => (
                      <Badge key={d} variant="outline" className="text-xs font-mono">
                        {d}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* SUB-SECTION 2: Team Members */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Team Members</h3>
          {loadingMembers ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <div className="rounded-md border border-border/50 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="text-xs">Full Name</TableHead>
                    <TableHead className="text-xs">Email</TableHead>
                    <TableHead className="text-xs">Role</TableHead>
                    <TableHead className="text-xs">Joined</TableHead>
                    <TableHead className="text-xs w-[60px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((m) => {
                    const isSelf = m.id === currentUserId;
                    return (
                      <TableRow key={m.id}>
                        <TableCell className="text-sm">{m.full_name || "—"}</TableCell>
                        <TableCell className="text-sm font-mono text-muted-foreground">{m.email || "—"}</TableCell>
                        <TableCell>
                          {isSelf ? (
                            <Badge variant="outline" className="text-xs capitalize">{m.role}</Badge>
                          ) : (
                            <Select value={m.role} onValueChange={(v) => handleRoleChange(m.id, v)}>
                              <SelectTrigger className="h-7 w-[110px] text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="member">Member</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {format(new Date(m.created_at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          {!isSelf && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              onClick={() => handleRemoveMember(m.id, m.full_name || m.email || "")}
                            >
                              <UserMinus className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {members.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">
                        No team members found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* SUB-SECTION 3: Invite Team Members */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Invite Team Members</h3>
          <div className="flex items-end gap-3 max-w-md">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="invite-email">Email address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  id="invite-email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className="pl-9 bg-muted/50 border-border/50"
                  onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                />
              </div>
            </div>
            <Button size="sm" onClick={handleInvite} disabled={inviting || !inviteEmail.trim()}>
              {inviting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              Send Invitation
            </Button>
          </div>
          <p className="text-xs text-muted-foreground max-w-md">
            The invited person must use a company email that matches your allowed domains. New domains are added automatically.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
