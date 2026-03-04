

# Dynamic Tenant Domain Mapping + Invite User Function

## Summary

Three changes: (1) Replace the hardcoded `@solutionment.com` check in `auth-azure-callback` with a database-driven tenant lookup, (2) auto-provision `user_profiles` in the callback (first user for a tenant gets `admin` role), (3) create a new `invite-user` edge function.

## Changes

### 1. Update `supabase/functions/auth-azure-callback/index.ts`

**Remove** lines 127-133 (the hardcoded domain check).

**Replace with** (after email extraction, before user creation):

```typescript
// Dynamic tenant lookup
const domain = email.toLowerCase().split('@')[1];
const { data: tenant, error: tenantError } = await supabase
  .from('tenants')
  .select('id, name, status')
  .contains('allowed_domains', [domain])
  .single();

if (!tenant || tenantError) {
  return redirect(`${redirectTo}?error=Your organization is not registered...`);
}
if (tenant.status === 'suspended') {
  return redirect(`${redirectTo}?error=Your organization's access has been suspended...`);
}
```

Note: The supabase client is created with service_role key, so it bypasses RLS — this query will work.

**Move** the supabase client creation (lines 137-139) to **before** the tenant lookup, since we need it for the query.

**After** user creation/lookup (around line 164), add profile upsert:

```typescript
const authUser = existingUser || (await supabase.auth.admin.listUsers()).data.users
  .find(u => u.email?.toLowerCase() === email.toLowerCase());

// Check if profile exists
const { data: existingProfile } = await supabase
  .from('user_profiles').select('id').eq('id', authUser.id).maybeSingle();

let role = 'member';
if (!existingProfile) {
  const { count } = await supabase
    .from('user_profiles').select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenant.id);
  if (count === 0) role = 'admin';
}

await supabase.from('user_profiles').upsert({
  id: authUser.id, tenant_id: tenant.id,
  full_name: fullName || null, email, role,
}, { onConflict: 'id', ignoreDuplicates: false });
```

### 2. Create `supabase/functions/invite-user/index.ts`

New edge function that:
- Validates caller's JWT via `getClaims()`
- Looks up caller's profile to verify admin/super_admin role
- Accepts `{ email }` in request body
- Extracts domain, checks if it's in tenant's `allowed_domains` — if not, appends it
- Calls `supabase.auth.admin.inviteUserByEmail(email, { redirectTo })`
- Returns `{ success: true, message: 'Invitation sent' }`

### 3. Update `supabase/config.toml`

Add:
```toml
[functions.invite-user]
verify_jwt = false
```
(Set to `false` because we validate JWT manually in code via `getClaims()`, per the project's signing-keys pattern.)

### 4. No changes needed to `auth-azure-login`

Already generic — no domain restrictions there.

## Files affected

| File | Action |
|---|---|
| `supabase/functions/auth-azure-callback/index.ts` | Edit: replace hardcoded domain check with tenant lookup + profile upsert |
| `supabase/functions/invite-user/index.ts` | Create new edge function |
| `supabase/config.toml` | Add invite-user config |

