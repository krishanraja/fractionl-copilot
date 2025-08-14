import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, Share2, TrendingUp } from 'lucide-react';
import { MonthlySnapshots } from '@/types/tracking';

interface CurrentStateTrackingProps {
  snapshots: MonthlySnapshots | null;
  onUpdateSnapshots: (updates: Partial<MonthlySnapshots>) => void;
  selectedMonth: string;
}

export const CurrentStateTracking = ({ snapshots, onUpdateSnapshots, selectedMonth }: CurrentStateTrackingProps) => {
  const handleInputChange = (field: keyof MonthlySnapshots, value: string) => {
    const numValue = parseInt(value) || 0;
    onUpdateSnapshots({ [field]: numValue });
  };

  const formatMonth = (month: string) => {
    const [year, monthNum] = month.split('-');
    const date = new Date(parseInt(year), parseInt(monthNum) - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const stateFields = [
    {
      key: 'site_visits' as keyof MonthlySnapshots,
      label: 'Monthly Site Visits',
      icon: Eye,
      placeholder: '5000',
      description: 'Total unique visitors this month'
    },
    {
      key: 'social_followers' as keyof MonthlySnapshots,
      label: 'Social Media Followers',
      icon: Share2,
      placeholder: '1500',
      description: 'Combined followers across platforms'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-xl text-foreground">
          <TrendingUp className="w-5 h-5 mr-2 text-primary" />
          Current State Tracking
        </CardTitle>
        <CardDescription>
          Update your current metrics for {formatMonth(selectedMonth)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {stateFields.map(({ key, label, icon: Icon, placeholder, description }) => (
            <div key={key} className="space-y-2">
              <Label htmlFor={key} className="flex items-center text-sm font-medium text-foreground">
                <Icon className="w-4 h-4 mr-2 text-primary" />
                {label}
              </Label>
              <Input
                id={key}
                type="number"
                value={snapshots?.[key] || 0}
                onChange={(e) => handleInputChange(key, e.target.value)}
                className="bg-input border-border text-foreground"
                min="0"
                step="1"
                placeholder={placeholder}
              />
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center text-sm text-muted-foreground mb-2">
            <TrendingUp className="w-4 h-4 mr-2" />
            Growth Metrics
          </div>
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="flex justify-between">
              <span>Digital Reach:</span>
              <span className="font-semibold">
                {((snapshots?.site_visits || 0) + (snapshots?.social_followers || 0)).toLocaleString()} total
              </span>
            </div>
            <div className="flex justify-between">
              <span>Engagement Ratio:</span>
              <span className="font-semibold">
                {snapshots?.site_visits && snapshots.site_visits > 0 
                  ? ((snapshots.social_followers || 0) / snapshots.site_visits * 100).toFixed(1)
                  : 0}%
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};