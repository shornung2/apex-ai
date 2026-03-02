import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface TelegramMessage {
  message_id: number;
  chat: { id: number };
  text?: string;
  from?: { first_name?: string };
}

interface TelegramCallbackQuery {
  id: string;
  message?: { chat: { id: number }; message_id: number };
  data?: string;
  from?: { first_name?: string };
}

interface TelegramUpdate {
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
}

interface SkillInput {
  id: string;
  field?: string;
  label: string;
  type: string;
  placeholder?: string;
  hint?: string;
  required?: boolean;
}

const TELEGRAM_API = "https://api.telegram.org/bot";

function getBotToken(): string {
  const token = Deno.env.get("TELEGRAM_BOT_TOKEN");
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN not configured");
  return token;
}

function getSupabase() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

async function sendMessage(chatId: number, text: string, options: Record<string, unknown> = {}) {
  const token = getBotToken();
  const chunks = splitMessage(text);
  for (const chunk of chunks) {
    await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: chunk,
        parse_mode: "HTML",
        ...options,
      }),
    });
  }
}

async function answerCallback(callbackQueryId: string) {
  const token = getBotToken();
  await fetch(`${TELEGRAM_API}${token}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: callbackQueryId }),
  });
}

function splitMessage(text: string, maxLen = 4000): string[] {
  if (text.length <= maxLen) return [text];
  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > 0) {
    if (remaining.length <= maxLen) {
      chunks.push(remaining);
      break;
    }
    let splitAt = remaining.lastIndexOf("\n\n", maxLen);
    if (splitAt < maxLen * 0.3) splitAt = remaining.lastIndexOf("\n", maxLen);
    if (splitAt < maxLen * 0.3) splitAt = maxLen;
    chunks.push(remaining.slice(0, splitAt));
    remaining = remaining.slice(splitAt).trimStart();
  }
  return chunks;
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function getOrCreateSession(supabase: ReturnType<typeof createClient>, chatId: number) {
  const { data } = await supabase
    .from("telegram_sessions")
    .select("*")
    .eq("chat_id", chatId)
    .single();

  if (data) return data;

  const { data: newSession } = await supabase
    .from("telegram_sessions")
    .insert({ chat_id: chatId, state: "idle", collected_inputs: {} })
    .select("*")
    .single();

  return newSession;
}

async function resetSession(supabase: ReturnType<typeof createClient>, chatId: number) {
  await supabase
    .from("telegram_sessions")
    .update({
      state: "idle",
      selected_skill_id: null,
      collected_inputs: {},
      current_input_index: 0,
      updated_at: new Date().toISOString(),
    })
    .eq("chat_id", chatId);
}

async function handleStart(chatId: number, firstName?: string) {
  const name = firstName || "there";
  await sendMessage(
    chatId,
    `👋 <b>Welcome${name ? `, ${escapeHtml(name)}` : ""}!</b>\n\n` +
      `I'm your <b>Apex AI Assistant</b>. I can run any skill or agent for you right here in Telegram.\n\n` +
      `<b>Commands:</b>\n` +
      `/skills — Browse available skills\n` +
      `/tasks — View your scheduled tasks\n` +
      `/cancel — Cancel current operation\n` +
      `/clear — Reset Alex conversation history\n` +
      `/help — Show this help message\n\n` +
      `💡 Just type any message to <b>chat with Alex</b>, your AI assistant!\n\n` +
      `Try <b>/skills</b> to get started!`
  );
}

async function handleHelp(chatId: number) {
  await sendMessage(
    chatId,
    `<b>🤖 Apex AI Bot Commands</b>\n\n` +
      `/start — Welcome message\n` +
      `/skills — List all available skills by department\n` +
      `/tasks — View your active scheduled tasks\n` +
      `/cancel — Cancel current skill input\n` +
      `/clear — Reset Alex conversation history\n` +
      `/help — Show this help\n\n` +
      `<b>How it works:</b>\n` +
      `1. Use /skills to browse capabilities\n` +
      `2. Tap a skill to select it\n` +
      `3. I'll ask for each input one at a time\n` +
      `4. Once complete, I'll run the agent and send you the result\n\n` +
      `📊 <b>Deck generation:</b> Skills with PowerPoint output automatically generate .pptx files and send you a download link.\n` +
      `📅 Use /tasks to see your automated scheduled tasks\n` +
      `💡 Or just <b>type any message</b> to chat with Alex, your AI assistant!`
  );
}

