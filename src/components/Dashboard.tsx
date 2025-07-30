import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, TrendingUp, TrendingDown, Brain, Target, DollarSign, Users, Eye, Share2, FileText, Lightbulb } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { AIInsightsPanel } from './AIInsightsPanel';
import { GoalTracker } from './GoalTracker';
import { MetricsOverview } from './MetricsOverview';

interface MonthlyGoals {
  month: string;
  grossRevenue: number;
  totalCosts: number;
  siteVisits: number;
  socialFollowers: number;
  prArticles: number;
  workshopCustomers: number;
  advisoryCustomers: number;
}

const MONTHS = [
  'Aug 2025', 'Sep 2025', 'Oct 2025', 'Nov 2025', 'Dec 2025',
  'Jan 2026', 'Feb 2026', 'Mar 2026', 'Apr 2026', 'May 2026', 'Jun 2026', 'Jul 2026'
];

export const Dashboard = () => {
  const [selectedMonth, setSelectedMonth] = useState('Aug 2025');
  const [goals, setGoals] = useState<Record<string, MonthlyGoals>>({});
  const [aiInsights, setAiInsights] = useState<string>('');
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);

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

  const getAIInsights = async () => {
    setIsLoadingInsights(true);
    try {
      // This will call our secure backend endpoint
      const response = await fetch('/api/ai/analyze-goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          monthlyData: currentGoals,
          allGoals: goals
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setAiInsights(data.insights);
      } else {
        setAiInsights('AI analysis temporarily unavailable. Please ensure backend is configured.');
      }
    } catch (error) {
      setAiInsights('Unable to connect to AI service. Backend integration required.');
    }
    setIsLoadingInsights(false);
  };

  const getMetricStatus = (current: number, target: number) => {
    const ratio = current / target;
    if (ratio >= 1.1) return { status: 'success', icon: TrendingUp, message: 'Exceeding target' };
    if (ratio >= 0.9) return { status: 'warning', icon: Target, message: 'On track' };
    return { status: 'destructive', icon: TrendingDown, message: 'Below target' };
  };

  const netProfit = currentGoals.grossRevenue - currentGoals.totalCosts;
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
              <h1 className="text-3xl font-bold text-foreground">Fractionl.ai</h1>
              <p className="text-muted-foreground">AI Business Intelligence Dashboard</p>
            </div>
          </div>
          <Button 
            onClick={getAIInsights} 
            disabled={isLoadingInsights}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Brain className="w-4 h-4 mr-2" />
            {isLoadingInsights ? 'Analyzing...' : 'Get AI Insights'}
          </Button>
        </div>

        {/* Month Selection */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center text-card-foreground">
              <Target className="w-5 h-5 mr-2 text-primary" />
              Monthly Goal Tracker
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

        {/* Metrics Overview */}
        <MetricsOverview goals={currentGoals} />

        <Tabs defaultValue="analytics" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 bg-muted">
            <TabsTrigger value="analytics" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Analytics Dashboard
            </TabsTrigger>
            <TabsTrigger value="insights" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              AI Insights
            </TabsTrigger>
            <TabsTrigger value="projections" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Strategic Projections
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

          <TabsContent value="insights">
            <AIInsightsPanel 
              insights={aiInsights}
              isLoading={isLoadingInsights}
              onRefresh={getAIInsights}
              goals={currentGoals}
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
      </div>
    </div>
  );
};