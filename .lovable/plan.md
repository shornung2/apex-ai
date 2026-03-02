

# Plan: Add Microsoft Entra ID Authentication + RLS Security

## Overview

Replicate the proven Azure AD auth pattern from your SolutionIQ Apex project, adapted for this app. This uses two edge functions for the OAuth flow and a frontend login page, with domain restriction to `@solutionment.com`.

## Prerequisites

You will need to provide three secrets:
- **AZURE_CLIENT_ID** -- from your Azure App Registration
- **AZURE_CLIENT_SECRET** -- from your Azure App Registration
- **AZURE_TENANT_ID** -- your Entra ID tenant

The Azure App Registration needs a redirect URI set to:
`https://kelmihvxukrymegjmxoz.supabase.co/functions/v1/auth-azure-callback`

## 1. Create Edge Functions

### `auth-azure-login/index.ts`
- Reads `AZURE_CLIENT_ID` and `AZURE_TENANT_ID` from secrets
- Accepts a `redirect_to` query param (defaults to app origin + `/auth`)
- Generates a CSRF state token with nonce + redirect URL
- Redirects the browser to `https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/authorize`

### `auth-azure-callback/index.ts`
- Receives the authorization code from Azure
- Exchanges code for tokens via `POST /oauth2/v2.0/token`
- Decodes the JWT id_token to extract email and name
- Validates email ends with `@solutionment.com`
- Uses Supabase Admin API to find or create the user
- Generates a magic link token and redirects back to `/auth?token=...&type=...`

Both functions are adapted from your existing SolutionIQ Apex implementation with the project-specific URLs updated.

## 2. Create Auth Page (`src/pages/Auth.tsx`)

- On mount: checks for `?token=` and `?type=` in URL and calls `supabase.auth.verifyOtp()` to establish a session
- Shows error toasts from `?error=` query params
- Checks if user already has a session and redirects to `/`
- Renders a centered card with the Apex AI logo and a "Sign in with Microsoft" button
- Button calls the `auth-azure-login` edge function URL
- Handles iframe detection (Lovable preview) by trying `window.top.location.href` first
- Shows "@solutionment.com only" notice

## 3. Create Auth Guard (`src/components/AuthGuard.tsx`)

- Wraps protected routes
- Uses `supabase.auth.onAuthStateChange` and `getSession` to track auth state
- If no session, redirects to `/auth`
- Shows a loading spinner while checking session
- Renders children when authenticated

## 4. Update App Router (`src/App.tsx`)

- Add `/auth` route (outside AppLayout, no sidebar)
- Wrap all other routes inside `<AuthGuard>` so unauthenticated users are redirected

```text
Routes:
  /auth          --> Auth page (public, no layout)
  /              --> AuthGuard -> AppLayout -> Dashboard
  /capabilities  --> AuthGuard -> AppLayout -> Capabilities
  ... (all existing routes)
```

## 5. Add Sign-Out to Sidebar (`src/components/AppSidebar.tsx`)

- Add a "Sign Out" button at the bottom of the sidebar
- Calls `supabase.auth.signOut()` and navigates to `/auth`

## 6. Tighten RLS Policies (Database Migration)

Replace the current wide-open `true` RLS policies on all 7 tables with authenticated-only access:

```sql
-- For each table: agent_jobs, content_folders, content_items,
-- knowledge_chunks, knowledge_documents, scheduled_tasks,
-- skills, telegram_sessions

DROP POLICY "Allow all access to <table>" ON public.<table>;

CREATE POLICY "Authenticated users can do everything"
ON public.<table>
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
```

This ensures only logged-in users (with a valid session) can read or write data. The `anon` key alone will no longer grant access.

## 7. Deploy and Configure

- Deploy both edge functions
- Prompt for AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, AZURE_TENANT_ID secrets

## Files Summary

| Action | File |
|--------|------|
| Create | `supabase/functions/auth-azure-login/index.ts` |
| Create | `supabase/functions/auth-azure-callback/index.ts` |
| Create | `src/pages/Auth.tsx` |
| Create | `src/components/AuthGuard.tsx` |
| Modify | `src/App.tsx` -- add auth route + guard |
| Modify | `src/components/AppSidebar.tsx` -- add sign-out |
| Migration | Drop open RLS, add authenticated-only policies on all tables |

