import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, ArrowLeft, Upload, Check, Loader2, FileText } from "lucide-react";
import logoLight from "@/assets/logo-light.jpg";

const STEPS = ["Welcome", "About Your Team", "Skill Packs", "Upload Document"];

const INDUSTRIES = [
  "B2B SaaS / Software",
  "IT Services / Systems Integration",
  "Professional Services",
  "Enterprise Technology",
  "Other",
];

const USE_CASES = [
  { value: "presales", label: "Presales Excellence" },
  { value: "sales", label: "Sales Productivity" },
  { value: "marketing", label: "Marketing & Content" },
  { value: "all", label: "All of the Above" },
];

const PACKS = [
  {
    slug: "presales",
    emoji: "🎯",
    title: "Presales Excellence Pack",
    description:
      "12 skills for RFP response, discovery preparation, competitive briefs, solution qualification, executive proposals, POC planning, and more.",
  },
  {
    slug: "sales",
    emoji: "💼",
    title: "Sales Productivity Pack",
    description:
      "10 skills for account research, personalized outreach, deal strategy, champion coaching, pipeline reviews, and win/loss analysis.",
  },
  {
    slug: "marketing",
    emoji: "✍️",
    title: "Marketing & Content Pack",
    description:
      "8 skills for thought leadership, LinkedIn content, market intelligence, campaign messaging, SEO briefs, and email nurture sequences.",
  },
];

