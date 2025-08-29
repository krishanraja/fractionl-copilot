import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, Brain, Target, Settings, Calendar, Zap, LogOut, Sheet, Users } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { QuickAIInsight } from './QuickAIInsight';
import { AIStrategyHub } from './AIStrategyHub';
import { RevenueGoalsSetting } from './RevenueGoalsSetting';
import { BusinessDevelopmentGoals } from './BusinessDevelopmentGoals';
import { CurrentStateTracking } from './CurrentStateTracking';
import { DailyProgressTracker } from './DailyProgressTracker';
import { MetricsOverview } from './MetricsOverview';
import { CostTracker, Cost } from './CostTracker';
import { ProgressVisualization } from './ProgressVisualization';
import { MotivationalHeader } from './MotivationalHeader';
import { PipelineContent } from './PipelineContent';
import { GoogleSheetsIntegration } from './GoogleSheetsIntegration';
import { CustomerToolAnalytics } from './CustomerToolAnalytics';
import { useTrackingData } from '@/hooks/useTrackingData';
import { useCustomerAnalytics } from '@/hooks/useCustomerAnalytics';
import { generateFutureMonths } from '@/utils/monthUtils';

export const Dashboard = () => {
  const { signOut } = useAuth();
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [costs, setCosts] = useState<Record<string, Cost[]>>({});
  const [dashboardView, setDashboardView] = useState<'planning' | 'pipeline' | 'ai-strategy' | 'sheets' | 'customer-analytics'>('pipeline');
  
  const availableMonths = generateFutureMonths();

  // Use the new tracking data hook
  const {
    monthlyGoals,
    monthlySnapshots,
    dailyProgress,
    todaysProgress,
    metricsProgress,
    overallScore,
    loading,
    updateMonthlyGoals,
    updateMonthlySnapshots,
    updateDailyProgress
  } = useTrackingData(selectedMonth);
  const { toolAnalytics, leadInsights, loading: analyticsLoading } = useCustomerAnalytics(selectedMonth);

  const updateCosts = (newCosts: Cost[]) => {
    setCosts(prev => ({
      ...prev,
      [selectedMonth]: newCosts
    }));
  };

  const currentCosts = costs[selectedMonth] || [];
  const totalCosts = currentCosts.reduce((sum, cost) => sum + cost.amount, 0);


  const getMetricStatus = (current: number, target: number) => {
    const ratio = current / target;
    if (ratio >= 1.1) return { status: 'success', icon: TrendingUp, message: 'Exceeding target' };
    if (ratio >= 0.9) return { status: 'warning', icon: Target, message: 'On track' };
    return { status: 'destructive', icon: TrendingDown, message: 'Below target' };
  };

  const netProfit = (monthlyGoals?.revenue_forecast || 0) - totalCosts;
  const profitMargin = (monthlyGoals?.revenue_forecast || 0) > 0 ? (netProfit / (monthlyGoals?.revenue_forecast || 1)) * 100 : 0;

  // Format month for display
  const formatMonth = (month: string) => {
    const [year, monthNum] = month.split('-');
    const date = new Date(parseInt(year), parseInt(monthNum) - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Fixed Header with NYC Editorial styling */}
      <header className="sticky top-0 z-50 glass border-b border-border/50 backdrop-blur-sm">
        <div className="container-width">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg">
                  <Brain className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <img 
                    src="/lovable-uploads/30f9efde-5245-4c24-b26e-1e368f4a5a1b.png" 
                    alt="Fractionl.ai Logo" 
                    className="h-8 w-auto"
                  />
                  <p className="text-muted-foreground text-sm">AI Business Intelligence</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-52 glass border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass">
                  {availableMonths.map(month => (
                    <SelectItem key={month} value={month}>
                      {formatMonth(month)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* NYC Editorial Navigation */}
              <nav className="flex items-center bg-secondary/50 rounded-xl p-1 glass">
                <Button
                  variant={dashboardView === 'pipeline' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setDashboardView('pipeline')}
                  className="text-sm font-medium transition-all"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Pipeline
                </Button>
                <Button
                  variant={dashboardView === 'planning' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setDashboardView('planning')}
                  className="text-sm font-medium transition-all"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Planning
                </Button>
                <Button
                  variant={dashboardView === 'ai-strategy' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setDashboardView('ai-strategy')}
                  className="text-sm font-medium transition-all"
                >
                  <Brain className="w-4 h-4 mr-2" />
                  AI Strategy
                </Button>
                <Button
                  variant={dashboardView === 'sheets' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setDashboardView('sheets')}
                  className="text-sm font-medium transition-all"
                >
                  <Sheet className="w-4 h-4 mr-2" />
                  Sheets
                </Button>
                <Button
                  variant={dashboardView === 'customer-analytics' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setDashboardView('customer-analytics')}
                  className="text-sm font-medium transition-all"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Analytics
                </Button>
              </nav>
              
              <Button
                variant="outline"
                size="sm"
                onClick={signOut}
                className="glass border-border/50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content with NYC Editorial spacing */}
      <main className="section-padding">
        <div className="container-width space-y-12">

          {/* Hero Section for Pipeline View */}
          {dashboardView === 'pipeline' && !loading && (
            <section className="animate-fade-in-up">
              <MotivationalHeader
                streakData={{
                  currentStreak: dailyProgress.length,
                  bestStreak: dailyProgress.length,
                  totalDaysTracked: dailyProgress.length,
                  lastUpdated: new Date().toISOString()
                }}
                achievements={[]}
                overallScore={overallScore}
                todaysWins={3}
                monthProgress={85}
                motivationalMessage="Keep up the great work! Every step forward counts toward your success."
              />
            </section>
          )}

          {/* NYC Editorial Planning Section */}
          {dashboardView === 'planning' && !loading ? (
            <section className="space-y-16 animate-fade-in">
              <div className="text-center">
                <h1 className="headline-lg mb-6">Business Planning Hub</h1>
                <p className="body-lg text-muted-foreground max-w-2xl mx-auto">
                  Set your goals, track your progress, and build your path to success with precision and clarity.
                </p>
              </div>
              
              <div className="space-y-12">
                <RevenueGoalsSetting 
                  goals={monthlyGoals}
                  onUpdateGoals={updateMonthlyGoals}
                  selectedMonth={selectedMonth}
                />
                
                <BusinessDevelopmentGoals 
                  goals={monthlyGoals}
                  onUpdateGoals={updateMonthlyGoals}
                  selectedMonth={selectedMonth}
                />
                
                <CurrentStateTracking 
                  snapshots={monthlySnapshots}
                  onUpdateSnapshots={updateMonthlySnapshots}
                  selectedMonth={selectedMonth}
                />

                {/* Financial Overview with NYC Editorial Cards */}
                <div className="space-y-6">
                  <div className="text-center">
                    <h2 className="headline-md mb-4">Financial Overview</h2>
                    <p className="body-md text-muted-foreground">
                      Track your key financial metrics at a glance
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <Card className="card-hover border-0 shadow-sm glass">
                      <CardHeader className="pb-4">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Target className="w-5 h-5 text-primary" />
                          </div>
                          <CardTitle className="text-xl font-semibold">Revenue Target</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-primary mb-2">
                          ${(monthlyGoals?.revenue_forecast || 0).toLocaleString()}
                        </div>
                        <p className="text-muted-foreground">Monthly Goal</p>
                      </CardContent>
                    </Card>
                    
                    <Card className="card-hover border-0 shadow-sm glass">
                      <CardHeader className="pb-4">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 rounded-lg bg-warning/10">
                            <TrendingDown className="w-5 h-5 text-warning" />
                          </div>
                          <CardTitle className="text-xl font-semibold">Cost Budget</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-warning mb-2">
                          ${(monthlyGoals?.cost_budget || 0).toLocaleString()}
                        </div>
                        <p className="text-muted-foreground">Monthly Budget</p>
                      </CardContent>
                    </Card>
                    
                    <Card className="card-hover border-0 shadow-sm glass">
                      <CardHeader className="pb-4">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`p-2 rounded-lg ${netProfit >= 0 ? 'bg-success/10' : 'bg-destructive/10'}`}>
                            {netProfit >= 0 ? (
                              <TrendingUp className="w-5 h-5 text-success" />
                            ) : (
                              <TrendingDown className="w-5 h-5 text-destructive" />
                            )}
                          </div>
                          <CardTitle className="text-xl font-semibold">Net Profit</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className={`text-3xl font-bold mb-2 ${netProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
                          ${netProfit.toLocaleString()}
                        </div>
                        <p className="text-muted-foreground">
                          {profitMargin.toFixed(1)}% margin
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </section>
          ) : dashboardView === 'pipeline' && !loading ? (
            /* Pipeline View with NYC Editorial styling */
            <section className="animate-fade-in">
              <PipelineContent
                selectedMonth={selectedMonth}
                monthlyGoals={monthlyGoals}
              />
            </section>
          ) : dashboardView === 'ai-strategy' ? (
            /* AI Strategy Hub with NYC Editorial styling */
            <section className="animate-fade-in">
              <AIStrategyHub 
                currentMetrics={{
                  currentGoals: {
                    month: selectedMonth,
                    grossRevenue: monthlyGoals?.revenue_forecast || 0,
                    totalCosts: monthlyGoals?.cost_budget || 0,
                    siteVisits: monthlySnapshots?.site_visits || 0,
                    socialFollowers: monthlySnapshots?.social_followers || 0,
                    prArticles: monthlyGoals?.pr_target || 0,
                    workshopCustomers: monthlyGoals?.workshops_target || 0,
                    advisoryCustomers: monthlyGoals?.advisory_target || 0
                  },
                  todaysActuals: {
                    date: new Date().toISOString().split('T')[0],
                    month: selectedMonth,
                    grossRevenue: 0,
                    totalCosts: 0,
                    siteVisits: monthlySnapshots?.site_visits || 0,
                    socialFollowers: monthlySnapshots?.social_followers || 0,
                    prArticles: todaysProgress?.pr_progress || 0,
                    workshopCustomers: todaysProgress?.workshops_progress || 0,
                    advisoryCustomers: todaysProgress?.advisory_progress || 0
                  },
                  overallScore,
                  monthProgress: 85,
                  totalCosts,
                  netProfit,
                  profitMargin
                }}
                monthlyGoals={{
                  month: selectedMonth,
                  grossRevenue: monthlyGoals?.revenue_forecast || 0,
                  totalCosts: monthlyGoals?.cost_budget || 0,
                  siteVisits: monthlySnapshots?.site_visits || 0,
                  socialFollowers: monthlySnapshots?.social_followers || 0,
                  prArticles: monthlyGoals?.pr_target || 0,
                  workshopCustomers: monthlyGoals?.workshops_target || 0,
                  advisoryCustomers: monthlyGoals?.advisory_target || 0
                }}
              />
            </section>
          ) : dashboardView === 'sheets' ? (
            /* Google Sheets Integration with NYC Editorial styling */
            <section className="animate-fade-in">
              <div className="text-center mb-12">
                <h1 className="headline-lg mb-6">Data Integration Hub</h1>
                <p className="body-lg text-muted-foreground max-w-2xl mx-auto">
                  Seamlessly sync your business data with Google Sheets for advanced analysis and reporting.
                </p>
              </div>
              <GoogleSheetsIntegration selectedMonth={selectedMonth} />
            </section>
          ) : dashboardView === 'customer-analytics' ? (
            /* Customer Analytics with NYC Editorial styling */
            <section className="animate-fade-in">
              <div className="text-center mb-12">
                <h1 className="headline-lg mb-6">Customer Analytics</h1>
                <p className="body-lg text-muted-foreground max-w-2xl mx-auto">
                  Monitor usage and performance of your 4 customer-facing AI tools with detailed insights and metrics.
                </p>
              </div>
              <CustomerToolAnalytics 
                toolAnalytics={toolAnalytics}
                leadInsights={leadInsights}
                loading={analyticsLoading}
              />
            </section>
          ) : null}

          {loading && (
            <section className="flex items-center justify-center py-24">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <div className="body-md text-muted-foreground">Loading your business intelligence...</div>
              </div>
            </section>
          )}

        </div>
      </main>
    </div>
  );
};