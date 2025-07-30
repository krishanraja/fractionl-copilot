import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    const assistantId = Deno.env.get('OPENAI_ASSISTANT_ID');
    
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const { question, context, conversationType = 'quick_insight', loadBusinessContext = false } = await req.json();
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Use a default user ID for password gate system
    const userId = 'default_user';
    
    console.log('Processing AI request:', { question, conversationType, loadBusinessContext, userId });

    // Handle business context loading from Assistant
    if (loadBusinessContext && assistantId) {
      try {
        // Create a thread with the Assistant
        const threadResponse = await fetch('https://api.openai.com/v1/threads', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
            'OpenAI-Beta': 'assistants=v2',
          },
          body: JSON.stringify({}),
        });

        if (!threadResponse.ok) {
          throw new Error(`Failed to create thread: ${threadResponse.statusText}`);
        }

        const thread = await threadResponse.json();

        // Send message to get business context
        await fetch(`https://api.openai.com/v1/threads/${thread.id}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
            'OpenAI-Beta': 'assistants=v2',
          },
          body: JSON.stringify({
            role: 'user',
            content: 'Please provide a comprehensive summary of the business details including: business type, target market, main challenges, and current priorities. Format this as a structured response.',
          }),
        });

        // Run the assistant
        const runResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/runs`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
            'OpenAI-Beta': 'assistants=v2',
          },
          body: JSON.stringify({
            assistant_id: assistantId,
          }),
        });

        if (!runResponse.ok) {
          throw new Error(`Failed to run assistant: ${runResponse.statusText}`);
        }

        const run = await runResponse.json();

        // Poll for completion
        let runStatus = run.status;
        let attempts = 0;
        const maxAttempts = 30;

        while (runStatus !== 'completed' && runStatus !== 'failed' && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const statusResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/runs/${run.id}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${openAIApiKey}`,
              'OpenAI-Beta': 'assistants=v2',
            },
          });

          if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            runStatus = statusData.status;
          }
          attempts++;
        }

        if (runStatus === 'completed') {
          // Get the assistant's response
          const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/messages`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${openAIApiKey}`,
              'OpenAI-Beta': 'assistants=v2',
            },
          });

          if (messagesResponse.ok) {
            const messages = await messagesResponse.json();
            const assistantMessage = messages.data.find(msg => msg.role === 'assistant');
            
            if (assistantMessage && assistantMessage.content[0]?.text?.value) {
              const businessContext = assistantMessage.content[0].text.value;
              
              return new Response(JSON.stringify({ 
                businessContext,
                success: true 
              }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              });
            }
          }
        }

        throw new Error('Failed to get business context from assistant');
      } catch (error) {
        console.error('Error loading business context from assistant:', error);
        return new Response(JSON.stringify({ 
          error: 'Failed to load business context from assistant',
          fallback: true 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Regular AI conversation handling
    let systemPrompt = '';
    let apiEndpoint = 'https://api.openai.com/v1/chat/completions';
    let requestBody: any;
    let headers: any = {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    };

    // Use Assistant API if assistant is configured and this is not a quick insight
    if (assistantId && conversationType !== 'quick_insight') {
      // Create thread for assistant conversation
      const threadResponse = await fetch('https://api.openai.com/v1/threads', {
        method: 'POST',
        headers: {
          ...headers,
          'OpenAI-Beta': 'assistants=v2',
        },
        body: JSON.stringify({}),
      });

      if (threadResponse.ok) {
        const thread = await threadResponse.json();

        // Send message
        await fetch(`https://api.openai.com/v1/threads/${thread.id}/messages`, {
          method: 'POST',
          headers: {
            ...headers,
            'OpenAI-Beta': 'assistants=v2',
          },
          body: JSON.stringify({
            role: 'user',
            content: `${question}\n\nContext: ${JSON.stringify(context)}`,
          }),
        });

        // Run assistant
        const runResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/runs`, {
          method: 'POST',
          headers: {
            ...headers,
            'OpenAI-Beta': 'assistants=v2',
          },
          body: JSON.stringify({
            assistant_id: assistantId,
          }),
        });

        if (runResponse.ok) {
          const run = await runResponse.json();
          
          // Poll for completion
          let runStatus = run.status;
          let attempts = 0;
          const maxAttempts = 30;

          while (runStatus !== 'completed' && runStatus !== 'failed' && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const statusResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/runs/${run.id}`, {
              headers: {
                ...headers,
                'OpenAI-Beta': 'assistants=v2',
              },
            });

            if (statusResponse.ok) {
              const statusData = await statusResponse.json();
              runStatus = statusData.status;
            }
            attempts++;
          }

          if (runStatus === 'completed') {
            const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/messages`, {
              headers: {
                ...headers,
                'OpenAI-Beta': 'assistants=v2',
              },
            });

            if (messagesResponse.ok) {
              const messages = await messagesResponse.json();
              const assistantMessage = messages.data.find(msg => msg.role === 'assistant');
              
              if (assistantMessage && assistantMessage.content[0]?.text?.value) {
                const aiResponse = assistantMessage.content[0].text.value;
                
                // Store the conversation
                await supabase
                  .from('ai_conversations')
                  .insert({
                    user_id: userId,
                    question,
                    response: aiResponse,
                    context,
                    conversation_type: conversationType
                  });

                return new Response(JSON.stringify({ 
                  response: aiResponse,
                  conversationType,
                  usedAssistant: true
                }), {
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
              }
            }
          }
        }
      }
      
      console.log('Assistant API failed, falling back to chat completions');
    }

    // Fallback to regular chat completions
    if (conversationType === 'quick_insight') {
      systemPrompt = `You are a strategic business advisor providing quick, actionable insights. 
      
      Context about the user's business metrics: ${JSON.stringify(context)}
      
      Provide a brief, actionable response (2-3 sentences max) that directly addresses their question while considering their current metrics. Focus on immediate, practical advice.`;
    } else {
      systemPrompt = `You are a strategic business advisor providing comprehensive analysis and recommendations.
      
      Context about the user's business metrics: ${JSON.stringify(context)}
      
      Provide detailed, strategic analysis with specific recommendations. Consider trends, patterns, and long-term implications. Be thorough but practical.`;
    }

    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question }
        ],
        temperature: 0.7,
        max_tokens: conversationType === 'quick_insight' ? 150 : 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // Store the conversation in the database
    const { error: insertError } = await supabase
      .from('ai_conversations')
      .insert({
        user_id: userId,
        question,
        response: aiResponse,
        context,
        conversation_type: conversationType
      });

    if (insertError) {
      console.error('Error storing conversation:', insertError);
      // Don't throw here, just log the error
    }

    console.log('AI response generated successfully');

    return new Response(JSON.stringify({ 
      response: aiResponse,
      conversationType 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in AI strategic analysis:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});