import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DollarSign, Target } from 'lucide-react';
import { MonthlyGoals } from '@/types/tracking';

interface RevenueGoalsSettingProps {
  goals: MonthlyGoals | null;
  onUpdateGoals: (updates: Partial<MonthlyGoals>) => void;
  selectedMonth: string;
}

export const RevenueGoalsSetting = ({ goals, onUpdateGoals, selectedMonth }: RevenueGoalsSettingProps) => {
  const handleInputChange = (field: keyof MonthlyGoals, value: string) => {
    const numValue = parseFloat(value) || 0;
    onUpdateGoals({ [field]: numValue });
  };

  const formatMonth = (month: string) => {
    const [year, monthNum] = month.split('-');
    const date = new Date(parseInt(year), parseInt(monthNum) - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-xl text-foreground">
          <DollarSign className="w-5 h-5 mr-2 text-primary" />
          Revenue & Cost Planning
        </CardTitle>
        <CardDescription>
          Set your financial targets for {formatMonth(selectedMonth)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="revenue_forecast" className="flex items-center text-sm font-medium text-foreground">
              <DollarSign className="w-4 h-4 mr-2 text-primary" />
              Monthly Revenue Forecast
            </Label>
            <Input
              id="revenue_forecast"
              type="number"
              value={goals?.revenue_forecast || 0}
              onChange={(e) => handleInputChange('revenue_forecast', e.target.value)}
              className="bg-input border-border text-foreground"
              min="0"
              step="100"
              placeholder="10000"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="cost_budget" className="flex items-center text-sm font-medium text-foreground">
              <Target className="w-4 h-4 mr-2 text-primary" />
              Monthly Cost Budget
            </Label>
            <Input
              id="cost_budget"
              type="number"
              value={goals?.cost_budget || 0}
              onChange={(e) => handleInputChange('cost_budget', e.target.value)}
              className="bg-input border-border text-foreground"
              min="0"
              step="100"
              placeholder="5000"
            />
          </div>
        </div>
        
        <div className="mt-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Projected Net Profit:</span>
            <span className="font-semibold text-foreground">
              ${((goals?.revenue_forecast || 0) - (goals?.cost_budget || 0)).toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm mt-1">
            <span className="text-muted-foreground">Profit Margin:</span>
            <span className="font-semibold text-foreground">
              {goals?.revenue_forecast && goals.revenue_forecast > 0 
                ? (((goals.revenue_forecast - (goals.cost_budget || 0)) / goals.revenue_forecast) * 100).toFixed(1)
                : 0}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};