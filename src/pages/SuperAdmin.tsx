import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTenant } from "@/contexts/TenantContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { Shield, Plus, ExternalLink, Search } from "lucide-react";

// Types for RPC results
interface TenantRow {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
  allowed_domains: string[];
  token_budget_monthly: number;
  created_at: string;
  user_count: number;
}

interface JobRow {
  id: string;
  tenant_id: string;
  tenant_name: string;
  title: string;
  agent_type: string;
  department: string;
  status: string;
  tokens_used: number;
  skill_id: string;
  feedback_rating: number | null;
  feedback_note: string | null;
  created_at: string;
  completed_at: string | null;
}

interface UsageRow {
  tenant_id: string;
  tenant_name: string;
  plan: string;
  jobs_this_month: number;
  tokens_this_month: number;
  last_active: string | null;
}

const planBadgeVariant = (plan: string) => {
  switch (plan) {
    case "enterprise": return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    case "managed": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    default: return "bg-muted text-muted-foreground";
  }
};

const statusBadgeVariant = (status: string) => {
  switch (status) {
    case "active": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    case "trial": return "bg-orange-500/20 text-orange-400 border-orange-500/30";
    case "suspended": return "bg-destructive/20 text-destructive border-destructive/30";
    default: return "bg-muted text-muted-foreground";
  }
};

const jobStatusBadge = (status: string) => {
  switch (status) {
    case "completed": return "bg-emerald-500/20 text-emerald-400";
    case "failed": return "bg-destructive/20 text-destructive";
    case "running": return "bg-blue-500/20 text-blue-400";
    default: return "bg-muted text-muted-foreground";
  }
};

export default function SuperAdmin() {
  const { isSuperAdmin, isLoading } = useTenant();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading && !isSuperAdmin) {
      toast({ title: "Access denied", variant: "destructive" });
      navigate("/");
    }
  }, [isLoading, isSuperAdmin, navigate, toast]);

  if (isLoading || !isSuperAdmin) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-6 w-6 text-amber-400" />
        <h1 className="text-2xl font-bold">Super Admin</h1>
      </div>

      <Tabs defaultValue="tenants">
        <TabsList>
          <TabsTrigger value="tenants">Tenants</TabsTrigger>
          <TabsTrigger value="usage">Usage Overview</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
          <TabsTrigger value="quality">Quality</TabsTrigger>
        </TabsList>

        <TabsContent value="tenants"><TenantsTab /></TabsContent>
        <TabsContent value="usage"><UsageTab /></TabsContent>
        <TabsContent value="audit"><AuditLogTab /></TabsContent>
        <TabsContent value="quality"><QualityTab /></TabsContent>
      </Tabs>
    </div>
  );
}

