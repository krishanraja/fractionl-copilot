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
  Settings
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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
  const [businessContext, setBusinessContext] = useState({
    business_type: '',
    target_market: '',
    main_challenges: [] as string[],
    priorities: [] as string[],
  });
  const { toast } = useToast();

  useEffect(() => {
    loadConversations();
    loadBusinessContext();
  }, []);

  const loadConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_conversations')
        .select('*')
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
    try {
      const { data, error } = await supabase
        .from('user_business_context')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
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
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Authentication required",
          description: "Please sign in to use AI strategy features.",
          variant: "destructive",
        });
        return;
      }

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
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      // Refresh conversations to show the new one
      loadConversations();
      setCurrentQuestion('');

      toast({
        title: "AI Analysis Complete",
        description: "Your strategic analysis has been generated.",
      });
    } catch (error) {
      console.error('Error getting AI analysis:', error);
      toast({
        title: "Error getting AI analysis",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateBusinessContext = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

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
            <Settings className="h-4 w-4" />
            Business Context
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
              <CardTitle>Business Context</CardTitle>
              <CardDescription>
                Help the AI understand your business better for more personalized insights.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Business Type</label>
                  <Input
                    placeholder="e.g., SaaS, Consulting, E-commerce"
                    value={businessContext.business_type}
                    onChange={(e) => setBusinessContext(prev => ({ 
                      ...prev, 
                      business_type: e.target.value 
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Target Market</label>
                  <Input
                    placeholder="e.g., Small businesses, Enterprise, Consumers"
                    value={businessContext.target_market}
                    onChange={(e) => setBusinessContext(prev => ({ 
                      ...prev, 
                      target_market: e.target.value 
                    }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Main Challenges</label>
                <Textarea
                  placeholder="Describe your biggest business challenges..."
                  value={businessContext.main_challenges.join('\n')}
                  onChange={(e) => setBusinessContext(prev => ({ 
                    ...prev, 
                    main_challenges: e.target.value.split('\n').filter(Boolean)
                  }))}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Current Priorities</label>
                <Textarea
                  placeholder="What are your top priorities right now?"
                  value={businessContext.priorities.join('\n')}
                  onChange={(e) => setBusinessContext(prev => ({ 
                    ...prev, 
                    priorities: e.target.value.split('\n').filter(Boolean)
                  }))}
                />
              </div>

              <Button onClick={updateBusinessContext} className="w-full">
                Save Business Context
              </Button>
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