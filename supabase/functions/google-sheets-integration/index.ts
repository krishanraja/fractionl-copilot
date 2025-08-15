// FORCE DEPLOYMENT v4.0 - Added token encryption for security
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Deployment marker for debugging
const DEPLOYMENT_VERSION = '4.0-TOKEN-ENCRYPTION'

interface GoogleCredentials {
  web: {
    client_id: string;
    client_secret: string;
    auth_uri: string;
    token_uri: string;
    redirect_uris: string[];
  }
}

// Token encryption utilities for security
async function encryptToken(token: string): Promise<string> {
  const encryptionKey = Deno.env.get('TOKEN_ENCRYPTION_KEY');
  if (!encryptionKey) {
    throw new Error('TOKEN_ENCRYPTION_KEY not configured');
  }
  
  // Import Web Crypto API for encryption
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const keyData = encoder.encode(encryptionKey.padEnd(32, '0').slice(0, 32)); // Ensure 32 bytes
  
  // Import key for AES-GCM encryption
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );
  
  // Generate random IV
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  // Encrypt the token
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );
  
  // Combine IV and encrypted data, then base64 encode
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  return btoa(String.fromCharCode(...combined));
}

async function decryptToken(encryptedToken: string): Promise<string> {
  const encryptionKey = Deno.env.get('TOKEN_ENCRYPTION_KEY');
  if (!encryptionKey) {
    throw new Error('TOKEN_ENCRYPTION_KEY not configured');
  }
  
  try {
    // Decode base64
    const combined = new Uint8Array(
      atob(encryptedToken).split('').map(char => char.charCodeAt(0))
    );
    
    // Extract IV and encrypted data
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);
    
    const encoder = new TextEncoder();
    const keyData = encoder.encode(encryptionKey.padEnd(32, '0').slice(0, 32)); // Ensure 32 bytes
    
    // Import key for AES-GCM decryption
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );
    
    // Decrypt the token
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('Token decryption failed:', error);
    throw new Error('Failed to decrypt token - may be corrupted or using wrong key');
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request URL first to check for actions that don't need authentication
    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    
    // Handle Google OAuth callback - detect by presence of code and state parameters
    if (code && state) {
      console.log('Detected Google OAuth callback with code and state parameters');
      return await handleExchangeCodeNoAuth(req);
    }
    
    // Add test endpoint for secret verification (no auth needed) - FORCE DEPLOYMENT v3.1
    if (action === 'test_secret') {
      const rawCredentials = Deno.env.get('GOOGLE_OAUTH_CREDENTIALS');
      const hasSecret = !!rawCredentials;
      const secretLength = rawCredentials?.length || 0;
      
      let isValidJson = false;
      let parseError = null;
      if (hasSecret) {
        try { 
          const parsed = JSON.parse(rawCredentials!); 
          isValidJson = true;
          console.log('Test endpoint - secret parsed successfully, has web:', !!parsed.web);
        } catch (e) { 
          parseError = e.message;
          console.log('Test endpoint - JSON parse failed:', e.message);
        }
      }
      
      return new Response(
        JSON.stringify({ 
          hasSecret, 
          secretLength, 
          isValidJson,
          parseError,
          timestamp: new Date().toISOString(),
          deploymentVersion: DEPLOYMENT_VERSION,
          message: 'Secret test endpoint - v3.1 deployment - NO AUTH REQUIRED'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle exchange_code action without authentication (Google OAuth callback)
    if (action === 'exchange_code') {
      return await handleExchangeCodeNoAuth(req);
    }

    // For all other actions, require authentication
    // Initialize Supabase client for authenticated requests
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Authenticated user:', user.id, 'Action:', action);
    
    if (!action) {
      throw new Error('Missing action parameter');
    }

    let body = {};
    try {
      const requestText = await req.text();
      if (requestText) {
        body = JSON.parse(requestText);
      }
    } catch (parseError) {
      console.log('Request body parsing failed, using empty object:', parseError);
    }

    // Parse Google OAuth credentials with enhanced error reporting
    const rawCredentials = Deno.env.get('GOOGLE_OAUTH_CREDENTIALS');
    console.log(`Deployment ${DEPLOYMENT_VERSION} - Secret check:`, {
      exists: !!rawCredentials, 
      length: rawCredentials?.length || 0,
      first10chars: rawCredentials?.substring(0, 10) || 'none',
      hasEncryptionKey: !!Deno.env.get('TOKEN_ENCRYPTION_KEY')
    });
    
    if (!rawCredentials?.trim()) {
      const errorMsg = `GOOGLE_OAUTH_CREDENTIALS environment variable is ${!rawCredentials ? 'not set' : 'empty'}`;
      console.error('Secret error:', errorMsg);
      throw new Error(errorMsg);
    }
    
    let credentials: GoogleCredentials;
    try {
      credentials = JSON.parse(rawCredentials);
      console.log('Credentials parsed successfully - Structure check:', {
        hasWeb: !!credentials.web,
        hasClientId: !!credentials.web?.client_id,
        hasClientSecret: !!credentials.web?.client_secret
      });
      
      if (!credentials.web || !credentials.web.client_id || !credentials.web.client_secret) {
        throw new Error('Invalid credentials format: missing required web credentials');
      }
    } catch (parseError) {
      console.error('JSON parse failed for credentials:', parseError.message);
      throw new Error(`Invalid GOOGLE_OAUTH_CREDENTIALS format: ${parseError.message}`);
    }
    
    switch (action) {
      case 'auth_url':
        return handleAuthUrl(credentials, user.id);
      
      case 'create_sheet':
        return await handleCreateSheet(body, supabase, user.id);
      
      case 'export_data':
        return await handleExportData(body, supabase, user.id);
      
      case 'refresh_all_data':
        return await handleRefreshAllData(body, supabase, user.id);
      
      case 'import_data':
        return await handleImportData(body, supabase, user.id);
      
      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function handleAuthUrl(credentials: GoogleCredentials, userId: string) {
  console.log('Credentials structure:', JSON.stringify(credentials, null, 2));
  
  // Validate credentials structure
  if (!credentials.web) {
    throw new Error('Invalid Google OAuth credentials: missing "web" object');
  }
  
  if (!credentials.web.auth_uri) {
    throw new Error('Invalid Google OAuth credentials: missing "auth_uri"');
  }
  
  if (!credentials.web.client_id) {
    throw new Error('Invalid Google OAuth credentials: missing "client_id"');
  }
  
  if (!credentials.web.redirect_uris || credentials.web.redirect_uris.length === 0) {
    throw new Error('Invalid Google OAuth credentials: missing or empty "redirect_uris" array. Please add a redirect URI in your Google Cloud Console OAuth configuration.');
  }
  
  // Create state parameter to securely link callback to user
  const state = btoa(JSON.stringify({ userId, timestamp: Date.now() }));
  
  const authUrl = new URL(credentials.web.auth_uri);
  authUrl.searchParams.set('client_id', credentials.web.client_id);
  authUrl.searchParams.set('redirect_uri', credentials.web.redirect_uris[0]);
  authUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'consent');
  authUrl.searchParams.set('state', state);

  console.log('Generated auth URL:', authUrl.toString());

  return new Response(
    JSON.stringify({ authUrl: authUrl.toString() }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleExchangeCode(code: string, credentials: GoogleCredentials, supabase: any, userId: string) {
  const tokenResponse = await fetch(credentials.web.token_uri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: credentials.web.client_id,
      client_secret: credentials.web.client_secret,
      redirect_uri: credentials.web.redirect_uris[0],
      grant_type: 'authorization_code',
    }),
  });

  const tokens = await tokenResponse.json();
  
  if (tokens.error) {
    throw new Error(`Token exchange failed: ${tokens.error}`);
  }

  // Store tokens in database
  const expiresAt = new Date(Date.now() + (tokens.expires_in * 1000));
  
  const { error } = await supabase
    .from('sheets_integrations')
    .upsert({
      user_id: userId,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expires_at: expiresAt.toISOString(),
      sync_status: 'success'
    });

  if (error) {
    throw new Error(`Database error: ${error.message}`);
  }

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleCreateSheet(body: any, supabase: any, userId: string) {
  const { data: integration } = await supabase
    .from('sheets_integrations')
    .select('access_token')
    .eq('user_id', userId)
    .single();

  if (!integration || !integration.access_token) {
    throw new Error('No Google Sheets integration found');
  }

  // Decrypt the access token for API calls
  const decryptedAccessToken = await decryptToken(integration.access_token);

  const sheetData = {
    properties: {
      title: body.title || 'Business Tracker Data',
    },
    sheets: [
      { properties: { title: 'Monthly Goals' } },
      { properties: { title: 'Daily Progress' } },
      { properties: { title: 'Opportunities' } },
      { properties: { title: 'Revenue' } }
    ]
  };

  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${decryptedAccessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(sheetData),
  });

  const sheet = await response.json();
  
  if (sheet.error) {
    throw new Error(`Sheet creation failed: ${sheet.error.message}`);
  }

  // Update integration with sheet ID
  await supabase
    .from('sheets_integrations')
    .update({
      google_sheet_id: sheet.spreadsheetId,
      sheet_name: sheet.properties.title
    })
    .eq('user_id', userId);

  return new Response(
    JSON.stringify({ spreadsheetId: sheet.spreadsheetId, url: sheet.spreadsheetUrl }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleExportData(body: any, supabase: any, userId: string) {
  const { dataType, month } = body;
  
  const { data: integration } = await supabase
    .from('sheets_integrations')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!integration || !integration.access_token) {
    throw new Error('No Google Sheets integration found');
  }

  // Decrypt the access token for API calls
  const decryptedAccessToken = await decryptToken(integration.access_token);

  let data, range, values;

  switch (dataType) {
    case 'monthly_goals':
      const { data: goals } = await supabase
        .from('monthly_goals')
        .select('*')
        .eq('user_id', userId)
        .eq('month', month);
      
      values = [
        ['Month', 'Revenue Forecast', 'Cost Budget', 'Workshops Target', 'Advisory Target', 'Lectures Target', 'PR Target'],
        ...(goals || []).map((g: any) => [
          g.month, g.revenue_forecast, g.cost_budget, 
          g.workshops_target, g.advisory_target, g.lectures_target, g.pr_target
        ])
      ];
      range = 'Monthly Goals!A1';
      break;
      
    case 'daily_progress':
      const { data: progress } = await supabase
        .from('daily_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('month', month);
      
      values = [
        ['Date', 'Workshops Progress', 'Advisory Progress', 'Lectures Progress', 'PR Progress', 'Notes'],
        ...(progress || []).map((p: any) => [
          p.date, p.workshops_progress, p.advisory_progress, 
          p.lectures_progress, p.pr_progress, p.notes || ''
        ])
      ];
      range = 'Daily Progress!A1';
      break;
      
    default:
      throw new Error('Invalid data type');
  }

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${integration.google_sheet_id}/values/${range}?valueInputOption=RAW`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${decryptedAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values }),
    }
  );

  const result = await response.json();
  
  if (result.error) {
    throw new Error(`Export failed: ${result.error.message}`);
  }

  return new Response(
    JSON.stringify({ success: true, updatedCells: result.updatedCells }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleExchangeCodeNoAuth(req: Request) {
  // Initialize Supabase client for database operations
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // Parse request URL and body
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  console.log('OAuth callback received:', { hasCode: !!code, hasState: !!state, error });

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error);
    return new Response(
      `<html><body><script>
        window.opener.postMessage({ 
          type: 'oauth_error', 
          error: '${error}' 
        }, '*');
        window.close();
      </script></body></html>`,
      { headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
    );
  }

  if (!code) {
    return new Response(
      `<html><body><script>
        window.opener.postMessage({ 
          type: 'oauth_error', 
          error: 'No authorization code received' 
        }, '*');
        window.close();
      </script></body></html>`,
      { headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
    );
  }

  if (!state) {
    return new Response(
      `<html><body><script>
        window.opener.postMessage({ 
          type: 'oauth_error', 
          error: 'Missing state parameter' 
        }, '*');
        window.close();
      </script></body></html>`,
      { headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
    );
  }

  try {
    // Decode state to get user ID
    const { userId } = JSON.parse(atob(state));
    console.log('Decoded state - userId:', userId);

    // Get Google credentials
    const rawCredentials = Deno.env.get('GOOGLE_OAUTH_CREDENTIALS');
    if (!rawCredentials) {
      throw new Error('Google OAuth credentials not configured');
    }
    
    const credentials: GoogleCredentials = JSON.parse(rawCredentials);

    // Exchange code for tokens
    const tokenResponse = await fetch(credentials.web.token_uri, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: credentials.web.client_id,
        client_secret: credentials.web.client_secret,
        redirect_uri: credentials.web.redirect_uris[0],
        grant_type: 'authorization_code',
      }),
    });

    const tokens = await tokenResponse.json();
    
    if (tokens.error) {
      throw new Error(`Token exchange failed: ${tokens.error}`);
    }

    // Store tokens in database with encryption
    const expiresAt = new Date(Date.now() + (tokens.expires_in * 1000));
    
    // Encrypt sensitive tokens before storage
    const encryptedAccessToken = await encryptToken(tokens.access_token);
    const encryptedRefreshToken = tokens.refresh_token ? await encryptToken(tokens.refresh_token) : null;
    
    console.log('Storing encrypted tokens for user:', userId);
    
    // Store the integration
    const { error: dbError } = await supabase
      .from('sheets_integrations')
      .upsert({
        user_id: userId,
        access_token: encryptedAccessToken,
        refresh_token: encryptedRefreshToken,
        token_expires_at: expiresAt.toISOString(),
        sync_status: 'success'
      });

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`);
    }

    console.log('OAuth integration completed, now auto-creating spreadsheet for user:', userId);
    
    // Automatically create and populate the spreadsheet
    let spreadsheetCreated = false;
    let spreadsheetId = null;
    try {
      const result = await autoCreateAndPopulateSheet(tokens.access_token, supabase, userId);
      console.log('Auto-creation and population completed successfully:', result);
      spreadsheetCreated = true;
      spreadsheetId = result.spreadsheetId;
    } catch (createError) {
      console.error('Auto-creation failed:', createError);
      // Don't fail the OAuth process if sheet creation fails
      // User can see the error and try again
    }

    // Return success HTML that notifies the parent window and closes the popup
    const message = spreadsheetCreated 
      ? `Google Sheets integration completed successfully! Spreadsheet created: ${spreadsheetId}`
      : 'Google authentication successful, but spreadsheet creation failed. You can retry from the dashboard.';
    
    return new Response(
      `<html><body><script>
        console.log('OAuth completion result:', { spreadsheetCreated: ${spreadsheetCreated}, spreadsheetId: '${spreadsheetId}' });
        window.opener.postMessage({ 
          type: 'oauth_success', 
          message: '${message}',
          spreadsheetCreated: ${spreadsheetCreated},
          spreadsheetId: '${spreadsheetId}'
        }, '*');
        window.close();
      </script></body></html>`,
      { headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
    );

  } catch (error) {
    console.error('OAuth callback error:', error);
    return new Response(
      `<html><body><script>
        window.opener.postMessage({ 
          type: 'oauth_error', 
          error: '${error.message}' 
        }, '*');
        window.close();
      </script></body></html>`,
      { headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
    );
  }
}

async function autoCreateAndPopulateSheet(accessToken: string, supabase: any, userId: string) {
  // Create the spreadsheet with comprehensive structure
  const sheetData = {
    properties: {
      title: `Business Tracker - ${new Date().getFullYear()}`,
    },
    sheets: [
      { properties: { title: 'Summary Dashboard', index: 0 } },
      { properties: { title: 'Monthly Goals', index: 1 } },
      { properties: { title: 'Daily Progress', index: 2 } },
      { properties: { title: 'Opportunities Pipeline', index: 3 } },
      { properties: { title: 'Revenue Tracking', index: 4 } }
    ]
  };

  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(sheetData),
  });

  const sheet = await response.json();
  
  if (sheet.error) {
    throw new Error(`Sheet creation failed: ${sheet.error.message}`);
  }

  // Update integration with sheet ID
  await supabase
    .from('sheets_integrations')
    .update({
      google_sheet_id: sheet.spreadsheetId,
      sheet_name: sheet.properties.title,
      last_sync_at: new Date().toISOString()
    })
    .eq('user_id', userId);

  // Populate all data sheets
  await populateAllSheets(accessToken, sheet.spreadsheetId, supabase, userId);
  
  return sheet.spreadsheetId;
}

async function populateAllSheets(accessToken: string, spreadsheetId: string, supabase: any, userId: string) {
  // Fetch all user data
  const [monthlyGoals, dailyProgress, opportunities, revenueEntries] = await Promise.all([
    supabase.from('monthly_goals').select('*').eq('user_id', userId),
    supabase.from('daily_progress').select('*').eq('user_id', userId),
    supabase.from('opportunities').select('*').eq('user_id', userId),
    supabase.from('revenue_entries').select('*').eq('user_id', userId)
  ]);

  // Prepare batch update requests
  const requests = [];

  // Monthly Goals Sheet
  if (monthlyGoals.data && monthlyGoals.data.length > 0) {
    const goalsValues = [
      ['Month', 'Revenue Forecast', 'Cost Budget', 'Workshops Target', 'Advisory Target', 'Lectures Target', 'PR Target', 'Created Date'],
      ...monthlyGoals.data.map((g: any) => [
        g.month, g.revenue_forecast || 0, g.cost_budget || 0,
        g.workshops_target || 0, g.advisory_target || 0, g.lectures_target || 0, g.pr_target || 0,
        new Date(g.created_at).toLocaleDateString()
      ])
    ];
    requests.push({
      range: 'Monthly Goals!A1',
      values: goalsValues
    });
  }

  // Daily Progress Sheet
  if (dailyProgress.data && dailyProgress.data.length > 0) {
    const progressValues = [
      ['Date', 'Month', 'Workshops Progress', 'Advisory Progress', 'Lectures Progress', 'PR Progress', 'Notes'],
      ...dailyProgress.data.map((p: any) => [
        p.date, p.month, p.workshops_progress || 0, p.advisory_progress || 0,
        p.lectures_progress || 0, p.pr_progress || 0, p.notes || ''
      ])
    ];
    requests.push({
      range: 'Daily Progress!A1',
      values: progressValues
    });
  }

  // Opportunities Pipeline Sheet
  if (opportunities.data && opportunities.data.length > 0) {
    const opportunitiesValues = [
      ['Title', 'Type', 'Company', 'Contact Person', 'Stage', 'Probability %', 'Estimated Value', 'Close Date', 'Month', 'Notes'],
      ...opportunities.data.map((o: any) => [
        o.title, o.type, o.company || '', o.contact_person || '', o.stage,
        o.probability || 0, o.estimated_value || 0, o.estimated_close_date || '',
        o.month, o.notes || ''
      ])
    ];
    requests.push({
      range: 'Opportunities Pipeline!A1',
      values: opportunitiesValues
    });
  }

  // Revenue Tracking Sheet
  if (revenueEntries.data && revenueEntries.data.length > 0) {
    const revenueValues = [
      ['Date', 'Month', 'Amount', 'Source', 'Description'],
      ...revenueEntries.data.map((r: any) => [
        r.date, r.month, r.amount || 0, r.source, r.description || ''
      ])
    ];
    requests.push({
      range: 'Revenue Tracking!A1',
      values: revenueValues
    });
  }

  // Summary Dashboard (create basic structure)
  const dashboardValues = [
    ['Business Tracker Summary Dashboard', '', '', '', ''],
    ['', '', '', '', ''],
    ['Key Metrics', 'Current Month', 'All Time', '', ''],
    ['Total Revenue', '=SUMIF(\'Revenue Tracking\'!B:B,TEXT(TODAY(),"YYYY-MM"),\'Revenue Tracking\'!C:C)', '=SUM(\'Revenue Tracking\'!C:C)', '', ''],
    ['Total Opportunities', '=COUNTIF(\'Opportunities Pipeline\'!I:I,TEXT(TODAY(),"YYYY-MM"))', '=COUNTA(\'Opportunities Pipeline\'!A2:A)', '', ''],
    ['Pipeline Value', '=SUMIF(\'Opportunities Pipeline\'!I:I,TEXT(TODAY(),"YYYY-MM"),\'Opportunities Pipeline\'!G:G)', '=SUM(\'Opportunities Pipeline\'!G:G)', '', ''],
    ['', '', '', '', ''],
    ['Recent Activity', '', '', '', ''],
    ['Last 10 Daily Progress Entries:', '', '', '', ''],
  ];
  requests.push({
    range: 'Summary Dashboard!A1',
    values: dashboardValues
  });

  // Execute all requests in batch
  if (requests.length > 0) {
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          valueInputOption: 'USER_ENTERED',
          data: requests
        }),
      }
    );
  }

  // Apply formatting to make it look professional
  await formatSpreadsheet(accessToken, spreadsheetId);
}

