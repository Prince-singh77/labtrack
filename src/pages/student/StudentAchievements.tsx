import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Card, Badge } from '@/components/ui/Card';
import { EmptyState, Spinner } from '@/components/ui/EmptyState';
import { Trophy, Award } from 'lucide-react';
import type { Achievement, UserAchievement } from '@/types';

export function StudentAchievements() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [earned, setEarned] = useState<UserAchievement[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);

  useEffect(() => {
    async function loadAchievements() {
      if (!profile) {
        setLoading(false);
        return;
      }

      const { data: all } = await supabase
        .from('achievements')
        .select('*');

      const { data: mine } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', profile.id)
        .order('earned_at', { ascending: false });

      const allItems = (all || []) as Achievement[];
      const earnedItems = (mine || []) as UserAchievement[];

      setAchievements(allItems);
      setEarned(earnedItems);

      const earnedIds = earnedItems.map(item => item.achievement_id);

      const points = allItems.reduce((sum, item) => {
        if (earnedIds.includes(item.id)) {
          return sum + (item.points || 0);
        }
        return sum;
      }, 0);

      setTotalPoints(points);
      setLoading(false);
    }

    loadAchievements();
  }, [profile]);

  if (loading) {
    return <Spinner className="py-20" />;
  }

  if (!profile) {
    return null;
  }

  const earnedIds = earned.map(item => item.achievement_id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Achievements
          </h2>
          <p className="mt-1 text-gray-500">
            Badges and milestones you have earned.
          </p>
        </div>

        <Card className="px-5 py-3">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-warning-600" />
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {totalPoints}
              </p>
              <p className="text-xs text-gray-500">Total Points</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <p className="text-sm font-medium text-gray-500">
          Achievement Progress
        </p>
        <p className="mt-1 text-2xl font-bold text-gray-900">
          {earned.length} / {achievements.length}
        </p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full bg-primary-500"
            style={{
              width:
                (achievements.length > 0
                  ? (earned.length / achievements.length) * 100
                  : 0) + '%'
            }}
          />
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {achievements.map(ach => {
          const isEarned = earnedIds.includes(ach.id);

          return (
            <Card
              key={ach.id}
              className={
                'p-5 ' + (isEarned ? 'border-yellow-300' : 'opacity-60')
              }
            >
              <div className="flex items-start gap-4">
                <div
                  className={
                    'flex h-14 w-14 items-center justify-center rounded-xl ' +
                    (isEarned
                      ? 'bg-yellow-400 text-white'
                      : 'bg-gray-100 text-gray-400')
                  }
                >
                  {isEarned ? (
                    <Trophy className="h-7 w-7" />
                  ) : (
                    <Award className="h-7 w-7" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-gray-900">
                      {ach.name}
                    </h3>
                    {isEarned && (
                      <Badge>Earned</Badge>
                    )}
                  </div>

                  <p className="mt-1 text-sm text-gray-600">
                    {ach.description}
                  </p>

                  <div className="mt-2">
                    <Badge>+{ach.points} points</Badge>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {achievements.length === 0 && (
        <EmptyState
          icon={<Trophy className="h-6 w-6" />}
          title="No achievements defined"
          description="Achievements will appear here once an admin sets them up."
        />
      )}
    </div>
  );
}