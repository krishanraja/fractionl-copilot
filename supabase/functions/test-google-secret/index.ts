// Simple test function to check Google OAuth secret without any auth
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const rawCredentials = Deno.env.get('GOOGLE_OAUTH_CREDENTIALS');
  const hasSecret = !!rawCredentials;
  const secretLength = rawCredentials?.length || 0;
  
  let isValidJson = false;
  let parseError = null;
  let credentialStructure = null;
  
  if (hasSecret) {
    try { 
      const parsed = JSON.parse(rawCredentials!); 
      isValidJson = true;
      credentialStructure = {
        hasWeb: !!parsed.web,
        hasClientId: !!parsed.web?.client_id,
        hasClientSecret: !!parsed.web?.client_secret,
        hasAuthUri: !!parsed.web?.auth_uri,
        hasTokenUri: !!parsed.web?.token_uri,
        hasRedirectUris: !!parsed.web?.redirect_uris?.length
      };
    } catch (e) { 
      parseError = e.message;
    }
  }
  
  return new Response(
    JSON.stringify({ 
      hasSecret, 
      secretLength, 
      isValidJson,
      parseError,
      credentialStructure,
      timestamp: new Date().toISOString(),
      message: 'Direct secret test - no authentication required'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});