import { supabase } from "@/integrations/supabase/client";
import type { Skill } from "@/data/mock-data";

const DISPATCH_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-dispatch`;

export interface RunSkillOptions {
  skill: Skill;
  inputs: Record<string, string>;
  tenantId?: string;
  onDelta: (text: string) => void;
  onJobId: (jobId: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
  signal?: AbortSignal;
}

export async function runSkill({ skill, inputs, tenantId, onDelta, onJobId, onDone, onError, signal }: RunSkillOptions) {
  try {
    const resp = await fetch(DISPATCH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({
        skillId: skill.id,
        skillName: skill.name,
        agentType: skill.agentType,
        department: skill.department,
        title: `${skill.displayName || skill.name}: ${Object.values(inputs).filter(Boolean).slice(0, 2).join(", ")}`,
        inputs,
        promptTemplate: skill.promptTemplate,
        systemPrompt: skill.systemPrompt || "",
        preferredModel: skill.preferredModel,
        webSearchEnabled: skill.webSearchEnabled,
        tenantId,
      }),
      signal,
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ error: "Request failed" }));
      onError(err.error || `Error ${resp.status}`);
      return;
    }

    if (!resp.body) {
      onError("No response stream");
      return;
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIdx: number;
        while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIdx);
          buffer = buffer.slice(newlineIdx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            onDone();
            return;
          }
          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.jobId) onJobId(parsed.jobId);
            if (parsed.content) onDelta(parsed.content);
          } catch {
            // partial JSON
          }
        }
      }
    } catch (e) {
      if (signal?.aborted) return; // expected abort
      throw e;
    }

    onDone();
  } catch (e) {
    if (signal?.aborted) return; // expected abort
    onError(e instanceof Error ? e.message : "Network error");
  }
}

const DECK_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-deck`;

export interface RunDeckSkillOptions {
  skill: Skill;
  inputs: Record<string, string>;
  deckType: "capabilities" | "proposal";
  tenantId?: string;
}

export async function runDeckSkill({ skill, inputs, deckType, tenantId }: RunDeckSkillOptions): Promise<{ jobId: string; fileUrl: string; slideCount: number }> {
  const resp = await fetch(DECK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({
      skillId: skill.id,
      skillName: skill.name,
      agentType: skill.agentType,
      department: skill.department,
      title: `${skill.displayName || skill.name}: ${Object.values(inputs).filter(Boolean).slice(0, 2).join(", ")}`,
      inputs,
      deckType,
      tenantId,
    }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || `Error ${resp.status}`);
  }

  return resp.json();
}

export function subscribeToJob(jobId: string, callback: (job: any) => void) {
  const channel = supabase
    .channel(`job-${jobId}`)
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "agent_jobs", filter: `id=eq.${jobId}` },
      (payload) => callback(payload.new)
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
