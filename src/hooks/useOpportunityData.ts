import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Opportunity } from '@/types/tracking';
import { toast } from '@/hooks/use-toast';
import { useAuth } from './useAuth';

export const useOpportunityData = (selectedMonth: string) => {
  const { user } = useAuth();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOpportunities = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('opportunities')
        .select('*')
        .eq('month', selectedMonth)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading opportunities:', error);
        toast({
          title: "Error loading opportunities",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setOpportunities((data || []) as Opportunity[]);
      }
    } catch (error) {
      console.error('Error loading opportunities:', error);
      toast({
        title: "Error loading opportunities",
        description: "Failed to load opportunity data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createOpportunity = async (opportunityData: Partial<Opportunity>) => {
    if (!user) return;
    
    try {
      if (!opportunityData.title || !opportunityData.type) {
        throw new Error('Title and type are required');
      }
      
      const { data, error } = await supabase
        .from('opportunities')
        .insert({
          ...opportunityData,
          user_id: user.id,
          month: selectedMonth,
          title: opportunityData.title,
          type: opportunityData.type
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating opportunity:', error);
        toast({
          title: "Error creating opportunity",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setOpportunities(prev => [data as Opportunity, ...prev]);
        toast({
          title: "Opportunity created",
          description: "New opportunity added to pipeline",
        });
      }
    } catch (error) {
      console.error('Error creating opportunity:', error);
      toast({
        title: "Error creating opportunity",
        description: "Failed to create opportunity",
        variant: "destructive",
      });
    }
  };

  const updateOpportunity = async (id: string, updates: Partial<Opportunity>) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('opportunities')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating opportunity:', error);
        toast({
          title: "Error updating opportunity",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setOpportunities(prev => 
          prev.map(opp => opp.id === id ? data as Opportunity : opp)
        );
        toast({
          title: "Opportunity updated",
          description: "Opportunity details have been saved",
        });
      }
    } catch (error) {
      console.error('Error updating opportunity:', error);
      toast({
        title: "Error updating opportunity",
        description: "Failed to update opportunity",
        variant: "destructive",
      });
    }
  };

  const deleteOpportunity = async (id: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('opportunities')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting opportunity:', error);
        toast({
          title: "Error deleting opportunity",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setOpportunities(prev => prev.filter(opp => opp.id !== id));
        toast({
          title: "Opportunity deleted",
          description: "Opportunity removed from pipeline",
        });
      }
    } catch (error) {
      console.error('Error deleting opportunity:', error);
      toast({
        title: "Error deleting opportunity",
        description: "Failed to delete opportunity",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (user) {
      loadOpportunities();
    }
  }, [selectedMonth, user]);

  return {
    opportunities,
    loading,
    createOpportunity,
    updateOpportunity,
    deleteOpportunity,
    loadOpportunities
  };
};