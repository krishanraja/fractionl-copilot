// Redesigned data structures for the holistic goal tracking system

export interface MonthlyGoals {
  id?: string;
  user_id: string;
  month: string; // YYYY-MM format
  revenue_target: number;
  cost_target: number;
  workshops_target: number;
  advisory_target: number;
  lectures_target: number;
  pr_target: number;
  created_at?: string;
  updated_at?: string;
}

export interface MonthlySnapshots {
  id?: string;
  user_id: string;
  month: string; // YYYY-MM format
  site_visits: number;
  social_followers: number;
  created_at?: string;
  updated_at?: string;
}

export interface DailyProgress {
  id?: string;
  user_id: string;
  date: string; // YYYY-MM-DD format
  month: string; // YYYY-MM format
  revenue_progress: number;
  cost_progress: number;
  workshops_progress: number;
  advisory_progress: number;
  lectures_progress: number;
  pr_progress: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SpreadsheetSync {
  id?: string;
  user_id: string;
  google_sheet_id?: string;
  sync_enabled: boolean;
  sync_frequency: 'real-time' | 'hourly' | 'daily';
  last_sync_at?: string;
  sync_status: 'pending' | 'syncing' | 'success' | 'error';
  sync_error?: string;
  created_at?: string;
  updated_at?: string;
}

export interface MetricConfig {
  key: string;
  label: string;
  icon: any;
  unit: string;
  type: 'target' | 'snapshot';
  category: 'revenue' | 'business_development' | 'current_state';
  isReversed?: boolean; // For costs where lower is better
}

export interface ProgressStatus {
  status: 'ahead' | 'on-track' | 'behind';
  percentage: number;
  trend: 'up' | 'down' | 'stable';
  message: string;
}

export interface MetricProgress {
  name: string;
  key: string;
  current: number;
  target: number;
  dailyTarget: number;
  progress: ProgressStatus;
  icon: any;
  unit: string;
  type: 'target' | 'snapshot';
  category: string;
  isReversed?: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: any;
  unlocked: boolean;
  unlockedDate?: string;
  category: 'streak' | 'target' | 'growth' | 'milestone';
}

export interface StreakData {
  currentStreak: number;
  bestStreak: number;
  totalDaysTracked: number;
  lastUpdated: string;
}