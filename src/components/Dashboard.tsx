import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, Brain, Target, Settings, Calendar, Zap } from 'lucide-react';
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
import { useTrackingData } from '@/hooks/useTrackingData';

const MONTHS = [
  '2024-08', '2024-09', '2024-10', '2024-11', '2024-12',
  '2025-01', '2025-02', '2025-03', '2025-04', '2025-05', '2025-06', '2025-07'
];

export const Dashboard = () => {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [costs, setCosts] = useState<Record<string, Cost[]>>({});
  const [dashboardView, setDashboardView] = useState<'planning' | 'tracking' | 'ai-strategy'>('tracking');

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
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center animate-glow-pulse">
              <Brain className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <img 
                src="/lovable-uploads/30f9efde-5245-4c24-b26e-1e368f4a5a1b.png" 
                alt="Fractionl.ai Logo" 
                className="h-8 w-auto"
              />
              <p className="text-muted-foreground">AI Business Intelligence Dashboard</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-48 bg-input border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {metricsProgress.length > 0 ? 
                  // Use available months from tracking data hook
                  ['2025-01', '2025-02', '2025-03', '2025-04', '2025-05', '2025-06', '2025-07', '2025-08', '2025-09', '2025-10', '2025-11', '2025-12'].map(month => (
                    <SelectItem key={month} value={month}>
                      {formatMonth(month)}
                    </SelectItem>
                  )) : 
                  // Fallback for loading state
                  MONTHS.map(month => (
                    <SelectItem key={month} value={month}>
                      {formatMonth(month)}
                    </SelectItem>
                  ))
                }
              </SelectContent>
            </Select>
            
            {/* View Toggle */}
            <div className="flex items-center bg-muted rounded-lg p-1">
              <Button
                variant={dashboardView === 'tracking' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setDashboardView('tracking')}
                className="text-xs"
              >
                <Zap className="w-3 h-3 mr-1" />
                Daily Tracking
              </Button>
              <Button
                variant={dashboardView === 'planning' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setDashboardView('planning')}
                className="text-xs"
              >
                <Settings className="w-3 h-3 mr-1" />
                Planning
              </Button>
              <Button
                variant={dashboardView === 'ai-strategy' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setDashboardView('ai-strategy')}
                className="text-xs"
              >
                <Brain className="w-3 h-3 mr-1" />
                AI Strategy
              </Button>
            </div>
          </div>
        </div>

        {/* Motivational Header - Only show in tracking view */}
        {dashboardView === 'tracking' && !loading && (
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
        )}

        {/* Dynamic Content Based on View */}
        {dashboardView === 'planning' && !loading ? (
          /* Planning View */
          <div className="space-y-8">
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

            {/* Financial Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Revenue Target</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    ${(monthlyGoals?.revenue_forecast || 0).toLocaleString()}
                  </div>
                  <p className="text-sm text-muted-foreground">Monthly Goal</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Cost Budget</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    ${(monthlyGoals?.cost_budget || 0).toLocaleString()}
                  </div>
                  <p className="text-sm text-muted-foreground">Monthly Budget</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Net Profit</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${netProfit.toLocaleString()}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {profitMargin.toFixed(1)}% margin
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : dashboardView === 'tracking' && !loading ? (
          /* Daily Tracking View */
          <div className="space-y-6">
            <QuickAIInsight currentMetrics={{
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
                grossRevenue: 0, // Revenue is now tracked separately
                totalCosts: 0, // Costs are now tracked separately
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
            }} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <DailyProgressTracker 
                todaysProgress={todaysProgress}
                onUpdateProgress={updateDailyProgress}
              />
              
              <CurrentStateTracking 
                snapshots={monthlySnapshots}
                onUpdateSnapshots={updateMonthlySnapshots}
                selectedMonth={selectedMonth}
              />
            </div>

            <ProgressVisualization 
              metrics={metricsProgress}
            />
          </div>
        ) : dashboardView === 'ai-strategy' ? (
          /* AI Strategy Hub */
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
                grossRevenue: 0, // Revenue is now tracked separately
                totalCosts: 0, // Costs are now tracked separately
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
        ) : null}

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-lg text-muted-foreground">Loading tracking data...</div>
          </div>
        )}

        {/* Metrics Overview - Only show in tracking view */}
        {dashboardView === 'tracking' && !loading && (
          <MetricsOverview goals={{
            month: selectedMonth,
            grossRevenue: monthlyGoals?.revenue_forecast || 0,
            totalCosts: monthlyGoals?.cost_budget || 0,
            siteVisits: monthlySnapshots?.site_visits || 0,
            socialFollowers: monthlySnapshots?.social_followers || 0,
            prArticles: monthlyGoals?.pr_target || 0,
            workshopCustomers: monthlyGoals?.workshops_target || 0,
            advisoryCustomers: monthlyGoals?.advisory_target || 0
          }} />
        )}

        {/* Analytics Tabs - Only show in tracking view */}
        {dashboardView === 'tracking' && !loading && (
          <Tabs defaultValue="analytics" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 bg-muted">
            <TabsTrigger value="analytics" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Analytics
            </TabsTrigger>
            <TabsTrigger value="costs" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Cost Tracking
            </TabsTrigger>
            <TabsTrigger value="projections" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Projections
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="space-y-4">
            {/* Charts and Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-card-foreground">Revenue vs Costs Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={[
                      { month: 'Jan', revenue: 8500, costs: 2800 },
                      { month: 'Feb', revenue: 9200, costs: 3100 },
                      { month: 'Current', revenue: monthlyGoals?.revenue_forecast || 0, costs: monthlyGoals?.cost_budget || 0 }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={3}
                        name="Revenue"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="costs" 
                        stroke="hsl(var(--destructive))" 
                        strokeWidth={3}
                        name="Costs"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-card-foreground">Business Development Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={[
                      { category: 'Workshops', target: monthlyGoals?.workshops_target || 0, current: dailyProgress.reduce((sum, day) => sum + (day.workshops_progress || 0), 0) },
                      { category: 'Advisory', target: monthlyGoals?.advisory_target || 0, current: dailyProgress.reduce((sum, day) => sum + (day.advisory_progress || 0), 0) },
                      { category: 'Lectures', target: monthlyGoals?.lectures_target || 0, current: dailyProgress.reduce((sum, day) => sum + (day.lectures_progress || 0), 0) },
                      { category: 'PR', target: monthlyGoals?.pr_target || 0, current: dailyProgress.reduce((sum, day) => sum + (day.pr_progress || 0), 0) }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="category" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }} 
                      />
                      <Bar dataKey="target" fill="hsl(var(--muted))" name="Target" />
                      <Bar dataKey="current" fill="hsl(var(--primary))" name="Current" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="costs">
            <CostTracker 
              costs={currentCosts}
              onUpdateCosts={updateCosts}
            />
          </TabsContent>


          <TabsContent value="projections">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center text-card-foreground">
                  <Target className="w-5 h-5 mr-2 text-primary" />
                  Monthly Projections
                </CardTitle>
                <CardDescription>
                  Performance insights and forecasting
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold text-lg">Revenue Projection</h4>
                      <p className="text-2xl font-bold text-primary">
                        ${Math.round((monthlyGoals?.revenue_forecast || 0) * (overallScore / 100)).toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Based on current progress ({overallScore}%)
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold text-lg">Growth Rate</h4>
                      <p className="text-2xl font-bold text-green-600">
                        +{((overallScore - 70) / 70 * 100).toFixed(1)}%
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Compared to baseline performance
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        )}
      </div>
    </div>
  );
};