async function handleSkills(supabase: ReturnType<typeof createClient>, chatId: number) {
  const { data: skills, error } = await supabase
    .from("skills")
    .select("id, name, display_name, emoji, department, description")
    .order("department");

  if (error || !skills || skills.length === 0) {
    await sendMessage(chatId, "❌ No skills found. Please add skills in the Apex AI dashboard first.");
    return;
  }

  // Group by department
  const grouped: Record<string, typeof skills> = {};
  for (const skill of skills) {
    const dept = skill.department || "Other";
    if (!grouped[dept]) grouped[dept] = [];
    grouped[dept].push(skill);
  }

  // Build inline keyboard grouped by department
  const keyboard: Array<Array<{ text: string; callback_data: string }>> = [];
  let message = "<b>📋 Available Skills</b>\n\n";

  for (const [dept, deptSkills] of Object.entries(grouped)) {
    message += `<b>${escapeHtml(dept)}</b>\n`;
    for (const skill of deptSkills) {
      const displayName = skill.display_name || skill.name;
      const emoji = skill.emoji || "⚡";
      message += `${emoji} ${escapeHtml(displayName)}\n`;
      keyboard.push([
        {
          text: `${emoji} ${displayName}`,
          callback_data: `select_skill:${skill.id}`,
        },
      ]);
    }
    message += "\n";
  }

  message += "👇 <b>Tap a skill below to run it:</b>";

  await sendMessage(chatId, message, {
    reply_markup: { inline_keyboard: keyboard },
  });
}

async function handleSkillSelection(
  supabase: ReturnType<typeof createClient>,
  chatId: number,
  skillId: string
) {
  const { data: skill } = await supabase
    .from("skills")
    .select("*")
    .eq("id", skillId)
    .single();

  if (!skill) {
    await sendMessage(chatId, "❌ Skill not found. Try /skills to see available options.");
    return;
  }

  const inputs = (skill.inputs as SkillInput[]) || [];
  const requiredInputs = inputs.filter((i) => i.required !== false);

  if (requiredInputs.length === 0) {
    // No inputs needed, run immediately
    await sendMessage(chatId, `⚡ Running <b>${escapeHtml(skill.display_name || skill.name)}</b>...`);
    await executeSkill(supabase, chatId, skill, {});
    return;
  }

  // Store session state and ask for first input
  await supabase
    .from("telegram_sessions")
    .upsert(
      {
        chat_id: chatId,
        state: "collecting_inputs",
        selected_skill_id: skillId,
        collected_inputs: {},
        current_input_index: 0,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "chat_id" }
    );

  const firstInput = requiredInputs[0];
  await sendMessage(
    chatId,
    `🎯 <b>${escapeHtml(skill.display_name || skill.name)}</b>\n` +
      (skill.description ? `${escapeHtml(skill.description)}\n\n` : "\n") +
      `I need <b>${requiredInputs.length}</b> input(s). Let's go!\n\n` +
      `<b>1/${requiredInputs.length}: ${escapeHtml(firstInput.label)}</b>\n` +
      (firstInput.hint ? `💡 ${escapeHtml(firstInput.hint)}\n` : "") +
      (firstInput.placeholder ? `<i>Example: ${escapeHtml(firstInput.placeholder)}</i>` : "")
  );
}

