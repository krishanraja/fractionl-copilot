import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  MonthlyGoals, 
  MonthlySnapshots, 
  DailyProgress, 
  MetricProgress,
  ProgressStatus,
  MetricConfig 
} from '@/types/tracking';
import { 
  DollarSign, 
  Users, 
  Eye, 
  Share2, 
  Megaphone, 
  Target,
  Presentation
} from 'lucide-react';

const METRIC_CONFIGS: MetricConfig[] = [
  {
    key: 'revenue_target',
    label: 'Revenue Target',
    icon: DollarSign,
    unit: '$',
    type: 'target',
    category: 'revenue'
  },
  {
    key: 'cost_target',
    label: 'Cost Target',
    icon: Target,
    unit: '$',
    type: 'target',
    category: 'revenue',
    isReversed: true
  },
  {
    key: 'workshops_target',
    label: 'Workshops',
    icon: Users,
    unit: '',
    type: 'target',
    category: 'business_development'
  },
  {
    key: 'advisory_target',
    label: 'Advisory Sessions',
    icon: Users,
    unit: '',
    type: 'target',
    category: 'business_development'
  },
  {
    key: 'lectures_target',
    label: 'Lectures',
    icon: Presentation,
    unit: '',
    type: 'target',
    category: 'business_development'
  },
  {
    key: 'pr_target',
    label: 'PR & Public Exposure',
    icon: Megaphone,
    unit: '',
    type: 'target',
    category: 'business_development'
  },
  {
    key: 'site_visits',
    label: 'Monthly Site Visits',
    icon: Eye,
    unit: '',
    type: 'snapshot',
    category: 'current_state'
  },
  {
    key: 'social_followers',
    label: 'Social Media Followers',
    icon: Share2,
    unit: '',
    type: 'snapshot',
    category: 'current_state'
  }
];

