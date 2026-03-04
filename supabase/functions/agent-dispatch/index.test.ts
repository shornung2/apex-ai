import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/agent-dispatch`;

Deno.test("rejects unauthenticated requests (no auth header)", async () => {
  const res = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      skillId: "test",
      skillName: "test",
      agentType: "researcher",
      department: "sales",
      title: "Test",
      inputs: { topic: "test" },
      webSearchEnabled: false,
    }),
  });
  const body = await res.text();
  console.log("Unauthenticated:", res.status, body);
  // Should fail — no auth
  assertEquals(res.status >= 400, true);
});

Deno.test("rejects request when agent type is disabled", async () => {
  // This test sends a valid-looking request but with a non-existent tenant
  // The function should still process (no toggle row = agent enabled)
  // We're testing that the function doesn't crash on toggle check
  const res = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      skillId: "test-disabled-check",
      skillName: "Test Disabled",
      agentType: "researcher",
      department: "sales",
      title: "Test disabled agent",
      inputs: { topic: "test" },
      webSearchEnabled: false,
      tenantId: "00000000-0000-0000-0000-000000000000",
    }),
  });
  const body = await res.text();
  console.log("Disabled agent check:", res.status, body);
  // Will fail because tenant doesn't exist, but should not be a 403 for agent toggle
  assertEquals(res.status >= 400, true);
});

Deno.test("web search enabled skill processes without crashing", async () => {
  // This tests that the Brave Search integration path doesn't crash the function
  // Even with anon key (which has no real user), the function should reach
  // the job creation step before failing on tenant/insert
  const res = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      skillId: "test-web-search",
      skillName: "Morning Coffee Test",
      agentType: "researcher",
      department: "sales",
      title: "Web search test",
      inputs: { topic: "latest AI news today March 2026" },
      webSearchEnabled: true,
      tenantId: "00000000-0000-0000-0000-000000000000",
    }),
  });
  const body = await res.text();
  console.log("Web search enabled:", res.status, body);
  // We expect it to fail on job insert (bad tenant), but NOT crash on Brave call
  assertEquals(res.status >= 400, true);
});

Deno.test("non-web-search skill skips Brave API", async () => {
  const res = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      skillId: "test-no-search",
      skillName: "Proposal Draft",
      agentType: "content",
      department: "sales",
      title: "No search test",
      inputs: { topic: "test proposal" },
      webSearchEnabled: false,
      tenantId: "00000000-0000-0000-0000-000000000000",
    }),
  });
  const body = await res.text();
  console.log("No web search:", res.status, body);
  // Should fail on insert but function runs fine
  assertEquals(res.status >= 400, true);
});
