import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Card, Badge } from '@/components/ui/Card';
import { EmptyState, Spinner } from '@/components/ui/EmptyState';
import { Trophy, Award, Flame, Target, Brain, BookOpen, Heart, Sparkles, CheckCircle2 } from 'lucide-react';
import type { Achievement, UserAchievement } from '@/types';

const iconMap: Record<string, any> = {
  'check-circle': CheckCircle2,
  'check-circle-2': CheckCircle2,
  award: Award,
  brain: Brain,
  sparkles: Sparkles,
  flame: Flame,
  'book-open': BookOpen,
  heart: Heart,
};

export function StudentAchievements() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [earned, setEarned] = useState<UserAchievement[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const { data: all } = await supabase.from('achievements').select('*');
      setAchievements(all as Achievement[] || []);

      const { data: mine } = await supabase
        .from('user_achievements')
        .select('*, achievement(*)')
        .eq('user_id', profile.id)
        .order('earned_at', { ascending: false });
      setEarned(mine as UserAchievement[] || []);

      const points = (mine || []).reduce((sum: number, a: any) => sum + (a.achievement?.points || 0), 0);
      setTotalPoints(points);

      setLoading(false);
    })();
  }, [profile]);

  if (loading) return <Spinner className="py-20" />;
  if (!profile) return null;

  const earnedIds = earned.map(e => e.achievement_id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Achievements</h2>
          <p className="mt-1 text-gray-500">Badges and milestones you've earned.</p>
        </div>
        <Card className="px-5 py-3">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-warning-600" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalPoints}</p>
              <p className="text-xs text-gray-500">Total Points</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Progress summary */}
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Achievement Progress</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{earned.length} / {achievements.length}</p>
          </div>
          <div className="h-2 w-32 overflow-hidden rounded-full bg-gray-200">
            <div className="h-full bg-gradient-to-r from-primary-500 to-accent-500 transition-all" style={{ width: `${achievements.length > 0 ? (earned.length / achievements.length) * 100 : 0}%` }} />
          </div>
        </div>
      </Card>

      {/* Achievement grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {achievements.map((ach) => {
          const isEarned = earnedIds.includes(ach.id);
          const Icon = iconMap[ach.icon] || Award;
          const earnedRecord = earned.find(e => e.achievement_id === ach.id);
          return (
            <Card key={ach.id} className={`p-5 ${isEarned ? 'border-warning-200' : 'opacity-60'}`}>
              <div className="flex items-start gap-4">
                <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${isEarned ? 'bg-gradient-to-br from-warning-400 to-amber-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                  <Icon className="h-7 w-7" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{ach.name}</h3>
                    {isEarned && <Badge className="text-success-700 bg-success-50 border-success-200">Earned</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{ach.description}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge className="text-warning-700 bg-warning-50 border-warning-200">+{ach.points} points</Badge>
                    {earnedRecord && <span className="text-xs text-gray-400">{new Date(earnedRecord.earned_at).toLocaleDateString()}</span>}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {achievements.length === 0 && (
        <EmptyState icon={<Trophy className="h-6 w-6" />} title="No achievements defined" description="Achievements will appear here once an admin sets them up." />
      )}
    </div>
  );
}