/* ─── Tab 1: Tenants ─── */
function TenantsTab() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editTenant, setEditTenant] = useState<TenantRow | null>(null);
  const [newOpen, setNewOpen] = useState(false);

  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ["admin-tenants"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_list_all_tenants");
      if (error) throw error;
      return (data ?? []) as TenantRow[];
    },
  });

  const updateMut = useMutation({
    mutationFn: async (args: { _id: string; _name?: string; _plan?: string; _status?: string; _allowed_domains?: string[]; _token_budget_monthly?: number }) => {
      const { error } = await supabase.rpc("admin_update_tenant", args as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tenants"] });
      toast({ title: "Tenant updated" });
      setEditTenant(null);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const toggleStatus = (t: TenantRow) => {
    const newStatus = t.status === "suspended" ? "active" : "suspended";
    updateMut.mutate({ _id: t.id, _status: newStatus });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>All Tenants</CardTitle>
        <Dialog open={newOpen} onOpenChange={setNewOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> New Tenant</Button>
          </DialogTrigger>
          <DialogContent>
            <NewTenantForm onSuccess={() => { setNewOpen(false); queryClient.invalidateQueries({ queryKey: ["admin-tenants"] }); }} />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? <p className="text-muted-foreground">Loading…</p> : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Domains</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{t.slug}</TableCell>
                  <TableCell><Badge variant="outline" className={planBadgeVariant(t.plan)}>{t.plan}</Badge></TableCell>
                  <TableCell><Badge variant="outline" className={statusBadgeVariant(t.status)}>{t.status}</Badge></TableCell>
                  <TableCell className="text-xs max-w-[120px] truncate">{t.allowed_domains?.join(", ") || "—"}</TableCell>
                  <TableCell>{t.user_count}</TableCell>
                  <TableCell className="text-xs">{format(new Date(t.created_at), "MMM d, yyyy")}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button size="sm" variant="outline" onClick={() => setEditTenant(t)}>Edit</Button>
                    <Button size="sm" variant={t.status === "suspended" ? "default" : "destructive"} onClick={() => toggleStatus(t)}>
                      {t.status === "suspended" ? "Reactivate" : "Suspend"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Sheet open={!!editTenant} onOpenChange={(o) => !o && setEditTenant(null)}>
        <SheetContent>
          {editTenant && (
            <EditTenantForm tenant={editTenant} onSave={(vals) => updateMut.mutate({ _id: editTenant.id, ...vals })} saving={updateMut.isPending} />
          )}
        </SheetContent>
      </Sheet>
    </Card>
  );
}

function NewTenantForm({ onSuccess }: { onSuccess: () => void }) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [domains, setDomains] = useState("");
  const [plan, setPlan] = useState("starter");
  const [saving, setSaving] = useState(false);

  const autoSlug = (n: string) => n.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const handleSubmit = async () => {
    setSaving(true);
    const { error } = await supabase.rpc("admin_insert_tenant", {
      _name: name,
      _slug: slug || autoSlug(name),
      _plan: plan,
      _allowed_domains: domains ? domains.split(",").map((d) => d.trim()) : [],
    } as any);
    setSaving(false);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Tenant created" });
    onSuccess();
  };

  return (
    <>
      <DialogHeader><DialogTitle>New Tenant</DialogTitle></DialogHeader>
      <div className="space-y-4 pt-4">
        <div><Label>Company Name</Label><Input value={name} onChange={(e) => { setName(e.target.value); if (!slug) setSlug(autoSlug(e.target.value)); }} /></div>
        <div><Label>Slug</Label><Input value={slug} onChange={(e) => setSlug(e.target.value)} /></div>
        <div><Label>Allowed Domains (comma-separated)</Label><Input value={domains} onChange={(e) => setDomains(e.target.value)} placeholder="acme.com, acme.co" /></div>
        <div>
          <Label>Plan</Label>
          <Select value={plan} onValueChange={setPlan}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="starter">Starter</SelectItem>
              <SelectItem value="managed">Managed</SelectItem>
              <SelectItem value="enterprise">Enterprise</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleSubmit} disabled={saving || !name} className="w-full">{saving ? "Creating…" : "Create Tenant"}</Button>
      </div>
    </>
  );
}

function EditTenantForm({ tenant, onSave, saving }: { tenant: TenantRow; onSave: (v: any) => void; saving: boolean }) {
  const [name, setName] = useState(tenant.name);
  const [plan, setPlan] = useState(tenant.plan);
  const [status, setStatus] = useState(tenant.status);
  const [domains, setDomains] = useState(tenant.allowed_domains?.join(", ") || "");
  const [budget, setBudget] = useState(String(tenant.token_budget_monthly));

  return (
    <>
      <SheetHeader><SheetTitle>Edit Tenant</SheetTitle></SheetHeader>
      <div className="space-y-4 pt-6">
        <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div>
          <Label>Plan</Label>
          <Select value={plan} onValueChange={setPlan}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="starter">Starter</SelectItem>
              <SelectItem value="managed">Managed</SelectItem>
              <SelectItem value="enterprise">Enterprise</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="trial">Trial</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div><Label>Allowed Domains</Label><Input value={domains} onChange={(e) => setDomains(e.target.value)} /></div>
        <div><Label>Monthly Token Budget</Label><Input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} /></div>
        <Button onClick={() => onSave({ _name: name, _plan: plan, _status: status, _allowed_domains: domains ? domains.split(",").map((d) => d.trim()) : [], _token_budget_monthly: Number(budget) })} disabled={saving} className="w-full">
          {saving ? "Saving…" : "Save Changes"}
        </Button>
      </div>
    </>
  );
}

/* ─── Tab 2: Usage ─── */
function UsageTab() {
  const { data: usage = [], isLoading } = useQuery({
    queryKey: ["admin-usage"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_usage_summary");
      if (error) throw error;
      return (data ?? []) as UsageRow[];
    },
  });

  const totalActive = usage.filter((u) => u.jobs_this_month > 0).length;
  const totalJobs = usage.reduce((s, u) => s + (u.jobs_this_month || 0), 0);
  const totalTokens = usage.reduce((s, u) => s + (u.tokens_this_month || 0), 0);
  const avgTokens = usage.length ? Math.round(totalTokens / usage.length) : 0;

  const stats = [
    { label: "Active Tenants", value: totalActive },
    { label: "Jobs This Month", value: totalJobs.toLocaleString() },
    { label: "Tokens This Month", value: totalTokens.toLocaleString() },
    { label: "Avg Tokens / Tenant", value: avgTokens.toLocaleString() },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className="text-2xl font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? <p className="text-muted-foreground">Loading…</p> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Jobs</TableHead>
                  <TableHead>Tokens</TableHead>
                  <TableHead>Est. Cost</TableHead>
                  <TableHead>Last Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usage.map((u) => (
                  <TableRow key={u.tenant_id}>
                    <TableCell className="font-medium">{u.tenant_name}</TableCell>
                    <TableCell><Badge variant="outline" className={planBadgeVariant(u.plan)}>{u.plan}</Badge></TableCell>
                    <TableCell>{u.jobs_this_month}</TableCell>
                    <TableCell>{(u.tokens_this_month || 0).toLocaleString()}</TableCell>
                    <TableCell>${((u.tokens_this_month || 0) * 0.000002).toFixed(2)}</TableCell>
                    <TableCell className="text-xs">{u.last_active ? format(new Date(u.last_active), "MMM d, HH:mm") : "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── Tab 3: Audit Log ─── */
function AuditLogTab() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [tenantFilter, setTenantFilter] = useState<string>("all");

  const { data: tenants = [] } = useQuery({
    queryKey: ["admin-tenants"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_list_all_tenants");
      if (error) throw error;
      return (data ?? []) as TenantRow[];
    },
  });

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["admin-audit", tenantFilter, statusFilter, search],
    queryFn: async () => {
      const params: any = { _limit: 100, _offset: 0 };
      if (tenantFilter !== "all") params._tenant_id = tenantFilter;
      if (statusFilter !== "all") params._status = statusFilter;
      if (search) params._search = search;
      const { data, error } = await supabase.rpc("admin_list_all_agent_jobs", params);
      if (error) throw error;
      return (data ?? []) as JobRow[];
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit Log</CardTitle>
        <div className="flex flex-wrap gap-3 pt-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search jobs…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 w-[200px]" />
          </div>
          <Select value={tenantFilter} onValueChange={setTenantFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Tenants" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tenants</SelectItem>
              {tenants.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="All Statuses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="running">Running</SelectItem>
              <SelectItem value="queued">Queued</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? <p className="text-muted-foreground">Loading…</p> : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant</TableHead>
                <TableHead>Job Title</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tokens</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((j) => (
                <TableRow key={j.id} className="cursor-pointer hover:bg-muted/50" onClick={() => window.open(`/jobs/${j.id}`, "_blank")}>
                  <TableCell className="text-xs">{j.tenant_name}</TableCell>
                  <TableCell className="font-medium">{j.title}</TableCell>
                  <TableCell className="text-xs">{j.agent_type}</TableCell>
                  <TableCell className="text-xs capitalize">{j.department}</TableCell>
                  <TableCell><Badge variant="outline" className={jobStatusBadge(j.status)}>{j.status}</Badge></TableCell>
                  <TableCell>{(j.tokens_used || 0).toLocaleString()}</TableCell>
                  <TableCell className="text-xs">{format(new Date(j.created_at), "MMM d, HH:mm")}</TableCell>
                </TableRow>
              ))}
              {jobs.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">No jobs found</TableCell></TableRow>}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── Tab 4: Quality ─── */
function QualityTab() {
  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["admin-quality"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_list_all_agent_jobs", { _feedback_rating: -1 as any, _limit: 100, _offset: 0 });
      if (error) throw error;
      return (data ?? []) as JobRow[];
    },
  });

  return (
    <Card>
      <CardHeader><CardTitle>Quality — Negative Feedback</CardTitle></CardHeader>
      <CardContent>
        {isLoading ? <p className="text-muted-foreground">Loading…</p> : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant</TableHead>
                <TableHead>Skill</TableHead>
                <TableHead>Job Title</TableHead>
                <TableHead>Feedback Note</TableHead>
                <TableHead>Tokens</TableHead>
                <TableHead>Date</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((j) => (
                <TableRow key={j.id}>
                  <TableCell className="text-xs">{j.tenant_name}</TableCell>
                  <TableCell className="text-xs">{j.skill_id}</TableCell>
                  <TableCell className="font-medium">{j.title}</TableCell>
                  <TableCell className="text-xs max-w-[200px] truncate">{j.feedback_note || "—"}</TableCell>
                  <TableCell>{(j.tokens_used || 0).toLocaleString()}</TableCell>
                  <TableCell className="text-xs">{format(new Date(j.created_at), "MMM d, HH:mm")}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="ghost" onClick={() => window.open(`/jobs/${j.id}`, "_blank")}>
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {jobs.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">No negative feedback yet</TableCell></TableRow>}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
