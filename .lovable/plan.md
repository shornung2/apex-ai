

# App Icons, Light/Dark Theme Toggle, and Live Token Usage

## Overview

Three changes:
1. Add the Autopilot logo icons to the app (sidebar, favicon, browser tab title)
2. Implement light/dark/system theme switching using `next-themes` (already installed)
3. Replace hardcoded token usage in the sidebar with real data from the database

---

## 1. Add Logo Icons

**Copy assets into the project:**
- `image-3.jpg` (transparent background) -> `src/assets/logo-dark.jpg` -- used when dark mode is active
- `image-1.jpg` (light background with rounded corners) -> `src/assets/logo-light.jpg` -- used when light mode is active  
- `image.jpg` (silver/white background) -> `public/favicon.jpg` -- used as the browser favicon (works on both light and dark browser chrome)

**Update `index.html`:**
- Change `<title>` from "Lovable App" to "Autopilot"
- Update og:title to "Autopilot - AI Operating System"
- Add favicon link: `<link rel="icon" type="image/jpeg" href="/favicon.jpg" />`

**Update `AppSidebar.tsx` header:**
- Replace the `<Zap>` icon div with an `<img>` tag that imports the logo
- Use `next-themes`'s `useTheme()` to conditionally show `logo-dark` (transparent) on dark backgrounds or `logo-light` on light backgrounds
- Size: 32x32px with `rounded-lg` to match current styling

---

## 2. Light/Dark/System Theme Toggle

**Add light mode CSS variables to `src/index.css`:**
- Currently only dark theme variables exist under `:root`
- Move existing dark values into a `.dark` selector
- Add light theme values under `:root` (standard shadcn light palette -- white backgrounds, dark text, adjusted sidebar colors)
- Update scrollbar styles to respect theme

**Update `src/App.tsx`:**
- Wrap the app with `<ThemeProvider>` from `next-themes` with `attribute="class"`, `defaultTheme="dark"`, `storageKey="autopilot-theme"`

**Add theme toggle to Settings page (`src/pages/Settings.tsx`):**
- Add a new "Appearance" tab with a `Palette` icon
- Inside: three radio-style cards for Light / Dark / System
- Each card shows a small preview swatch and label
- Uses `useTheme()` from `next-themes` to read/set the theme
- Active card gets a highlighted border

**Update `AppSidebar.tsx`:**
- The sidebar logo switches between `logo-dark.jpg` and `logo-light.jpg` based on `resolvedTheme`

---

## 3. Live Token Usage from Database

**Update `AppSidebar.tsx`:**
- Replace the hardcoded `dashboardMetrics.tokensUsed` / `dashboardMetrics.tokenBudget` with a live query
- Use `supabase.from("agent_jobs").select("tokens_used")` and sum client-side, or use an RPC
- For simplicity: fetch on mount with `useEffect` + `useState`, sum `tokens_used` from all `agent_jobs` rows
- Keep the `tokenBudget` as a constant (50,000) since there's no billing system yet
- Show a loading skeleton while fetching
- The current real total is 1,219 tokens from 1 job run

---

## Files Changed

| File | Change |
|------|--------|
| `src/assets/logo-dark.jpg` | New -- copied from uploaded transparent logo |
| `src/assets/logo-light.jpg` | New -- copied from uploaded light-bg logo |
| `public/favicon.jpg` | New -- copied from uploaded silver-bg logo |
| `index.html` | Title, og:title, favicon link |
| `src/index.css` | Add light theme variables, move dark to `.dark` |
| `src/App.tsx` | Wrap with ThemeProvider |
| `src/components/AppSidebar.tsx` | Logo image, live token query |
| `src/pages/Settings.tsx` | Add Appearance tab with theme toggle |

