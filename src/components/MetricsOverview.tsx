import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign, Users, Eye, Target } from 'lucide-react';

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

interface MetricsOverviewProps {
  goals: MonthlyGoals;
}

export const MetricsOverview = ({ goals }: MetricsOverviewProps) => {
  const netProfit = goals.grossRevenue - goals.totalCosts;
  const profitMargin = goals.grossRevenue > 0 ? (netProfit / goals.grossRevenue) * 100 : 0;
  const conversionRate = goals.siteVisits > 0 ? ((goals.workshopCustomers + goals.advisoryCustomers) / goals.siteVisits) * 100 : 0;
  const revenuePerCustomer = (goals.workshopCustomers + goals.advisoryCustomers) > 0 ? goals.grossRevenue / (goals.workshopCustomers + goals.advisoryCustomers) : 0;

  const metrics = [
    {
      title: 'Net Profit',
      value: netProfit,
      format: 'currency',
      trend: netProfit > 0 ? 'up' : 'down',
      icon: DollarSign,
      description: `${profitMargin.toFixed(1)}% margin`
    },
    {
      title: 'Total Customers',
      value: goals.workshopCustomers + goals.advisoryCustomers,
      format: 'number',
      trend: 'up',
      icon: Users,
      description: `${goals.workshopCustomers} workshop, ${goals.advisoryCustomers} advisory`
    },
    {
      title: 'Conversion Rate',
      value: conversionRate,
      format: 'percentage',
      trend: conversionRate > 2 ? 'up' : 'down',
      icon: Target,
      description: 'Site visitors to customers'
    },
    {
      title: 'Revenue per Customer',
      value: revenuePerCustomer,
      format: 'currency',
      trend: 'up',
      icon: DollarSign,
      description: 'Average customer value'
    }
  ];

  const formatValue = (value: number, format: string) => {
    switch (format) {
      case 'currency':
        return `$${value.toLocaleString()}`;
      case 'percentage':
        return `${value.toFixed(2)}%`;
      default:
        return value.toLocaleString();
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric) => (
        <Card key={metric.title} className="border-border bg-card hover:bg-card/80 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">
              {metric.title}
            </CardTitle>
            <div className="flex items-center space-x-2">
              <metric.icon className="h-4 w-4 text-primary" />
              {metric.trend === 'up' ? (
                <TrendingUp className="h-3 w-3 text-success" />
              ) : (
                <TrendingDown className="h-3 w-3 text-destructive" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">
              {formatValue(metric.value, metric.format)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {metric.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};