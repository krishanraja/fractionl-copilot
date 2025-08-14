import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { CalendarDays, Save, DollarSign, Users, Megaphone, Presentation, Target } from 'lucide-react';
import { DailyProgress } from '@/types/tracking';

interface DailyProgressTrackerProps {
  todaysProgress: DailyProgress | null;
  onUpdateProgress: (updates: Partial<DailyProgress>) => void;
}

export const DailyProgressTracker = ({ todaysProgress, onUpdateProgress }: DailyProgressTrackerProps) => {
  const [formData, setFormData] = useState<Partial<DailyProgress>>(todaysProgress || {});

  const progressFields = [
    {
      key: 'revenue_progress' as keyof DailyProgress,
      label: 'Revenue Generated Today',
      icon: DollarSign,
      type: 'currency',
      placeholder: '500'
    },
    {
      key: 'cost_progress' as keyof DailyProgress,
      label: 'Costs Incurred Today',
      icon: Target,
      type: 'currency',
      placeholder: '200'
    },
    {
      key: 'workshops_progress' as keyof DailyProgress,
      label: 'Workshops Completed',
      icon: Users,
      type: 'number',
      placeholder: '1'
    },
    {
      key: 'advisory_progress' as keyof DailyProgress,
      label: 'Advisory Sessions',
      icon: Users,
      type: 'number',
      placeholder: '2'
    },
    {
      key: 'lectures_progress' as keyof DailyProgress,
      label: 'Lectures Given',
      icon: Presentation,
      type: 'number',
      placeholder: '1'
    },
    {
      key: 'pr_progress' as keyof DailyProgress,
      label: 'PR Activities',
      icon: Megaphone,
      type: 'number',
      placeholder: '1'
    }
  ];

  const handleInputChange = (field: keyof DailyProgress, value: string) => {
    const numValue = field === 'notes' ? value : (parseFloat(value) || 0);
    setFormData(prev => ({ ...prev, [field]: numValue }));
  };

  const handleSave = () => {
    onUpdateProgress(formData);
  };

  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-xl text-foreground">
          <CalendarDays className="w-5 h-5 mr-2 text-primary" />
          Today's Progress
        </CardTitle>
        <CardDescription>
          Track your daily achievements - {today}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {progressFields.map(({ key, label, icon: Icon, type, placeholder }) => (
            <div key={key} className="space-y-2">
              <Label htmlFor={key} className="flex items-center text-sm font-medium text-foreground">
                <Icon className="w-4 h-4 mr-2 text-primary" />
                {label}
              </Label>
              <Input
                id={key}
                type="number"
                value={formData[key] || 0}
                onChange={(e) => handleInputChange(key, e.target.value)}
                className="bg-input border-border text-foreground"
                min="0"
                step={type === 'currency' ? '50' : '1'}
                placeholder={placeholder}
              />
            </div>
          ))}
        </div>

        <Separator />

        <div className="space-y-2">
          <Label htmlFor="notes" className="text-sm font-medium text-foreground">
            Notes & Reflections
          </Label>
          <Textarea
            id="notes"
            value={formData.notes || ''}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            className="bg-input border-border text-foreground min-h-[100px]"
            placeholder="Add any notes about today's activities, challenges, or wins..."
          />
        </div>

        <div className="flex justify-between items-center pt-4">
          <div className="text-sm text-muted-foreground">
            {todaysProgress ? 'Last updated: ' + new Date(todaysProgress.updated_at || '').toLocaleTimeString() : 'No data saved yet today'}
          </div>
          <Button 
            onClick={handleSave} 
            className="flex items-center"
            variant="default"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Progress
          </Button>
        </div>

        {/* Daily Summary */}
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <div className="text-sm font-medium text-foreground mb-2">Today's Summary</div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Net Profit:</span>
              <span className="font-semibold text-foreground">
                ${((formData.revenue_progress || 0) - (formData.cost_progress || 0)).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Activities:</span>
              <span className="font-semibold text-foreground">
                {((formData.workshops_progress || 0) + (formData.advisory_progress || 0) + (formData.lectures_progress || 0) + (formData.pr_progress || 0))} total
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};