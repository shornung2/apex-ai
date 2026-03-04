import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AzureTokenResponse {
  access_token: string;
  id_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  refresh_token?: string;
}

interface DecodedIdToken {
  email?: string;
  preferred_username?: string;
  name?: string;
  oid?: string;
  sub?: string;
}

function decodeJwtPayload(token: string): DecodedIdToken {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid JWT format');
  const payload = parts[1];
  const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
  return JSON.parse(decoded);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const fallbackRedirect = 'https://id-preview--0f99bcb2-aeeb-4e66-a8ae-2dc4c3207123.lovable.app/auth';

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');
    const errorDescription = url.searchParams.get('error_description');

    let redirectTo = fallbackRedirect;

    if (state) {
      try {
        const stateData = JSON.parse(atob(state));
        if (stateData.redirectTo) redirectTo = stateData.redirectTo;
      } catch (e) {
        console.error('Failed to parse state:', e);
      }
    }

    if (error) {
      console.error('Azure OAuth error:', error, errorDescription);
      return new Response(null, {
        status: 302,
        headers: { 'Location': `${redirectTo}?error=${encodeURIComponent(errorDescription || error)}` },
      });
    }

    if (!code) {
      return new Response(null, {
        status: 302,
        headers: { 'Location': `${redirectTo}?error=No authorization code received` },
      });
    }

    const clientId = Deno.env.get('AZURE_CLIENT_ID');
    const clientSecret = Deno.env.get('AZURE_CLIENT_SECRET');
    const tenantId = Deno.env.get('AZURE_TENANT_ID');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!clientId || !clientSecret || !tenantId || !supabaseUrl || !supabaseServiceKey) {
      return new Response(null, {
        status: 302,
        headers: { 'Location': `${redirectTo}?error=Server configuration error` },
      });
    }

    const callbackUrl = `${supabaseUrl}/functions/v1/auth-azure-callback`;

    // Exchange code for tokens
    const tokenResponse = await fetch(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          redirect_uri: callbackUrl,
          grant_type: 'authorization_code',
          scope: 'openid profile email',
        }),
      }
    );

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', errorText);
      return new Response(null, {
        status: 302,
        headers: { 'Location': `${redirectTo}?error=Token exchange failed` },
      });
    }

    const tokens: AzureTokenResponse = await tokenResponse.json();
    const userInfo = decodeJwtPayload(tokens.id_token);
    const email = userInfo.email || userInfo.preferred_username;
    const fullName = userInfo.name;

    if (!email) {
      return new Response(null, {
        status: 302,
        headers: { 'Location': `${redirectTo}?error=No email found in Azure response` },
      });
    }

    console.log('User email extracted:', email);

    // Create Supabase admin client (service role bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Dynamic tenant lookup by email domain
    const domain = email.toLowerCase().split('@')[1];
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id, name, status')
      .contains('allowed_domains', [domain])
      .single();

    if (!tenant || tenantError) {
      console.error('Tenant lookup failed for domain:', domain, tenantError);
      return new Response(null, {
        status: 302,
        headers: { 'Location': `${redirectTo}?error=${encodeURIComponent('Your organization is not registered on Apex AI. Please contact Solutionment at hello@solutionment.com to get set up.')}` },
      });
    }

    if (tenant.status === 'suspended') {
      return new Response(null, {
        status: 302,
        headers: { 'Location': `${redirectTo}?error=${encodeURIComponent("Your organization's Apex AI access has been suspended. Please contact Solutionment.")}` },
      });
    }

    console.log('Tenant matched:', tenant.name, tenant.id);

    // Check if user exists in Supabase Auth
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      return new Response(null, {
        status: 302,
        headers: { 'Location': `${redirectTo}?error=Database error` },
      });
    }

    let authUser = existingUsers.users.find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (!authUser) {
      const { data: createData, error: createError } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { full_name: fullName, provider: 'azure' },
      });
      if (createError) {
        return new Response(null, {
          status: 302,
          headers: { 'Location': `${redirectTo}?error=Failed to create user account` },
        });
      }
      authUser = createData.user;
    }

    // Auto-provision user_profiles row
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('id, status')
      .eq('id', authUser.id)
      .maybeSingle();

    // Block removed users
    if (existingProfile && (existingProfile as any).status === 'removed') {
      return new Response(null, {
        status: 302,
        headers: { 'Location': `${redirectTo}?error=${encodeURIComponent('Your access to Apex AI has been revoked. Please contact your organization administrator.')}` },
      });
    }

    let role = 'member';
    if (!existingProfile) {
      // First user for this tenant gets admin role
      const { count } = await supabase
        .from('user_profiles')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenant.id);
      if (count === 0) role = 'admin';
    }

    await supabase.from('user_profiles').upsert({
      id: authUser.id,
      tenant_id: tenant.id,
      full_name: fullName || null,
      email: email,
      role: existingProfile ? undefined : role,
    }, { onConflict: 'id', ignoreDuplicates: false });

    console.log('User profile upserted, role:', existingProfile ? '(unchanged)' : role);

    // Generate magic link token
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email,
    });

    if (linkError || !linkData) {
      return new Response(null, {
        status: 302,
        headers: { 'Location': `${redirectTo}?error=Failed to generate session` },
      });
    }

    const magicLinkUrl = new URL(linkData.properties.action_link);
    const token = magicLinkUrl.searchParams.get('token');
    const type = magicLinkUrl.searchParams.get('type');

    if (!token) {
      return new Response(null, {
        status: 302,
        headers: { 'Location': `${redirectTo}?error=Failed to generate authentication token` },
      });
    }

    const finalRedirect = `${redirectTo}?token=${encodeURIComponent(token)}&type=${type}`;
    console.log('Redirecting to app with token');

    return new Response(null, {
      status: 302,
      headers: { 'Location': finalRedirect },
    });
  } catch (error: unknown) {
    console.error('Error in auth-azure-callback:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(null, {
      status: 302,
      headers: { 'Location': `${fallbackRedirect}?error=${encodeURIComponent(errorMessage)}` },
    });
  }
});
