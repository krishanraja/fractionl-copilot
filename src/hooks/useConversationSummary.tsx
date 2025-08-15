import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export const useConversationSummary = () => {
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const generateSummary = async (sessionId: string, messages: any[]) => {
    if (!user || messages.length < 4) return null; // Need at least 4 messages for a summary

    setIsGeneratingSummary(true);
    try {
      // Enhanced session validation
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.access_token) {
        throw new Error('Authentication required');
      }

      const conversationText = messages
        .map(msg => `${msg.role === 'user' ? 'User' : 'AI'}: ${msg.content}`)
        .join('\n\n');

      const { data, error } = await supabase.functions.invoke('ai-strategic-analysis', {
        body: {
          question: `Please create a concise summary of this strategic business conversation in 2-3 sentences: ${conversationText}`,
          conversationType: 'summary',
          sessionId
        }
      });

      if (error) throw error;

      const summary = data.response;

      // Update session with summary and store in analysis history
      const { error: updateError } = await supabase
        .from('conversation_sessions')
        .update({ 
          summary,
          is_active: false 
        })
        .eq('id', sessionId);

      if (updateError) throw updateError;

      // Create entry in analysis history (existing ai_conversations table)
      const { error: historyError } = await supabase
        .from('ai_conversations')
        .insert({
          user_id: user.id,
          question: 'Strategic Chat Session Summary',
          response: summary,
          conversation_type: 'strategic',
          context: { sessionId, messageCount: messages.length }
        });

      if (historyError) throw historyError;

      toast({
        title: "Conversation summarized",
        description: "Your chat has been saved to Analysis History.",
      });

      return summary;
    } catch (error) {
      console.error('Error generating summary:', error);
      toast({
        title: "Error creating summary",
        description: "Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  return { generateSummary, isGeneratingSummary };
};