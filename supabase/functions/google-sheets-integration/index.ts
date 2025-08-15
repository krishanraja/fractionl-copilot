import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GoogleCredentials {
  web: {
    client_id: string;
    client_secret: string;
    auth_uri: string;
    token_uri: string;
    redirect_uris: string[];
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid token');
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    
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

    // Debug: Log all available environment variables
    console.log('Available environment variables:', Object.keys(Deno.env.toObject()));
    
    // Debug: Check the raw secret value
    const rawCredentials = Deno.env.get('GOOGLE_OAUTH_CREDENTIALS');
    console.log('Raw GOOGLE_OAUTH_CREDENTIALS:', rawCredentials);
    console.log('Raw credentials type:', typeof rawCredentials);
    console.log('Raw credentials length:', rawCredentials?.length || 'undefined');
    
    // Try to parse credentials with better error handling
    let credentials: GoogleCredentials;
    try {
      if (!rawCredentials) {
        console.error('GOOGLE_OAUTH_CREDENTIALS environment variable is not set');
        throw new Error('GOOGLE_OAUTH_CREDENTIALS environment variable is not set');
      }
      
      credentials = JSON.parse(rawCredentials);
      console.log('Parsed credentials keys:', Object.keys(credentials));
      
      if (credentials.web) {
        console.log('Credentials.web keys:', Object.keys(credentials.web));
      } else {
        console.log('No "web" object found in credentials');
      }
    } catch (parseError) {
      console.error('Failed to parse GOOGLE_OAUTH_CREDENTIALS:', parseError);
      throw new Error(`Invalid GOOGLE_OAUTH_CREDENTIALS format: ${parseError.message}`);
    }
    
    switch (action) {
      case 'auth_url':
        return handleAuthUrl(credentials);
      
      case 'exchange_code':
        return await handleExchangeCode(body.code, credentials, supabase, user.id);
      
      case 'create_sheet':
        return await handleCreateSheet(body, supabase, user.id);
      
      case 'export_data':
        return await handleExportData(body, supabase, user.id);
      
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

function handleAuthUrl(credentials: GoogleCredentials) {
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
  
  const authUrl = new URL(credentials.web.auth_uri);
  authUrl.searchParams.set('client_id', credentials.web.client_id);
  authUrl.searchParams.set('redirect_uri', credentials.web.redirect_uris[0]);
  authUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'consent');

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

  if (!integration) {
    throw new Error('No Google Sheets integration found');
  }

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
      'Authorization': `Bearer ${integration.access_token}`,
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

  if (!integration) {
    throw new Error('No Google Sheets integration found');
  }

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
        'Authorization': `Bearer ${integration.access_token}`,
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

async function handleImportData(body: any, supabase: any, userId: string) {
  // Implementation for importing data from Google Sheets
  return new Response(
    JSON.stringify({ success: true, message: 'Import functionality coming soon' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}