export const useTrackingData = (selectedMonth: string) => {
  const [monthlyGoals, setMonthlyGoals] = useState<MonthlyGoals | null>(null);
  const [monthlySnapshots, setMonthlySnapshots] = useState<MonthlySnapshots | null>(null);
  const [dailyProgress, setDailyProgress] = useState<DailyProgress[]>([]);
  const [todaysProgress, setTodaysProgress] = useState<DailyProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const today = new Date().toISOString().split('T')[0];

  // Load data from Supabase
  useEffect(() => {
    loadTrackingData();
  }, [selectedMonth]);

  const loadTrackingData = async () => {
    setLoading(true);
    try {
      // Load monthly goals
      const { data: goalsData, error: goalsError } = await supabase
        .from('monthly_goals')
        .select('*')
        .eq('user_id', 'default_user')
        .eq('month', selectedMonth)
        .maybeSingle();

      if (goalsError) throw goalsError;

      // Load monthly snapshots
      const { data: snapshotsData, error: snapshotsError } = await supabase
        .from('monthly_snapshots')
        .select('*')
        .eq('user_id', 'default_user')
        .eq('month', selectedMonth)
        .maybeSingle();

      if (snapshotsError) throw snapshotsError;

      // Load daily progress for the month
      const { data: progressData, error: progressError } = await supabase
        .from('daily_progress')
        .select('*')
        .eq('user_id', 'default_user')
        .eq('month', selectedMonth)
        .order('date', { ascending: false });

      if (progressError) throw progressError;

      // Load today's progress
      const { data: todayData, error: todayError } = await supabase
        .from('daily_progress')
        .select('*')
        .eq('user_id', 'default_user')
        .eq('date', today)
        .maybeSingle();

      if (todayError) throw todayError;

      setMonthlyGoals(goalsData);
      setMonthlySnapshots(snapshotsData);
      setDailyProgress(progressData || []);
      setTodaysProgress(todayData);
    } catch (error) {
      console.error('Error loading tracking data:', error);
      toast({
        title: "Error loading data",
        description: "Failed to load tracking data from database.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate progress for each metric
  const calculateProgress = (current: number, target: number, isReversed?: boolean): ProgressStatus => {
    if (target === 0) {
      return {
        status: current === 0 ? 'on-track' : 'ahead',
        percentage: current === 0 ? 0 : 100,
        trend: 'stable',
        message: target === 0 ? 'No target set' : 'Target achieved'
      };
    }

    const percentage = Math.min((current / target) * 100, 100);
    const effectivePercentage = isReversed ? Math.max(0, 100 - percentage) : percentage;
    
    let status: 'ahead' | 'on-track' | 'behind';
    let message: string;
    
    if (effectivePercentage >= 90) {
      status = 'ahead';
      message = isReversed ? 'Well under budget!' : 'Exceeding target!';
    } else if (effectivePercentage >= 70) {
      status = 'on-track';
      message = isReversed ? 'On budget' : 'On track';
    } else {
      status = 'behind';
      message = isReversed ? 'Over budget' : 'Needs attention';
    }

    return {
      status,
      percentage: effectivePercentage,
      trend: 'stable',
      message
    };
  };

  // Calculate metrics progress
  const metricsProgress = useMemo((): MetricProgress[] => {
    if (!monthlyGoals && !monthlySnapshots) return [];

    return METRIC_CONFIGS.map(config => {
      let current = 0;
      let target = 0;

      if (config.type === 'target' && monthlyGoals) {
        target = monthlyGoals[config.key as keyof MonthlyGoals] as number || 0;
        // Sum up progress from daily entries
        current = dailyProgress.reduce((sum, day) => 
          sum + ((day[config.key.replace('_target', '_progress') as keyof DailyProgress] as number) || 0), 0
        );
      } else if (config.type === 'snapshot' && monthlySnapshots) {
        current = monthlySnapshots[config.key as keyof MonthlySnapshots] as number || 0;
        target = current; // For snapshots, current is the target
      }

      const progress = calculateProgress(current, target, config.isReversed);
      const daysInMonth = new Date(parseInt(selectedMonth.split('-')[0]), parseInt(selectedMonth.split('-')[1]), 0).getDate();
      const dailyTarget = target / daysInMonth;

      return {
        name: config.label,
        key: config.key,
        current,
        target,
        dailyTarget,
        progress,
        icon: config.icon,
        unit: config.unit,
        type: config.type,
        category: config.category,
        isReversed: config.isReversed
      };
    });
  }, [monthlyGoals, monthlySnapshots, dailyProgress, selectedMonth]);

  // Update monthly goals
  const updateMonthlyGoals = async (updates: Partial<MonthlyGoals>) => {
    try {
      const { data, error } = await supabase
        .from('monthly_goals')
        .upsert({
          user_id: 'default_user',
          month: selectedMonth,
          ...monthlyGoals,
          ...updates
        }, {
          onConflict: 'user_id,month'
        })
        .select()
        .single();

      if (error) throw error;
      setMonthlyGoals(data);
      
      toast({
        title: "Goals updated",
        description: "Monthly goals have been saved successfully.",
      });
    } catch (error) {
      console.error('Error updating monthly goals:', error);
      toast({
        title: "Error",
        description: "Failed to update monthly goals.",
        variant: "destructive",
      });
    }
  };

  // Update monthly snapshots
  const updateMonthlySnapshots = async (updates: Partial<MonthlySnapshots>) => {
    try {
      const { data, error } = await supabase
        .from('monthly_snapshots')
        .upsert({
          user_id: 'default_user',
          month: selectedMonth,
          ...monthlySnapshots,
          ...updates
        }, {
          onConflict: 'user_id,month'
        })
        .select()
        .single();

      if (error) throw error;
      setMonthlySnapshots(data);
      
      toast({
        title: "Current state updated",
        description: "Monthly snapshots have been saved successfully.",
      });
    } catch (error) {
      console.error('Error updating monthly snapshots:', error);
      toast({
        title: "Error",
        description: "Failed to update monthly snapshots.",
        variant: "destructive",
      });
    }
  };

  // Update daily progress
  const updateDailyProgress = async (updates: Partial<DailyProgress>) => {
    try {
      const { data, error } = await supabase
        .from('daily_progress')
        .upsert({
          user_id: 'default_user',
          date: today,
          month: selectedMonth,
          ...todaysProgress,
          ...updates
        }, {
          onConflict: 'user_id,date'
        })
        .select()
        .single();

      if (error) throw error;
      setTodaysProgress(data);
      
      // Reload daily progress to update totals
      await loadTrackingData();
      
      toast({
        title: "Progress updated",
        description: "Daily progress has been saved successfully.",
      });
    } catch (error) {
      console.error('Error updating daily progress:', error);
      toast({
        title: "Error",
        description: "Failed to update daily progress.",
        variant: "destructive",
      });
    }
  };

  // Calculate overall score
  const overallScore = useMemo(() => {
    if (metricsProgress.length === 0) return 0;
    const avgPercentage = metricsProgress.reduce((sum, metric) => sum + metric.progress.percentage, 0) / metricsProgress.length;
    return Math.round(avgPercentage);
  }, [metricsProgress]);

  return {
    monthlyGoals,
    monthlySnapshots,
    dailyProgress,
    todaysProgress,
    metricsProgress,
    overallScore,
    loading,
    updateMonthlyGoals,
    updateMonthlySnapshots,
    updateDailyProgress,
    loadTrackingData,
    metricConfigs: METRIC_CONFIGS
  };
};