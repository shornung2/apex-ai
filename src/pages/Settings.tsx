import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Building2, Key, Sparkles, Bell } from "lucide-react";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

export default function SettingsPage() {
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8 max-w-3xl">
      <motion.div variants={item}>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your organization and preferences</p>
      </motion.div>

      {/* Organization */}
      <motion.div variants={item}>
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><Building2 className="h-4 w-4 text-primary" /> Organization</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Company Name</Label>
              <Input defaultValue="Solutionment" className="bg-muted/50 border-border/50" />
            </div>
            <div className="space-y-2">
              <Label>Industry</Label>
              <Input defaultValue="Technology Consulting" className="bg-muted/50 border-border/50" />
            </div>
            <Button size="sm">Save Changes</Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* API Keys */}
      <motion.div variants={item}>
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><Key className="h-4 w-4 text-primary" /> API Keys & Integrations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">External service connections will be configured here.</p>
            <Button variant="outline" size="sm" disabled>Add Integration</Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Skill Management */}
      <motion.div variants={item}>
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Skill Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {["Company/Market Research", "Content Generation", "Lead Research & Scoring", "Proposal/SOW Drafting"].map((skill) => (
              <div key={skill} className="flex items-center justify-between">
                <span className="text-sm">{skill}</span>
                <Switch defaultChecked />
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* Preferences */}
      <motion.div variants={item}>
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><Bell className="h-4 w-4 text-primary" /> Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Email Notifications</p>
                <p className="text-xs text-muted-foreground">Receive alerts for task completions</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator className="bg-border/50" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Auto-approve tasks</p>
                <p className="text-xs text-muted-foreground">Skip human review for low-risk tasks</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
