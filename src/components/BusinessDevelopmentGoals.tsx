import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, Megaphone, Presentation } from 'lucide-react';
import { MonthlyGoals } from '@/types/tracking';

interface BusinessDevelopmentGoalsProps {
  goals: MonthlyGoals | null;
  onUpdateGoals: (updates: Partial<MonthlyGoals>) => void;
  selectedMonth: string;
}

export const BusinessDevelopmentGoals = ({ goals, onUpdateGoals, selectedMonth }: BusinessDevelopmentGoalsProps) => {
  const handleInputChange = (field: keyof MonthlyGoals, value: string) => {
    const numValue = parseInt(value) || 0;
    onUpdateGoals({ [field]: numValue });
  };

  const formatMonth = (month: string) => {
    const [year, monthNum] = month.split('-');
    const date = new Date(parseInt(year), parseInt(monthNum) - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const goalFields = [
    {
      key: 'workshops_target' as keyof MonthlyGoals,
      label: 'Workshops',
      icon: Users,
      placeholder: '5'
    },
    {
      key: 'advisory_target' as keyof MonthlyGoals,
      label: 'Advisory Sessions',
      icon: Users,
      placeholder: '10'
    },
    {
      key: 'lectures_target' as keyof MonthlyGoals,
      label: 'Lectures',
      icon: Presentation,
      placeholder: '3'
    },
    {
      key: 'pr_target' as keyof MonthlyGoals,
      label: 'PR & Public Exposure',
      icon: Megaphone,
      placeholder: '8'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-xl text-foreground">
          <Users className="w-5 h-5 mr-2 text-primary" />
          Business Development Targets
        </CardTitle>
        <CardDescription>
          Set your business development goals for {formatMonth(selectedMonth)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {goalFields.map(({ key, label, icon: Icon, placeholder }) => (
            <div key={key} className="space-y-2">
              <Label htmlFor={key} className="flex items-center text-sm font-medium text-foreground">
                <Icon className="w-4 h-4 mr-2 text-primary" />
                {label}
              </Label>
              <Input
                id={key}
                type="number"
                value={goals?.[key] || 0}
                onChange={(e) => handleInputChange(key, e.target.value)}
                className="bg-input border-border text-foreground"
                min="0"
                step="1"
                placeholder={placeholder}
              />
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <div className="text-sm text-muted-foreground mb-2">Monthly Targets Summary:</div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between">
              <span>Total Events:</span>
              <span className="font-semibold">
                {((goals?.workshops_target || 0) + (goals?.lectures_target || 0))}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Total Sessions:</span>
              <span className="font-semibold">
                {((goals?.workshops_target || 0) + (goals?.advisory_target || 0) + (goals?.lectures_target || 0))}
              </span>
            </div>
            <div className="flex justify-between">
              <span>PR Pieces:</span>
              <span className="font-semibold">{goals?.pr_target || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Advisory:</span>
              <span className="font-semibold">{goals?.advisory_target || 0}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};