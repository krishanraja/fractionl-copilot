import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Brain, 
  MessageSquare, 
  Target, 
  TrendingUp, 
  Lightbulb,
  Send,
  Loader2,
  History,
  Settings,
  Download,
  Bot
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface AIStrategyHubProps {
  currentMetrics: any;
  monthlyGoals: any;
}

interface Conversation {
  id: string;
  question: string;
  response: string;
  created_at: string;
  conversation_type: string;
}

export const AIStrategyHub = ({ currentMetrics, monthlyGoals }: AIStrategyHubProps) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingContext, setIsLoadingContext] = useState(false);
  const [businessContext, setBusinessContext] = useState({
    business_type: '',
    target_market: '',
    main_challenges: [] as string[],
    priorities: [] as string[],
  });
  const [isContextAutoLoaded, setIsContextAutoLoaded] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    loadConversations();
    loadBusinessContext();
    // Auto-load business context from Assistant on mount
    if (!isContextAutoLoaded) {
      loadBusinessContextFromAssistant();
    }
  }, [isContextAutoLoaded]);

  const loadConversations = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('user_id', user.id)
        .eq('conversation_type', 'strategic')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const loadBusinessContext = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_business_context')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setBusinessContext({
          business_type: data.business_type || '',
          target_market: data.target_market || '',
          main_challenges: data.main_challenges || [],
          priorities: data.priorities || [],
        });
      }
    } catch (error) {
      console.error('Error loading business context:', error);
    }
  };

  const askStrategicQuestion = async () => {
    if (!currentQuestion.trim()) return;

    setIsLoading(true);
    try {
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

      console.log('Making strategic AI function call with valid session');
      const { data, error } = await supabase.functions.invoke('ai-strategic-analysis', {
        body: {
          question: currentQuestion,
          context: {
            currentMetrics,
            monthlyGoals,
            businessContext,
            timestamp: new Date().toISOString()
          },
          conversationType: 'strategic'
        }
      });

      if (error) {
        console.error('Strategic AI function error:', error);
        
        // Enhanced error handling for different failure types
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

      // Refresh conversations to show the new one
      loadConversations();
      setCurrentQuestion('');

      toast({
        title: "AI Analysis Complete",
        description: "Your strategic analysis has been generated.",
      });
    } catch (error) {
      console.error('Error getting AI analysis:', error);
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
          title: "Error getting AI analysis",
          description: "Please try again in a moment.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadBusinessContextFromAssistant = async () => {
    setIsLoadingContext(true);
    try {
      // Enhanced session validation for context loading
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error during context load:', sessionError);
        setIsContextAutoLoaded(true); // Mark as attempted
        toast({
          title: "Authentication Error",
          description: "Please refresh the page to sync with AI Assistant.",
          variant: "destructive",
        });
        return;
      }
      
      if (!session || !session.access_token) {
        console.error('No valid session for context loading');
        setIsContextAutoLoaded(true); // Mark as attempted
        toast({
          title: "Authentication Required",
          description: "Please refresh the page to enable AI Assistant sync.",
          variant: "destructive",
        });
        return;
      }

      console.log('Loading business context from AI Assistant with valid session');
      const { data, error } = await supabase.functions.invoke('ai-strategic-analysis', {
        body: {
          loadBusinessContext: true,
        }
      });

      if (error) {
        console.error('Business context loading error:', error);
        
        // Enhanced error handling for context loading
        if (error.message?.includes('Token expired') || error.message?.includes('session has expired')) {
          setIsContextAutoLoaded(true); // Mark as attempted
          toast({
            title: "Session Expired",
            description: "Your session has expired. Please refresh the page.",
            variant: "destructive",
          });
          return;
        }
        
        if (error.message?.includes('Authentication') || error.message?.includes('401') || error.message?.includes('Authorization')) {
          setIsContextAutoLoaded(true); // Mark as attempted
          toast({
            title: "Authentication Error",
            description: "Authentication failed. Please refresh the page.",
            variant: "destructive",
          });
          return;
        }
        
        throw error;
      }

      if (data.businessContext) {
        // The edge function now returns a properly parsed object
        const context = data.businessContext;
        
        setBusinessContext({
          business_type: context.business_type || '',
          target_market: context.target_market || '',
          main_challenges: context.main_challenges || [],
          priorities: context.priorities || [],
        });

        setIsContextAutoLoaded(true);

        // Reload the business context from the database since it was saved server-side
        await loadBusinessContext();

        if (data.fallback) {
          toast({
            title: "Default context loaded",
            description: "Assistant integration needs configuration. Using fallback data.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Business context synced",
            description: "AI Assistant context loaded and saved automatically.",
          });
        }
      } else if (data.error) {
        console.error('Assistant integration error:', data.error);
        setIsContextAutoLoaded(true); // Mark as attempted
        toast({
          title: "Assistant integration issue",
          description: data.fallback ? "Using default context for now." : "Please check Assistant configuration.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error loading business context from assistant:', error);
      setIsContextAutoLoaded(true); // Mark as attempted
      const errorMessage = error.message || 'An unexpected error occurred';
      
      if (errorMessage.includes('OpenAI') || errorMessage.includes('API key')) {
        toast({
          title: "AI Service Issue",
          description: "The AI Assistant service configuration needs attention.",
          variant: "destructive",
        });
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        toast({
          title: "Connection Error",
          description: "Failed to connect to AI Assistant. Please check your connection.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Assistant Sync Error",
          description: "Failed to sync with AI Assistant. Please try again later.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoadingContext(false);
    }
  };

  const updateBusinessContext = async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('user_business_context')
        .upsert({
          user_id: user.id,
          ...businessContext,
        });

      if (error) throw error;

      toast({
        title: "Business context updated",
        description: "Your business information has been saved.",
      });
    } catch (error) {
      console.error('Error updating business context:', error);
      toast({
        title: "Error updating context",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const suggestedQuestions = [
    "Based on my current metrics, what should be my top priority this month?",
    "What strategies can help me improve my conversion rate?",
    "How can I optimize my cost structure while maintaining growth?",
    "What are the biggest risks in my current business trajectory?",
    "How should I adjust my goals based on recent performance?",
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Brain className="h-8 w-8 text-primary" />
          AI Strategy Hub
        </h1>
        <p className="text-muted-foreground">
          Comprehensive AI-powered business analysis and strategic guidance
        </p>
      </div>

      <Tabs defaultValue="chat" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Strategic Chat
          </TabsTrigger>
          <TabsTrigger value="context" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            Business Summary
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Analysis History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Strategic Analysis
              </CardTitle>
              <CardDescription>
                Ask detailed questions about your business strategy, performance, and goals.
                The AI will provide comprehensive analysis based on your current metrics.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Textarea
                  placeholder="Ask a strategic question about your business..."
                  value={currentQuestion}
                  onChange={(e) => setCurrentQuestion(e.target.value)}
                  className="min-h-[100px]"
                />
                <Button 
                  onClick={askStrategicQuestion}
                  disabled={isLoading || !currentQuestion.trim()}
                  className="w-full"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Get Strategic Analysis
                </Button>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Suggested Questions:</h4>
                <div className="flex flex-wrap gap-2">
                  {suggestedQuestions.map((question, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentQuestion(question)}
                      className="text-xs"
                    >
                      <Lightbulb className="h-3 w-3 mr-1" />
                      {question.substring(0, 40)}...
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="context" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Business Summary</CardTitle>
              <CardDescription>
                Automatically synced business insights from your AI Assistant - no manual input required.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg border">
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">AI Assistant Integration</p>
                    <p className="text-xs text-muted-foreground">
                      {isLoadingContext ? 'Syncing with your trained AI Assistant...' : 
                       isContextAutoLoaded ? 'Business context synced with AI Assistant' :
                       'Auto-sync enabled for seamless AI experience'}
                    </p>
                  </div>
                </div>
                {isLoadingContext ? (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                ) : isContextAutoLoaded ? (
                  <Badge variant="secondary">
                    <Download className="h-3 w-3 mr-1" />
                    Synced
                  </Badge>
                ) : (
                  <Badge variant="outline">Connecting...</Badge>
                )}
              </div>
              
              <Separator />
              
              {businessContext.business_type || businessContext.target_market || 
               businessContext.main_challenges.length > 0 || businessContext.priorities.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {businessContext.business_type && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-muted-foreground">Business Type</h4>
                      <p className="text-sm p-3 bg-muted rounded-md">{businessContext.business_type}</p>
                    </div>
                  )}
                  {businessContext.target_market && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-muted-foreground">Target Market</h4>
                      <p className="text-sm p-3 bg-muted rounded-md">{businessContext.target_market}</p>
                    </div>
                  )}
                </div>
              ) : null}

              {businessContext.main_challenges.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Main Challenges</h4>
                  <div className="space-y-2">
                    {businessContext.main_challenges.map((challenge, index) => (
                      <div key={index} className="text-sm p-3 bg-muted rounded-md">
                        {challenge}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {businessContext.priorities.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Current Priorities</h4>
                  <div className="space-y-2">
                    {businessContext.priorities.map((priority, index) => (
                      <div key={index} className="text-sm p-3 bg-muted rounded-md">
                        {priority}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!businessContext.business_type && !businessContext.target_market && 
               businessContext.main_challenges.length === 0 && businessContext.priorities.length === 0 && !isLoadingContext && (
                <div className="text-center text-muted-foreground py-8">
                  <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">Business context will appear here once synced with your AI Assistant.</p>
                  <p className="text-xs mt-2">Sync happens automatically when the Assistant is properly configured.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analysis History</CardTitle>
              <CardDescription>
                Review your previous strategic conversations and insights.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                {conversations.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No strategic conversations yet.</p>
                    <p className="text-sm">Start asking questions in the Strategic Chat tab!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {conversations.map((conversation) => (
                      <div key={conversation.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1 flex-1">
                            <div className="font-medium text-sm">Question:</div>
                            <p className="text-sm text-muted-foreground">{conversation.question}</p>
                          </div>
                          <Badge variant="secondary" className="ml-2">
                            {new Date(conversation.created_at).toLocaleDateString()}
                          </Badge>
                        </div>
                        <Separator />
                        <div className="space-y-1">
                          <div className="font-medium text-sm flex items-center gap-2">
                            <Brain className="h-4 w-4 text-primary" />
                            AI Analysis:
                          </div>
                          <p className="text-sm leading-relaxed">{conversation.response}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};