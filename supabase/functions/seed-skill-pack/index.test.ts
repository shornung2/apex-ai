import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/seed-skill-pack`;

Deno.test("rejects unauthenticated requests", async () => {
  const res = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ packSlugs: ["presales-excellence"] }),
  });
  const body = await res.text();
  assertEquals(res.status, 401);
  console.log("Unauthenticated rejection:", body);
});

Deno.test("rejects requests without packSlugs", async () => {
  const res = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({}),
  });
  const body = await res.text();
  // Should be 401 (anon key isn't a real user) or 400
  console.log("Missing packSlugs:", res.status, body);
  assertEquals(res.status >= 400, true);
});

Deno.test("rejects anon key (no valid user session)", async () => {
  const res = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ packSlugs: ["presales-excellence"] }),
  });
  const body = await res.text();
  console.log("Anon key rejection:", res.status, body);
  assertEquals(res.status >= 400, true);
});
