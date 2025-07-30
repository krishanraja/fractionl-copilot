import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DollarSign, Users, Eye, Share2, FileText, Target } from 'lucide-react';

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

interface GoalTrackerProps {
  goals: MonthlyGoals;
  onUpdateGoal: (field: keyof MonthlyGoals, value: number) => void;
}

export const GoalTracker = ({ goals, onUpdateGoal }: GoalTrackerProps) => {
  const goalFields = [
    {
      key: 'grossRevenue' as keyof MonthlyGoals,
      label: 'Gross Revenue ($)',
      icon: DollarSign,
      type: 'currency'
    },
    {
      key: 'totalCosts' as keyof MonthlyGoals,
      label: 'Total Costs ($)',
      icon: Target,
      type: 'currency'
    },
    {
      key: 'siteVisits' as keyof MonthlyGoals,
      label: 'Site Visits',
      icon: Eye,
      type: 'number'
    },
    {
      key: 'socialFollowers' as keyof MonthlyGoals,
      label: 'Social Media Followers',
      icon: Share2,
      type: 'number'
    },
    {
      key: 'prArticles' as keyof MonthlyGoals,
      label: 'PR Articles Published',
      icon: FileText,
      type: 'number'
    },
    {
      key: 'workshopCustomers' as keyof MonthlyGoals,
      label: 'Workshop Customers',
      icon: Users,
      type: 'number'
    },
    {
      key: 'advisoryCustomers' as keyof MonthlyGoals,
      label: 'Advisory Customers',
      icon: Users,
      type: 'number'
    }
  ];

  const handleInputChange = (field: keyof MonthlyGoals, value: string) => {
    const numValue = parseFloat(value) || 0;
    onUpdateGoal(field, numValue);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {goalFields.map(({ key, label, icon: Icon, type }) => (
        <div key={key} className="space-y-2">
          <Label htmlFor={key} className="flex items-center text-sm font-medium text-foreground">
            <Icon className="w-4 h-4 mr-2 text-primary" />
            {label}
          </Label>
          <Input
            id={key}
            type="number"
            value={goals[key] || 0}
            onChange={(e) => handleInputChange(key, e.target.value)}
            className="bg-input border-border text-foreground"
            min="0"
            step={type === 'currency' ? '100' : '1'}
          />
        </div>
      ))}
    </div>
  );
};