async function handleInputCollection(
  supabase: ReturnType<typeof createClient>,
  chatId: number,
  text: string,
  session: Record<string, unknown>
) {
  const skillId = session.selected_skill_id as string;
  const { data: skill } = await supabase
    .from("skills")
    .select("*")
    .eq("id", skillId)
    .single();

  if (!skill) {
    await resetSession(supabase, chatId);
    await sendMessage(chatId, "❌ Skill not found. Session reset. Try /skills.");
    return;
  }

  const inputs = ((skill.inputs as SkillInput[]) || []).filter((i) => i.required !== false);
  const currentIndex = session.current_input_index as number;
  const collectedInputs = (session.collected_inputs as Record<string, string>) || {};

  // Store the current input
  const currentInput = inputs[currentIndex];
  collectedInputs[currentInput.field || currentInput.id || currentInput.label] = text;

  const nextIndex = currentIndex + 1;

  if (nextIndex >= inputs.length) {
    // All inputs collected — execute
    await supabase
      .from("telegram_sessions")
      .update({
        collected_inputs: collectedInputs,
        state: "idle",
        current_input_index: 0,
        selected_skill_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq("chat_id", chatId);

    await sendMessage(chatId, `⚡ All inputs collected! Running <b>${escapeHtml(skill.display_name || skill.name)}</b>...`);
    await executeSkill(supabase, chatId, skill, collectedInputs);
  } else {
    // Ask for next input
    await supabase
      .from("telegram_sessions")
      .update({
        collected_inputs: collectedInputs,
        current_input_index: nextIndex,
        updated_at: new Date().toISOString(),
      })
      .eq("chat_id", chatId);

    const nextInput = inputs[nextIndex];
    await sendMessage(
      chatId,
      `✅ Got it!\n\n` +
        `<b>${nextIndex + 1}/${inputs.length}: ${escapeHtml(nextInput.label)}</b>\n` +
        (nextInput.hint ? `💡 ${escapeHtml(nextInput.hint)}\n` : "") +
        (nextInput.placeholder ? `<i>Example: ${escapeHtml(nextInput.placeholder)}</i>` : "")
    );
  }
}

async function executeSkill(
  supabase: ReturnType<typeof createClient>,
  chatId: number,
  skill: Record<string, unknown>,
  inputs: Record<string, string>
) {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Route pptx skills to generate-deck endpoint
    if (skill.output_format === "pptx") {
      await sendMessage(chatId, `📊 Generating PowerPoint deck for <b>${escapeHtml((skill.display_name || skill.name) as string)}</b>... This may take a minute.`);

      const deckResponse = await fetch(`${supabaseUrl}/functions/v1/generate-deck`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          skillId: skill.id,
          skillName: skill.name,
          agentType: skill.agent_type,
          department: skill.department,
          title: `Telegram: ${skill.display_name || skill.name}`,
          inputs,
          promptTemplate: skill.prompt_template,
          systemPrompt: skill.system_prompt,
        }),
      });

      if (!deckResponse.ok) {
        const errText = await deckResponse.text();
        console.error("Deck generation error:", deckResponse.status, errText);
        await sendMessage(chatId, `❌ Deck generation failed (${deckResponse.status}). Please try again later.`);
        return;
      }

      const deckResult = await deckResponse.json();
      if (deckResult.fileUrl) {
        await sendMessage(
          chatId,
          `✅ <b>Deck generated!</b>\n\n` +
            `📥 <a href="${deckResult.fileUrl}">Download your PowerPoint deck</a>\n\n` +
            `Slides: ${deckResult.slideCount || "N/A"}`
        );
      } else {
        await sendMessage(chatId, `⚠️ Deck was generated but no download link was returned. Check the web app for results.`);
      }
      return;
    }

    // Standard agent dispatch (SSE streaming)
    const response = await fetch(`${supabaseUrl}/functions/v1/agent-dispatch`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        skillId: skill.id,
        skillName: skill.name,
        agentType: skill.agent_type,
        department: skill.department,
        title: `Telegram: ${skill.display_name || skill.name}`,
        inputs,
        promptTemplate: skill.prompt_template,
        systemPrompt: skill.system_prompt,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Agent dispatch error:", response.status, errText);
      await sendMessage(chatId, `❌ Agent execution failed (${response.status}). Please try again later.`);
      return;
    }

    // Read SSE stream and accumulate output
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let fullOutput = "";
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let newlineIdx: number;
      while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
        let line = buffer.slice(0, newlineIdx);
        buffer = buffer.slice(newlineIdx + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (!line.startsWith("data: ")) continue;
        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") continue;

        try {
          const parsed = JSON.parse(jsonStr);
          if (parsed.content) {
            fullOutput += parsed.content;
          }
        } catch {
          // partial JSON
        }
      }
    }

    if (!fullOutput.trim()) {
      await sendMessage(chatId, "⚠️ The agent completed but produced no output.");
      return;
    }

    // Convert basic markdown to HTML for Telegram
    const htmlOutput = markdownToTelegramHtml(fullOutput);
    await sendMessage(chatId, `✅ <b>Result:</b>\n\n${htmlOutput}`);
  } catch (err) {
    console.error("Execute skill error:", err);
    await sendMessage(chatId, `❌ An error occurred: ${err instanceof Error ? escapeHtml(err.message) : "Unknown error"}`);
  }
}

