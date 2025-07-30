import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, TrendingUp, TrendingDown, Brain, Target, DollarSign, Users, Eye, Share2, FileText, Lightbulb, Calendar, Zap } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { QuickAIInsight } from './QuickAIInsight';
import { AIStrategyHub } from './AIStrategyHub';
import { GoalTracker } from './GoalTracker';
import { MetricsOverview } from './MetricsOverview';
import { CostTracker, Cost } from './CostTracker';
import { DailyTracker } from './DailyTracker';
import { ProgressVisualization } from './ProgressVisualization';
import { MotivationalHeader } from './MotivationalHeader';
import { useProgressTracking } from '@/hooks/useProgressTracking';
import { MonthlyGoals } from '@/types/dashboard';

// MonthlyGoals interface moved to types/dashboard.ts

const MONTHS = [
  'Aug 2025', 'Sep 2025', 'Oct 2025', 'Nov 2025', 'Dec 2025',
  'Jan 2026', 'Feb 2026', 'Mar 2026', 'Apr 2026', 'May 2026', 'Jun 2026', 'Jul 2026'
];

export const Dashboard = () => {
  const [selectedMonth, setSelectedMonth] = useState('Aug 2025');
  const [goals, setGoals] = useState<Record<string, MonthlyGoals>>({});
  const [costs, setCosts] = useState<Record<string, Cost[]>>({});
  const [dashboardView, setDashboardView] = useState<'goals' | 'tracking' | 'ai-strategy'>('tracking');

  // Initialize default goals for all months
  useEffect(() => {
    const defaultGoals: Record<string, MonthlyGoals> = {};
    MONTHS.forEach(month => {
      defaultGoals[month] = {
        month,
        grossRevenue: 50000,
        totalCosts: 30000,
        siteVisits: 10000,
        socialFollowers: 5000,
        prArticles: 5,
        workshopCustomers: 100,
        advisoryCustomers: 10
      };
    });
    setGoals(defaultGoals);
  }, []);

  const currentGoals = goals[selectedMonth] || {
    month: selectedMonth,
    grossRevenue: 0,
    totalCosts: 0,
    siteVisits: 0,
    socialFollowers: 0,
    prArticles: 0,
    workshopCustomers: 0,
    advisoryCustomers: 0
  };

  const updateGoal = (field: keyof MonthlyGoals, value: number | string) => {
    setGoals(prev => ({
      ...prev,
      [selectedMonth]: {
        ...prev[selectedMonth],
        [field]: value
      }
    }));
  };

  const updateCosts = (newCosts: Cost[]) => {
    setCosts(prev => ({
      ...prev,
      [selectedMonth]: newCosts
    }));
  };

  const currentCosts = costs[selectedMonth] || [];
  const totalCosts = currentCosts.reduce((sum, cost) => sum + cost.amount, 0);

  // Initialize progress tracking
  const {
    todaysActuals,
    metricsProgress,
    streakData,
    achievements,
    overallScore,
    motivationalMessage,
    todaysWins,
    monthProgress,
    updateDailyActuals,
  } = useProgressTracking(currentGoals);


  const getMetricStatus = (current: number, target: number) => {
    const ratio = current / target;
    if (ratio >= 1.1) return { status: 'success', icon: TrendingUp, message: 'Exceeding target' };
    if (ratio >= 0.9) return { status: 'warning', icon: Target, message: 'On track' };
    return { status: 'destructive', icon: TrendingDown, message: 'Below target' };
  };

  const netProfit = currentGoals.grossRevenue - totalCosts;
  const profitMargin = currentGoals.grossRevenue > 0 ? (netProfit / currentGoals.grossRevenue) * 100 : 0;

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
                variant={dashboardView === 'goals' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setDashboardView('goals')}
                className="text-xs"
              >
                <Target className="w-3 h-3 mr-1" />
                Goal Setting
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
        {dashboardView === 'tracking' && (
          <MotivationalHeader
            streakData={streakData}
            achievements={achievements}
            overallScore={overallScore}
            todaysWins={todaysWins}
            monthProgress={monthProgress}
            motivationalMessage={motivationalMessage}
          />
        )}

        {/* Dynamic Content Based on View */}
        {dashboardView === 'goals' ? (
          /* Goal Setting View */
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center text-card-foreground">
                <Target className="w-5 h-5 mr-2 text-primary" />
                Monthly Goal Setting
              </CardTitle>
              <CardDescription>Select month and set your business targets (Aug 2025 - Jul 2026)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4 mb-6">
                <Label htmlFor="month-select" className="text-sm font-medium">Month:</Label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-48 bg-input border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map(month => (
                      <SelectItem key={month} value={month}>{month}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Badge variant="outline" className="ml-auto">
                  Net Profit: ${netProfit.toLocaleString()} ({profitMargin.toFixed(1)}%)
                </Badge>
              </div>

              <GoalTracker 
                goals={currentGoals}
                onUpdateGoal={updateGoal}
              />
            </CardContent>
          </Card>
        ) : dashboardView === 'tracking' ? (
          /* Daily Tracking View */
          <div className="space-y-6">
            {/* Month Selection Bar */}
            <div className="flex items-center justify-between bg-card border border-border rounded-lg p-4">
              <div className="flex items-center space-x-4">
                <Label htmlFor="month-select" className="text-sm font-medium">Tracking Month:</Label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-48 bg-input border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map(month => (
                      <SelectItem key={month} value={month}>{month}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Badge variant="outline" className="ml-auto">
                Net Profit: ${netProfit.toLocaleString()} ({profitMargin.toFixed(1)}%)
              </Badge>
            </div>

            {/* Quick AI Insight */}
            <QuickAIInsight currentMetrics={{
              currentGoals,
              todaysActuals,
              overallScore,
              monthProgress,
              totalCosts,
              netProfit,
              profitMargin
            }} />

            {/* Daily Tracker */}
            <DailyTracker
              currentGoals={currentGoals}
              dailyActuals={todaysActuals}
              onUpdateDaily={updateDailyActuals}
            />

            {/* Progress Visualization */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">Today's Progress</h3>
              </div>
              <ProgressVisualization metrics={metricsProgress} />
            </div>
          </div>
        ) : (
          /* AI Strategy Hub */
          <AIStrategyHub 
            currentMetrics={{
              currentGoals,
              todaysActuals,
              overallScore,
              monthProgress,
              totalCosts,
              netProfit,
              profitMargin
            }}
            monthlyGoals={currentGoals}
          />
        )}

        {/* Metrics Overview - Only show in tracking view */}
        {dashboardView === 'tracking' && <MetricsOverview goals={currentGoals} />}

        {/* Analytics Tabs - Only show in tracking view */}
        {dashboardView === 'tracking' && (
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
                    <LineChart data={Object.values(goals).slice(0, 6)}>
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
                        dataKey="grossRevenue" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={3}
                        name="Revenue"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="totalCosts" 
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
                  <CardTitle className="text-card-foreground">Customer Acquisition</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={Object.values(goals).slice(0, 6)}>
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
                      <Bar dataKey="workshopCustomers" fill="hsl(var(--primary))" name="Workshop" />
                      <Bar dataKey="advisoryCustomers" fill="hsl(var(--accent))" name="Advisory" />
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
                  <Lightbulb className="w-5 h-5 mr-2 text-primary" />
                  Strategic Business Projections
                </CardTitle>
                <CardDescription>
                  AI-powered forecasting and strategic recommendations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-muted/50 border border-border">
                    <h4 className="font-semibold text-foreground mb-2">12-Month Revenue Projection</h4>
                    <p className="text-muted-foreground text-sm">
                      Based on current growth patterns, projected annual revenue: ${(currentGoals.grossRevenue * 12).toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50 border border-border">
                    <h4 className="font-semibold text-foreground mb-2">Customer Lifetime Value</h4>
                    <p className="text-muted-foreground text-sm">
                      Workshop CLV: ${((currentGoals.grossRevenue * 0.6) / currentGoals.workshopCustomers * 6).toFixed(0)} | 
                      Advisory CLV: ${((currentGoals.grossRevenue * 0.4) / currentGoals.advisoryCustomers * 12).toFixed(0)}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50 border border-border">
                    <h4 className="font-semibold text-foreground mb-2">Market Opportunity</h4>
                    <p className="text-muted-foreground text-sm">
                      Site conversion rate: {((currentGoals.workshopCustomers + currentGoals.advisoryCustomers) / currentGoals.siteVisits * 100).toFixed(2)}% - 
                      Industry benchmark: 2-3%
                    </p>
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