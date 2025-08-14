import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Target, Flame, Zap, Calendar, TrendingUp } from 'lucide-react';
import { StreakData, Achievement } from '@/types/tracking';

interface MotivationalHeaderProps {
  streakData: StreakData;
  achievements: Achievement[];
  overallScore: number;
  todaysWins: number;
  monthProgress: number;
  motivationalMessage: string;
}

export const MotivationalHeader = ({ 
  streakData, 
  achievements, 
  overallScore, 
  todaysWins,
  monthProgress,
  motivationalMessage 
}: MotivationalHeaderProps) => {
  const unlockedAchievements = achievements.filter(a => a.unlocked);
  const recentAchievements = unlockedAchievements
    .sort((a, b) => new Date(b.unlockedDate || '').getTime() - new Date(a.unlockedDate || '').getTime())
    .slice(0, 3);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-success/20 border-success/30';
    if (score >= 60) return 'bg-warning/20 border-warning/30';
    return 'bg-destructive/20 border-destructive/30';
  };

  return (
    <Card className="border-border bg-gradient-to-r from-card to-card/50 shadow-lg">
      <CardContent className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Performance Score & Message */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center space-x-4">
              <div className={`flex items-center justify-center w-16 h-16 rounded-full border-2 ${getScoreBg(overallScore)}`}>
                <span className={`text-2xl font-bold ${getScoreColor(overallScore)}`}>
                  {overallScore}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-foreground mb-1">
                  Performance Score
                </h3>
                <p className="text-sm text-muted-foreground mb-2">
                  {motivationalMessage}
                </p>
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-1">
                    <Target className="w-4 h-4 text-primary" />
                    <span className="text-muted-foreground">Today's Wins:</span>
                    <Badge variant="secondary" className="text-xs">
                      {todaysWins}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span className="text-muted-foreground">Month Progress:</span>
                    <Badge variant="outline" className="text-xs">
                      {monthProgress.toFixed(0)}%
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Month Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Monthly Progress</span>
                <span className="font-medium text-foreground">{monthProgress.toFixed(1)}%</span>
              </div>
              <Progress value={monthProgress} className="h-2" />
            </div>
          </div>

          {/* Streaks & Achievements */}
          <div className="space-y-4">
            {/* Streak Counter */}
            <div className="bg-muted/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Flame className="w-5 h-5 text-primary" />
                  <span className="font-medium text-foreground">Streak</span>
                </div>
                <Badge className="bg-primary text-primary-foreground">
                  {streakData.currentStreak} days
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div className="flex justify-between">
                  <span>Best Streak:</span>
                  <span className="font-medium">{streakData.bestStreak} days</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Days:</span>
                  <span className="font-medium">{streakData.totalDaysTracked}</span>
                </div>
              </div>
            </div>

            {/* Recent Achievements */}
            <div className="bg-muted/30 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Trophy className="w-5 h-5 text-primary" />
                <span className="font-medium text-foreground">Achievements</span>
                <Badge variant="outline" className="text-xs">
                  {unlockedAchievements.length}
                </Badge>
              </div>
              <div className="space-y-2">
                {recentAchievements.length > 0 ? (
                  recentAchievements.map((achievement) => (
                    <div key={achievement.id} className="flex items-center space-x-2">
                      <achievement.icon className="w-4 h-4 text-primary" />
                      <span className="text-xs text-foreground font-medium truncate">
                        {achievement.title}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-muted-foreground">
                    Complete your first daily goal to unlock achievements!
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};