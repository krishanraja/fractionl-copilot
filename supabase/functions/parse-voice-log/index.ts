import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      console.error('OPENAI_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { transcript, clients = [], context = {} } = await req.json();
    
    if (!transcript) {
      console.error('No transcript provided');
      return new Response(
        JSON.stringify({ error: 'No transcript provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Parsing transcript:', transcript.substring(0, 100) + '...');

    const systemPrompt = `You are an AI assistant that parses voice activity logs for a portfolio entrepreneur.
Extract structured information from the transcript about business activities.

Known clients: ${clients.length > 0 ? clients.map((c: any) => c.name).join(', ') : 'None specified yet'}

Return a JSON object with:
- activity_type: one of "meeting", "call", "email", "work", "admin", "networking", "other"
- client_name: the client mentioned (or null if none/personal)
- duration_minutes: estimated duration if mentioned (or null)
- revenue: any revenue/payment mentioned as number (or null)
- summary: a brief 1-2 sentence summary of the activity
- notes: any additional details mentioned
- confidence: your confidence in the parsing (0-1)

Be conservative - if unsure, use null rather than guessing.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: transcript }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: `OpenAI API error: ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await response.json();
    const parsedContent = JSON.parse(result.choices[0].message.content);
    
    console.log('Parsed activity:', JSON.stringify(parsedContent));

    return new Response(
      JSON.stringify({ 
        parsed: parsedContent,
        raw_transcript: transcript 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Parse error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Parsing failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
