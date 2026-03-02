import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    // Find all active tasks that are due
    const { data: dueTasks, error: fetchErr } = await supabase
      .from("scheduled_tasks")
      .select("*")
      .eq("status", "active")
      .lte("next_run_at", new Date().toISOString());

    if (fetchErr) {
      console.error("Error fetching due tasks:", fetchErr);
      return new Response(JSON.stringify({ error: fetchErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!dueTasks || dueTasks.length === 0) {
      return new Response(JSON.stringify({ message: "No tasks due", executed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: any[] = [];

    for (const task of dueTasks) {
      try {
        // Fetch the skill to get prompt template and system prompt
        const { data: skill } = await supabase
          .from("skills")
          .select("*")
          .eq("id", task.skill_id)
          .single();

        if (!skill) {
          console.error(`Skill ${task.skill_id} not found for task ${task.id}`);
          continue;
        }

        // Call agent-dispatch (non-streaming, we just need the job created)
        const dispatchResponse = await fetch(`${supabaseUrl}/functions/v1/agent-dispatch`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${serviceRoleKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            skillId: task.skill_id,
            skillName: task.skill_name,
            agentType: task.agent_type,
            department: task.department,
            title: `[Scheduled] ${task.title}`,
            inputs: task.inputs,
            promptTemplate: skill.prompt_template,
            systemPrompt: skill.system_prompt,
          }),
        });

        // Read the stream to get the jobId from the first SSE event
        let jobId: string | null = null;
        if (dispatchResponse.ok && dispatchResponse.body) {
          const reader = dispatchResponse.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";

          // Read just enough to get the jobId
          const { value } = await reader.read();
          if (value) {
            buffer = decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            for (const line of lines) {
              if (line.startsWith("data: ")) {
                try {
                  const parsed = JSON.parse(line.slice(6));
                  if (parsed.jobId) {
                    jobId = parsed.jobId;
                    break;
                  }
                } catch { /* skip */ }
              }
            }
          }
          // Cancel the rest of the stream - the job will complete on its own
          reader.cancel();
        }

        // Compute next_run_at
        const nextRun = computeNextRun(task.schedule_type, task.cron_expression);
        const newStatus = task.schedule_type === "once" ? "completed" : "active";

        await supabase
          .from("scheduled_tasks")
          .update({
            last_run_at: new Date().toISOString(),
            last_job_id: jobId,
            next_run_at: newStatus === "completed" ? null : nextRun,
            status: newStatus,
            run_count: (task.run_count || 0) + 1,
          })
          .eq("id", task.id);

        // Link the job back to the scheduled task
        if (jobId) {
          await supabase
            .from("agent_jobs")
            .update({ scheduled_task_id: task.id })
            .eq("id", jobId);
        }

        results.push({ taskId: task.id, jobId, status: "dispatched" });
      } catch (taskErr) {
        console.error(`Error executing task ${task.id}:`, taskErr);
        results.push({ taskId: task.id, status: "error", error: String(taskErr) });
      }
    }

    return new Response(JSON.stringify({ executed: results.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("task-scheduler error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function computeNextRun(scheduleType: string, cronExpression: string): string {
  const now = new Date();
  
  switch (scheduleType) {
    case "daily": {
      // Parse hour from cron "0 H * * *"
      const parts = cronExpression.split(" ");
      const hour = parseInt(parts[1]) || 9;
      const next = new Date(now);
      next.setUTCHours(hour, 0, 0, 0);
      if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
      return next.toISOString();
    }
    case "weekly": {
      // Parse from cron "0 H * * D"
      const parts = cronExpression.split(" ");
      const hour = parseInt(parts[1]) || 9;
      const dow = parseInt(parts[4]) || 1;
      const next = new Date(now);
      next.setUTCHours(hour, 0, 0, 0);
      const currentDow = next.getUTCDay();
      let daysUntil = dow - currentDow;
      if (daysUntil <= 0) daysUntil += 7;
      next.setUTCDate(next.getUTCDate() + daysUntil);
      return next.toISOString();
    }
    case "monthly": {
      // Parse from cron "0 H D * *"
      const parts = cronExpression.split(" ");
      const hour = parseInt(parts[1]) || 9;
      const dom = parseInt(parts[2]) || 1;
      const next = new Date(now);
      next.setUTCHours(hour, 0, 0, 0);
      next.setUTCDate(dom);
      if (next <= now) next.setUTCMonth(next.getUTCMonth() + 1);
      return next.toISOString();
    }
    default: {
      // For "once" or "custom", add 24h as fallback
      const next = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      return next.toISOString();
    }
  }
}
