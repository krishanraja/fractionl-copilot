import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

export interface UserInsight {
  id: string;
  user_id: string;
  insight_type: string;
  category: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low' | null;
  suggested_actions: string[] | null;
  confidence_score: number | null;
  status: 'active' | 'dismissed' | 'actioned' | 'expired' | null;
  supporting_data: Record<string, any> | null;
  expires_at: string | null;
  dismissed_at: string | null;
  actioned_at: string | null;
  created_at: string;
  updated_at: string;
}

interface UseUserInsightsOptions {
  category?: string;
  priority?: 'high' | 'medium' | 'low';
  status?: 'active' | 'dismissed' | 'actioned' | 'expired';
  limit?: number;
}

export function useUserInsights(options: UseUserInsightsOptions = {}) {
  const { user } = useAuth();
  const [insights, setInsights] = useState<UserInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const fetchInsights = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('user_insights')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (options.category) {
        query = query.eq('category', options.category);
      }

      if (options.priority) {
        query = query.eq('priority', options.priority);
      }

      if (options.status) {
        query = query.eq('status', options.status);
      } else {
        // Default to active insights
        query = query.eq('status', 'active');
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Parse the data to match our interface
      const parsedInsights: UserInsight[] = (data || []).map((insight: any) => ({
        ...insight,
        suggested_actions: Array.isArray(insight.suggested_actions) 
          ? insight.suggested_actions 
          : null,
        supporting_data: typeof insight.supporting_data === 'object' 
          ? insight.supporting_data 
          : null,
      }));

      setInsights(parsedInsights);
    } catch (err) {
      console.error('Error fetching insights:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch insights');
    } finally {
      setLoading(false);
    }
  }, [user?.id, options.category, options.priority, options.status, options.limit]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  // Set up real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('user_insights_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_insights',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Insight change detected:', payload);
          fetchInsights();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchInsights]);

  const dismissInsight = useCallback(async (insightId: string) => {
    if (!user?.id) return;

    try {
      const { error: updateError } = await supabase
        .from('user_insights')
        .update({
          status: 'dismissed',
          dismissed_at: new Date().toISOString(),
        })
        .eq('id', insightId)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setInsights((prev) => prev.filter((i) => i.id !== insightId));
      
      toast({
        title: 'Insight dismissed',
        description: 'This insight has been removed from your feed.',
      });
    } catch (err) {
      console.error('Error dismissing insight:', err);
      toast({
        title: 'Error',
        description: 'Failed to dismiss insight',
        variant: 'destructive',
      });
    }
  }, [user?.id]);

  const actionInsight = useCallback(async (insightId: string) => {
    if (!user?.id) return;

    try {
      const { error: updateError } = await supabase
        .from('user_insights')
        .update({
          status: 'actioned',
          actioned_at: new Date().toISOString(),
        })
        .eq('id', insightId)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setInsights((prev) => prev.filter((i) => i.id !== insightId));
      
      toast({
        title: 'Great work! 🎉',
        description: 'Insight marked as actioned.',
      });
    } catch (err) {
      console.error('Error actioning insight:', err);
      toast({
        title: 'Error',
        description: 'Failed to mark insight as actioned',
        variant: 'destructive',
      });
    }
  }, [user?.id]);

  const generateInsights = useCallback(async () => {
    if (!user?.id) return;

    try {
      setGenerating(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No active session');
      }

      const { data, error: invokeError } = await supabase.functions.invoke('generate-user-insights', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (invokeError) throw invokeError;

      if (data?.insights?.length > 0) {
        toast({
          title: 'New insights generated! ✨',
          description: `${data.insights.length} personalized insights are ready.`,
        });
        await fetchInsights();
      } else {
        toast({
          title: 'Analysis complete',
          description: 'No new insights at this time. Keep using the app!',
        });
      }

      return data;
    } catch (err) {
      console.error('Error generating insights:', err);
      toast({
        title: 'Error',
        description: 'Failed to generate insights. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  }, [user?.id, fetchInsights]);

  const getHighPriorityInsights = useCallback(() => {
    return insights.filter((i) => i.priority === 'high');
  }, [insights]);

  const getInsightsByCategory = useCallback((category: string) => {
    return insights.filter((i) => i.category === category);
  }, [insights]);

  return {
    insights,
    loading,
    error,
    generating,
    fetchInsights,
    dismissInsight,
    actionInsight,
    generateInsights,
    getHighPriorityInsights,
    getInsightsByCategory,
    hasInsights: insights.length > 0,
    highPriorityCount: insights.filter((i) => i.priority === 'high').length,
  };
}