const ACCEPTED_TYPES = ".pdf,.docx,.pptx,.txt,.md,.csv";
const MAX_FILE_SIZE = 10 * 1024 * 1024;

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                i < current
                  ? "bg-primary text-primary-foreground"
                  : i === current
                  ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {i < current ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <span className="text-[10px] text-muted-foreground mt-1 w-20 text-center hidden sm:block">
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={`w-12 h-0.5 mx-1 transition-colors ${
                i < current ? "bg-primary" : "bg-muted"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export function OnboardingWizard() {
  const { tenantId, tenantName } = useTenant();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(0);
  const [companyName, setCompanyName] = useState(tenantName || "");
  const [industry, setIndustry] = useState("");
  const [useCase, setUseCase] = useState("presales");
  const [selectedPacks, setSelectedPacks] = useState<string[]>(["presales"]);
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);

  // Auto-select packs when use case changes
  const handleUseCaseChange = (val: string) => {
    setUseCase(val);
    if (val === "presales") setSelectedPacks(["presales"]);
    else if (val === "sales") setSelectedPacks(["sales"]);
    else if (val === "marketing") setSelectedPacks(["marketing"]);
    else setSelectedPacks(["presales", "sales", "marketing"]);
  };

  const togglePack = (slug: string) => {
    setSelectedPacks((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const saveTeamInfo = async () => {
    if (!tenantId) return;
    const settings = [
      { key: "company_name", value: JSON.stringify(companyName) },
      { key: "industry", value: JSON.stringify(industry) },
      { key: "primary_use_case", value: JSON.stringify(useCase) },
    ];
    for (const s of settings) {
      await supabase
        .from("workspace_settings")
        .upsert(
          { tenant_id: tenantId, key: s.key, value: s.value as any },
          { onConflict: "tenant_id,key" }
        );
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      toast({ title: "File too large", description: "Max 10 MB", variant: "destructive" });
      return;
    }
    setUploading(true);
    const fileId = crypto.randomUUID();
    const filePath = `knowledge/${fileId}/${file.name}`;
    const { error: uploadError } = await supabase.storage.from("documents").upload(filePath, file);
    if (uploadError) {
      toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
      setUploading(false);
      return;
    }
    const { error } = await supabase.functions.invoke("knowledge-ingest", {
      body: { file_path: filePath, title: file.name, mime_type: file.type, tenant_id: tenantId },
    });
    if (error) {
      toast({ title: "Ingestion failed", description: error.message, variant: "destructive" });
    } else {
      setUploadedFile(file.name);
    }
    setUploading(false);
  };

  const finishOnboarding = async () => {
    setFinishing(true);
    try {
      // Seed skill packs
      const { data } = await supabase.functions.invoke("seed-skill-packs", {
        body: { tenant_id: tenantId, packs: selectedPacks },
      });
      const seeded = data?.seeded || 0;

      // Mark onboarding complete
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("user_profiles")
          .update({ onboarding_complete: true })
          .eq("id", user.id);
      }

      // Set quick start flag
      localStorage.setItem("show_quick_start", "true");
      localStorage.setItem("quick_start_packs", JSON.stringify(selectedPacks));

      // Invalidate profile query to dismiss overlay
      await queryClient.invalidateQueries({ queryKey: ["my-profile"] });

      toast({
        title: "Your workspace is ready!",
        description: `You have ${seeded} new skills — try one now!`,
      });
    } catch (err: any) {
      toast({ title: "Setup error", description: err.message, variant: "destructive" });
    } finally {
      setFinishing(false);
    }
  };

  const handleNext = async () => {
    if (step === 1) {
      await saveTeamInfo();
    }
    if (step === 3) {
      await finishOnboarding();
      return;
    }
    setStep((s) => s + 1);
  };

  const canProceed = () => {
    if (step === 1) return companyName.trim() && industry && useCase;
    if (step === 2) return selectedPacks.length > 0;
    return true;
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl p-8 max-h-[90vh] overflow-y-auto"
      >
        <StepIndicator current={step} />

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Step 1: Welcome */}
            {step === 0 && (
              <div className="text-center space-y-6">
                <img src={logoLight} alt="Apex AI" className="h-24 w-24 object-contain mx-auto rounded" />
                <h1 className="text-3xl font-bold tracking-tight">Welcome to Apex AI</h1>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Your AI-powered presales and sales intelligence platform by Solutionment.
                </p>
                <p className="text-sm text-muted-foreground">Let's set up your workspace in 3 minutes.</p>
                <Button size="lg" onClick={() => setStep(1)} className="gap-2">
                  Get Started <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Step 2: About Your Team */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold">Tell us about your team</h2>
                  <p className="text-muted-foreground text-sm mt-1">This helps us personalize your experience.</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label>Company name</Label>
                    <Input
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Your company"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Industry</Label>
                    <Select value={industry} onValueChange={setIndustry}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select your industry" />
                      </SelectTrigger>
                      <SelectContent>
                        {INDUSTRIES.map((ind) => (
                          <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Primary use case for Apex AI</Label>
                    <RadioGroup value={useCase} onValueChange={handleUseCaseChange} className="mt-2">
                      {USE_CASES.map((uc) => (
                        <div key={uc.value} className="flex items-center space-x-2">
                          <RadioGroupItem value={uc.value} id={uc.value} />
                          <Label htmlFor={uc.value} className="font-normal cursor-pointer">{uc.label}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Skill Packs */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold">Start with a curated skill pack</h2>
                  <p className="text-muted-foreground text-sm mt-1">
                    We've built ready-to-use AI skills for your team. Pick the packs that fit your work.
                  </p>
                </div>
                <div className="space-y-3">
                  {PACKS.map((pack) => {
                    const selected = selectedPacks.includes(pack.slug);
                    return (
                      <div
                        key={pack.slug}
                        onClick={() => togglePack(pack.slug)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          selected
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-border/80"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox checked={selected} className="mt-1" />
                          <div>
                            <p className="font-semibold">
                              {pack.emoji} {pack.title}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">{pack.description}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 4: Upload Document */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold">Give your agents some context</h2>
                  <p className="text-muted-foreground text-sm mt-1">
                    Upload a company overview, product guide, sales playbook, or any document about your business. Your agents will use it to personalize every output.
                  </p>
                </div>
                {uploadedFile ? (
                  <div className="flex items-center gap-3 p-4 rounded-xl border border-primary/30 bg-primary/5">
                    <Check className="h-5 w-5 text-primary shrink-0" />
                    <div>
                      <p className="font-medium flex items-center gap-2">
                        <FileText className="h-4 w-4" /> {uploadedFile}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Great — your agents are now grounded in your company context.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  >
                    {uploading ? (
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm font-medium">Click to upload a document</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          PDF, Word, PowerPoint, Text, CSV (max 10 MB)
                        </p>
                      </>
                    )}
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_TYPES}
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation buttons */}
        {step > 0 && (
          <div className="flex items-center justify-between mt-8">
            <Button variant="ghost" onClick={() => setStep((s) => s - 1)} disabled={finishing}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <div className="flex items-center gap-3">
              {step === 3 && !uploadedFile && (
                <Button variant="ghost" onClick={finishOnboarding} disabled={finishing} className="text-muted-foreground">
                  Skip this step <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              )}
              <Button onClick={handleNext} disabled={!canProceed() || finishing}>
                {finishing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {step === 3 ? "Finish Setup" : "Next"}
                {!finishing && <ArrowRight className="h-4 w-4 ml-1" />}
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
