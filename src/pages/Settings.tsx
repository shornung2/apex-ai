import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Key, Bot, BarChart3, Users } from "lucide-react";
import { agentDefinitions } from "@/data/mock-data";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

export default function SettingsPage() {
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-4xl">
      <motion.div variants={item}>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Workspace configuration and administration</p>
      </motion.div>

      <motion.div variants={item}>
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="general" className="gap-1.5"><Building2 className="h-3.5 w-3.5" /> General</TabsTrigger>
            <TabsTrigger value="api" className="gap-1.5"><Key className="h-3.5 w-3.5" /> API Keys</TabsTrigger>
            <TabsTrigger value="agents" className="gap-1.5"><Bot className="h-3.5 w-3.5" /> Agents</TabsTrigger>
            <TabsTrigger value="usage" className="gap-1.5"><BarChart3 className="h-3.5 w-3.5" /> Usage</TabsTrigger>
            <TabsTrigger value="members" className="gap-1.5"><Users className="h-3.5 w-3.5" /> Members</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card className="glass-card">
              <CardHeader><CardTitle className="text-lg">Workspace</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Workspace Name</Label>
                  <Input defaultValue="Solutionment" className="bg-muted/50 border-border/50 max-w-sm" />
                </div>
                <div className="space-y-2">
                  <Label>Industry</Label>
                  <Input defaultValue="Technology Consulting" className="bg-muted/50 border-border/50 max-w-sm" />
                </div>
                <Button size="sm">Save</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api">
            <Card className="glass-card">
              <CardHeader><CardTitle className="text-lg">API Keys & Integrations</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">API keys are securely stored and never exposed in the client.</p>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div>
                    <p className="text-sm font-medium">AI Gateway</p>
                    <p className="text-xs text-muted-foreground">Connected via Lovable AI</p>
                  </div>
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Active</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="agents">
            <Card className="glass-card">
              <CardHeader><CardTitle className="text-lg">Agent Configuration</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {agentDefinitions.map((agent) => (
                  <div key={agent.type} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{agent.emoji}</span>
                      <div>
                        <p className="text-sm font-medium">{agent.name}</p>
                        <p className="text-xs text-muted-foreground">{agent.type}</p>
                      </div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="usage">
            <Card className="glass-card">
              <CardHeader><CardTitle className="text-lg">Usage & Billing</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Usage charts and billing details will appear here once connected to the backend.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="members">
            <Card className="glass-card">
              <CardHeader><CardTitle className="text-lg">Workspace Members</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">Member management will be available after authentication is configured.</p>
                <Button variant="outline" size="sm" disabled>Invite Member</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}
