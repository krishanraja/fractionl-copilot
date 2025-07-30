import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, AlertTriangle, TrendingUp, Lightbulb, RefreshCw } from 'lucide-react';

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

interface AIInsightsPanelProps {
  insights: string;
  isLoading: boolean;
  onRefresh: () => void;
  goals: MonthlyGoals;
}

export const AIInsightsPanel = ({ insights, isLoading, onRefresh, goals }: AIInsightsPanelProps) => {
  const netProfit = goals.grossRevenue - goals.totalCosts;
  const profitMargin = goals.grossRevenue > 0 ? (netProfit / goals.grossRevenue) * 100 : 0;
  const conversionRate = goals.siteVisits > 0 ? ((goals.workshopCustomers + goals.advisoryCustomers) / goals.siteVisits) * 100 : 0;

  // Generate smart warnings based on metrics
  const getSmartWarnings = () => {
    const warnings = [];
    
    if (profitMargin < 20) {
      warnings.push({
        type: 'critical',
        title: 'Low Profit Margin',
        message: `${profitMargin.toFixed(1)}% margin is below healthy 20% threshold`,
        icon: AlertTriangle
      });
    }
    
    if (conversionRate < 1) {
      warnings.push({
        type: 'warning',
        title: 'Low Conversion Rate',
        message: `${conversionRate.toFixed(2)}% conversion rate suggests optimization opportunities`,
        icon: TrendingUp
      });
    }
    
    if (goals.advisoryCustomers < goals.workshopCustomers * 0.1) {
      warnings.push({
        type: 'opportunity',
        title: 'Advisory Upsell Potential',
        message: 'Low advisory conversion suggests upselling opportunity from workshops',
        icon: Lightbulb
      });
    }

    return warnings;
  };

  const warnings = getSmartWarnings();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* AI Analysis */}
      <Card className="lg:col-span-2 border-border bg-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Brain className="w-5 h-5 text-primary animate-glow-pulse" />
              <CardTitle className="text-card-foreground">AI Strategic Analysis</CardTitle>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRefresh} 
              disabled={isLoading}
              className="border-border hover:bg-muted"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          <CardDescription>
            AI-powered insights and recommendations for {goals.month}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Brain className="w-5 h-5 animate-pulse" />
                <span>AI analyzing your business metrics...</span>
              </div>
            </div>
          ) : insights ? (
            <div className="prose prose-sm max-w-none">
              <div className="bg-muted/30 rounded-lg p-4 border border-border">
                <p className="text-card-foreground leading-relaxed whitespace-pre-wrap">
                  {insights}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center p-8 text-muted-foreground">
              <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Click "Get AI Insights" to receive strategic analysis</p>
              <p className="text-sm mt-2">AI will analyze your metrics and provide actionable recommendations</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Smart Alerts */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center text-card-foreground">
            <AlertTriangle className="w-5 h-5 mr-2 text-warning" />
            Smart Alerts
          </CardTitle>
          <CardDescription>
            Automated insights from your metrics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {warnings.length > 0 ? (
            warnings.map((warning, index) => (
              <div key={index} className={`p-3 rounded-lg border ${
                warning.type === 'critical' ? 'border-destructive/20 bg-destructive/5' :
                warning.type === 'warning' ? 'border-warning/20 bg-warning/5' :
                'border-success/20 bg-success/5'
              }`}>
                <div className="flex items-start space-x-2">
                  <warning.icon className={`w-4 h-4 mt-0.5 ${
                    warning.type === 'critical' ? 'text-destructive' :
                    warning.type === 'warning' ? 'text-warning' :
                    'text-success'
                  }`} />
                  <div className="flex-1">
                    <h4 className="font-medium text-card-foreground text-sm">
                      {warning.title}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {warning.message}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center p-4">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 text-success" />
              <p className="text-sm text-muted-foreground">All metrics looking healthy!</p>
            </div>
          )}

          {/* Quick Metrics */}
          <div className="space-y-2 pt-4 border-t border-border">
            <h4 className="font-medium text-card-foreground text-sm">Quick Metrics</h4>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Profit Margin</span>
                <Badge variant={profitMargin > 20 ? "default" : "destructive"} className="text-xs">
                  {profitMargin.toFixed(1)}%
                </Badge>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Conversion Rate</span>
                <Badge variant={conversionRate > 2 ? "default" : "secondary"} className="text-xs">
                  {conversionRate.toFixed(2)}%
                </Badge>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Customer Mix</span>
                <Badge variant="outline" className="text-xs">
                  {goals.workshopCustomers}W / {goals.advisoryCustomers}A
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};