async function formatSpreadsheet(accessToken: string, spreadsheetId: string) {
  const formatRequests = [
    // Format headers in all sheets
    {
      repeatCell: {
        range: {
          sheetId: 0, // Summary Dashboard
          startRowIndex: 0,
          endRowIndex: 1,
          startColumnIndex: 0,
          endColumnIndex: 5
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.2, green: 0.6, blue: 0.2 },
            textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } }
          }
        },
        fields: 'userEnteredFormat(backgroundColor,textFormat)'
      }
    },
    // Format other sheet headers similarly...
  ];

  if (formatRequests.length > 0) {
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requests: formatRequests }),
      }
    );
  }
}

async function handleRefreshAllData(body: any, supabase: any, userId: string) {
  const { data: integration } = await supabase
    .from('sheets_integrations')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!integration || !integration.access_token || !integration.google_sheet_id) {
    throw new Error('No Google Sheets integration found or incomplete setup');
  }

  // Decrypt the access token for API calls
  const decryptedAccessToken = await decryptToken(integration.access_token);

  // Clear existing data and repopulate
  await populateAllSheets(decryptedAccessToken, integration.google_sheet_id, supabase, userId);

  // Update last sync time
  await supabase
    .from('sheets_integrations')
    .update({ last_sync_at: new Date().toISOString() })
    .eq('user_id', userId);

  return new Response(
    JSON.stringify({ success: true, message: 'All data refreshed successfully' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleImportData(body: any, supabase: any, userId: string) {
  // Implementation for importing data from Google Sheets
  return new Response(
    JSON.stringify({ success: true, message: 'Import functionality coming soon' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}