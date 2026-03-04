

## Plan: Integrate Brave Search API + Create Tests

### What We're Doing
Replace the static `WEB_SEARCH_CAVEAT` with live web search results from the **Brave Search API** for skills with `web_search_enabled: true`. Then create tests to verify affected skills work correctly.

### Step 1: Store the Brave Search API Key
Use `add_secret` to request the `BRAVE_SEARCH_API_KEY` from you.

### Step 2: Modify `agent-dispatch/index.ts`
Between building `filledTemplate` (line ~308) and constructing `finalSystemPrompt` (line ~323):

1. If `webSearchEnabled === true`, check for `BRAVE_SEARCH_API_KEY` in env
2. If present, call Brave Web Search API (`https://api.search.brave.com/res/v1/web/search`) with the filled prompt as query (truncated to ~400 chars), requesting fresh results (`freshness=pw` for past week)
3. Extract titles, descriptions, URLs from results and format as a `## LIVE WEB SEARCH RESULTS` section
4. Inject into system prompt **instead of** the `WEB_SEARCH_CAVEAT`
5. If `BRAVE_SEARCH_API_KEY` is missing, fall back to existing caveat (graceful degradation)

Key code change (pseudocode):
```typescript
let webSearchSection = "";
if (webSearchEnabled) {
  const braveKey = Deno.env.get("BRAVE_SEARCH_API_KEY");
  if (braveKey) {
    const searchQuery = filledTemplate.slice(0, 400);
    const searchRes = await fetch(
      `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(searchQuery)}&count=10&freshness=pw`,
      { headers: { "Accept": "application/json", "X-Subscription-Token": braveKey } }
    );
    const searchData = await searchRes.json();
    const results = searchData.web?.results || [];
    if (results.length > 0) {
      webSearchSection = "\n\n## LIVE WEB SEARCH RESULTS\n" +
        results.map((r, i) => `[${i+1}] **${r.title}**\n${r.description}\nSource: ${r.url}`).join("\n\n");
    }
  }
  if (!webSearchSection) {
    webSearchSection = WEB_SEARCH_CAVEAT; // fallback
  }
}
```

Then replace line 319 (`const webSearchSuffix = ...`) to use `webSearchSection` instead.

### Step 3: Create Tests (`supabase/functions/agent-dispatch/index.test.ts`)
Deno tests calling the deployed function via HTTP:
1. **Rejects unauthenticated requests** - no auth header returns error
2. **Rejects disabled agent** - agent toggled off returns 403
3. **Web search skill includes live results** - `webSearchEnabled: true` produces output with current data
4. **Non-web-search skill skips search** - `webSearchEnabled: false` works normally
5. **Graceful fallback** - if Brave key missing, skill still runs with caveat

### Step 4: Update Help Documentation (`src/pages/Help.tsx`)
Update the web search documentation to reflect that web-search-enabled skills now fetch live results via Brave Search when configured.

### Affected Skills
All skills with `web_search_enabled: true`: Morning Coffee, Competitive Battle Card, Company Intelligence Brief, Win/Loss Analysis, SEO Blog Brief, LinkedIn Post Series, and any others flagged in the database.

### Files Changed
- `supabase/functions/agent-dispatch/index.ts` - add Brave Search integration
- `supabase/functions/agent-dispatch/index.test.ts` - new test file
- `src/pages/Help.tsx` - update documentation

