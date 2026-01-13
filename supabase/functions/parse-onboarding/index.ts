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

    const { transcript } = await req.json();
    
    if (!transcript) {
      console.error('No transcript provided');
      return new Response(
        JSON.stringify({ error: 'No transcript provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Parsing onboarding transcript:', transcript.substring(0, 100) + '...');

    const systemPrompt = `You are an AI assistant helping set up a portfolio management app for a fractional executive or consultant.
Parse the user's voice introduction to extract key information about their work.

Return a JSON object with:
- clients: array of objects with { name: string, type: string (retainer/project/advisory), monthly_value: number | null }
- revenue_target: monthly revenue target as number (or null if not mentioned)
- work_patterns: object with { typical_start_time: string | null, typical_end_time: string | null, busy_days: string[] }
- business_type: one of "consultant", "fractional_executive", "advisor", "agency", "freelancer", "other"
- target_market: brief description of their target market
- main_challenges: array of 1-3 main challenges they mentioned

Be conservative - extract only what's clearly stated. Use null for uncertain values.
For clients, include any companies, projects, or engagements mentioned.`;

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
    
    console.log('Parsed onboarding:', JSON.stringify(parsedContent));

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