function markdownToTelegramHtml(md: string): string {
  let html = md;
  // Bold: **text** or __text__
  html = html.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
  html = html.replace(/__(.+?)__/g, "<b>$1</b>");
  // Italic: *text* or _text_
  html = html.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, "<i>$1</i>");
  // Code blocks: ```text```
  html = html.replace(/```[\w]*\n?([\s\S]*?)```/g, "<pre>$1</pre>");
  // Inline code: `text`
  html = html.replace(/`(.+?)`/g, "<code>$1</code>");
  // Headers: # text → bold
  html = html.replace(/^#{1,6}\s+(.+)$/gm, "<b>$1</b>");
  // Escape remaining HTML entities in non-tagged content
  return html;
}

async function setWebhook(supabaseUrl: string) {
  const token = getBotToken();
  const webhookUrl = `${supabaseUrl}/functions/v1/telegram-bot`;
  const res = await fetch(`${TELEGRAM_API}${token}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: webhookUrl }),
  });
  return await res.json();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabase = getSupabase();

  // GET request = webhook setup
  if (req.method === "GET") {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");
    if (action === "set-webhook") {
      try {
        const result = await setWebhook(supabaseUrl);
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Failed" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }
    return new Response(JSON.stringify({ status: "Telegram bot webhook is active" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // POST = Telegram webhook update
  try {
    const update: TelegramUpdate = await req.json();

    // Handle callback queries (inline keyboard taps)
    if (update.callback_query) {
      const cb = update.callback_query;
      const chatId = cb.message?.chat.id;
      if (!chatId) return new Response("ok");

      await answerCallback(cb.id);

      if (cb.data?.startsWith("select_skill:")) {
        const skillId = cb.data.split(":")[1];
        await handleSkillSelection(supabase, chatId, skillId);
      }
      return new Response("ok");
    }

    const message = update.message;
    if (!message?.text) return new Response("ok");

    const chatId = message.chat.id;
    const text = message.text.trim();
    const firstName = message.from?.first_name;

    // Command handling
    if (text === "/start") {
      await resetSession(supabase, chatId);
      await handleStart(chatId, firstName);
      return new Response("ok");
    }

    if (text === "/help") {
      await handleHelp(chatId);
      return new Response("ok");
    }

    if (text === "/skills") {
      await resetSession(supabase, chatId);
      await handleSkills(supabase, chatId);
      return new Response("ok");
    }

    if (text === "/cancel") {
      await resetSession(supabase, chatId);
      await sendMessage(chatId, "🚫 Operation cancelled. Send /skills to start again.");
      return new Response("ok");
    }

    if (text === "/clear") {
      await supabase
        .from("telegram_sessions")
        .update({ conversation_history: [], updated_at: new Date().toISOString() })
        .eq("chat_id", chatId);
      await sendMessage(chatId, "🧹 Conversation history cleared. Start fresh!");
      return new Response("ok");
    }

    if (text === "/tasks") {
      const { data: tasks } = await supabase
        .from("scheduled_tasks")
        .select("*")
        .eq("status", "active")
        .order("next_run_at", { ascending: true })
        .limit(10);

      if (!tasks || tasks.length === 0) {
        await sendMessage(chatId, "📅 <b>Scheduled Tasks</b>\n\nNo active scheduled tasks. Create them in the Apex AI web app under Tasks.");
      } else {
        let msg = "📅 <b>Scheduled Tasks</b>\n\n";
        for (const task of tasks) {
          const nextRun = task.next_run_at ? new Date(task.next_run_at).toUTCString() : "—";
          msg += `• <b>${escapeHtml(task.title)}</b>\n`;
          msg += `  ${escapeHtml(task.skill_name)} · ${escapeHtml(task.schedule_type)} · Runs: ${task.run_count}\n`;
          msg += `  Next: ${nextRun}\n\n`;
        }
        msg += "Manage tasks in the Apex AI web app.";
        await sendMessage(chatId, msg);
      }
      return new Response("ok");
    }

    if (text.startsWith("/run ")) {
      const skillName = text.slice(5).trim();
      const { data: skill } = await supabase
        .from("skills")
        .select("id")
        .or(`name.ilike.%${skillName}%,display_name.ilike.%${skillName}%`)
        .limit(1)
        .single();

      if (skill) {
        await handleSkillSelection(supabase, chatId, skill.id);
      } else {
        await sendMessage(chatId, `❌ Skill "<b>${escapeHtml(skillName)}</b>" not found. Try /skills to see available options.`);
      }
      return new Response("ok");
    }

    // Check if we're collecting inputs
    const session = await getOrCreateSession(supabase, chatId);
    if (session && session.state === "collecting_inputs") {
      await handleInputCollection(supabase, chatId, text, session);
      return new Response("ok");
    }

    // Route free-text messages to Alex
    try {
      const session = await getOrCreateSession(supabase, chatId);
      const history = (session?.conversation_history as Array<{role: string; content: string}>) || [];

      // Add user message to history
      history.push({ role: "user", content: text });

      // Cap at last 20 messages
      const cappedHistory = history.slice(-20);

      // Call alex-chat edge function
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

      const alexResponse = await fetch(`${supabaseUrl}/functions/v1/alex-chat`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: cappedHistory }),
      });

      if (!alexResponse.ok) {
        await sendMessage(chatId, "⚠️ Alex is temporarily unavailable. Try /skills to run a skill instead.");
        return new Response("ok");
      }

      // Read SSE stream and accumulate Alex's response
      const alexReader = alexResponse.body!.getReader();
      const alexDecoder = new TextDecoder();
      let alexOutput = "";
      let alexBuffer = "";

      while (true) {
        const { done, value } = await alexReader.read();
        if (done) break;
        alexBuffer += alexDecoder.decode(value, { stream: true });

        let newlineIdx: number;
        while ((newlineIdx = alexBuffer.indexOf("\n")) !== -1) {
          let line = alexBuffer.slice(0, newlineIdx);
          alexBuffer = alexBuffer.slice(newlineIdx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") continue;

          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.content) alexOutput += parsed.content;
          } catch {
            // partial JSON
          }
        }
      }

      if (!alexOutput.trim()) {
        await sendMessage(chatId, "🤔 I couldn't generate a response. Try again or use /skills.");
        return new Response("ok");
      }

      // Save conversation history
      cappedHistory.push({ role: "assistant", content: alexOutput });
      await supabase
        .from("telegram_sessions")
        .update({
          conversation_history: cappedHistory.slice(-20),
          updated_at: new Date().toISOString(),
        })
        .eq("chat_id", chatId);

      // Send response
      const htmlOutput = markdownToTelegramHtml(alexOutput);
      await sendMessage(chatId, htmlOutput);
    } catch (alexErr) {
      console.error("Alex chat error:", alexErr);
      await sendMessage(chatId, "⚠️ Something went wrong. Try /skills or /help.");
    }

    return new Response("ok");
  } catch (e) {
    console.error("Telegram webhook error:", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
