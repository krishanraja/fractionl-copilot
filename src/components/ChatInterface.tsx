import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Send, Loader2, MessageSquare, Plus, History } from 'lucide-react';
import { ChatMessage } from './ChatMessage';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useConversationSummary } from '@/hooks/useConversationSummary';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  created_at: string;
}

interface ChatInterfaceProps {
  currentMetrics: any;
  monthlyGoals: any;
  businessContext: any;
}

export const ChatInterface = ({ currentMetrics, monthlyGoals, businessContext }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { generateSummary, isGeneratingSummary } = useConversationSummary();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    createNewSession();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const createNewSession = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('conversation_sessions')
        .insert({
          user_id: user.id,
          title: 'Strategic Chat',
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;
      
      setCurrentSessionId(data.id);
      setMessages([]);
      
      // Add welcome message
      const welcomeMessage: Message = {
        id: 'welcome',
        content: "Hello! I'm your AI strategic advisor. I can help you analyze your business metrics, discuss growth strategies, and provide insights based on your current performance. What would you like to explore today?",
        role: 'assistant',
        created_at: new Date().toISOString()
      };
      setMessages([welcomeMessage]);
    } catch (error) {
      console.error('Error creating session:', error);
      toast({
        title: "Error creating chat session",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const sendMessage = async () => {
    if (!currentMessage.trim() || !currentSessionId || !user) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: currentMessage,
      role: 'user',
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsLoading(true);

    try {
      // Save user message to database
      await supabase
        .from('chat_messages')
        .insert({
          session_id: currentSessionId,
          user_id: user.id,
          content: currentMessage,
          role: 'user'
        });

      // Enhanced session validation and token refresh
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        toast({
          title: "Authentication Error",
          description: "Session validation failed. Please refresh the page and try again.",
          variant: "destructive",
        });
        return;
      }
      
      if (!session || !session.access_token) {
        console.error('No valid session or access token found');
        toast({
          title: "Authentication Required",
          description: "Please refresh the page and log in again.",
          variant: "destructive",
        });
        return;
      }

      // Check if token is about to expire (within 5 minutes)
      const tokenExp = session.expires_at;
      const now = Math.floor(Date.now() / 1000);
      if (tokenExp && (tokenExp - now) < 300) {
        console.log('Token expiring soon, refreshing...');
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          console.error('Token refresh failed:', refreshError);
          toast({
            title: "Session Expired",
            description: "Please refresh the page and log in again.",
            variant: "destructive",
          });
          return;
        }
      }

      // Call AI function for response
      const { data, error } = await supabase.functions.invoke('ai-strategic-analysis', {
        body: {
          question: currentMessage,
          context: {
            currentMetrics,
            monthlyGoals,
            businessContext,
            conversationHistory: messages.slice(-5), // Include recent context
            timestamp: new Date().toISOString()
          },
          conversationType: 'chat',
          sessionId: currentSessionId
        }
      });

      if (error) {
        console.error('Strategic AI function error:', error);
        
        if (error.message?.includes('Token expired') || error.message?.includes('session has expired')) {
          toast({
            title: "Session Expired",
            description: "Your session has expired. Please refresh the page and log in again.",
            variant: "destructive",
          });
          return;
        }
        
        if (error.message?.includes('Authentication') || error.message?.includes('401') || error.message?.includes('Authorization')) {
          toast({
            title: "Authentication Error",
            description: "Authentication failed. Please refresh the page and try again.",
            variant: "destructive",
          });
          return;
        }
        
        throw error;
      }

      // Add AI response to messages
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        content: data.response || "I apologize, but I encountered an issue generating a response. Please try again.",
        role: 'assistant',
        created_at: new Date().toISOString()
      };

      setMessages(prev => [...prev, aiMessage]);

      // Save AI message to database
      await supabase
        .from('chat_messages')
        .insert({
          session_id: currentSessionId,
          user_id: user.id,
          content: aiMessage.content,
          role: 'assistant'
        });

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = error.message || 'An unexpected error occurred';
      
      if (errorMessage.includes('OpenAI') || errorMessage.includes('API key')) {
        toast({
          title: "AI Service Issue",
          description: "The AI service configuration needs attention. Please contact support.",
          variant: "destructive",
        });
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        toast({
          title: "Connection Error",
          description: "Please check your internet connection and try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error sending message",
          description: "Please try again in a moment.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader className="flex-shrink-0 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Strategic Chat
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={createNewSession}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Chat
            </Button>
            {messages.length > 4 && currentSessionId && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => generateSummary(currentSessionId, messages)}
                disabled={isGeneratingSummary}
                className="flex items-center gap-2"
              >
                {isGeneratingSummary ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <History className="h-4 w-4" />
                )}
                Save Summary
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea ref={scrollAreaRef} className="flex-1 px-4">
          <div className="space-y-2 py-4">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                content={message.content}
                role={message.role}
                timestamp={message.created_at}
              />
            ))}
            {isLoading && (
              <div className="flex gap-3 p-4">
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                  <Loader2 className="h-4 w-4 text-primary-foreground animate-spin" />
                </div>
                <div className="bg-card border rounded-lg px-4 py-2">
                  <p className="text-sm text-muted-foreground">AI is thinking...</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              placeholder="Ask about your business strategy..."
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={sendMessage}
              disabled={isLoading || !currentMessage.trim()}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};