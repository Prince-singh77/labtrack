import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Card, Badge } from '@/components/ui/Card';
import { EmptyState, Spinner } from '@/components/ui/EmptyState';
import {
  Bell,
  Zap,
  MessageSquare,
  AlertTriangle,
} from 'lucide-react';
import { timeAgo } from '@/lib/utils';
import type { Notice } from '@/types';

interface Intervention {
  id: string;
  description: string;
  created_at: string;
  metadata: {
    teacher_id?: string;
    teacher_name?: string;
    student_id?: string;
    student_name?: string;
    average_score?: number;
  } | null;
}

export function StudentNotices() {
  const { profile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [interventions, setInterventions] = useState<
    Intervention[]
  >([]);

  useEffect(() => {
    if (!profile) return;

    loadNotices();
  }, [profile]);

  const loadNotices = async () => {
    if (!profile) return;

    setLoading(true);

    try {
      // Existing notices
      const { data: noticeData, error: noticeError } =
        await supabase
          .from('notices')
          .select('*')
          .or('audience.eq.all,audience.eq.students')
          .order('created_at', {
            ascending: false,
          });

      if (noticeError) {
        console.error(
          'Failed to load notices:',
          noticeError
        );
      }

      setNotices((noticeData || []) as Notice[]);

      // Teacher interventions specifically for this student
      const { data: interventionData, error: interventionError } =
        await supabase
          .from('activity_log')
          .select(
            'id, description, created_at, metadata'
          )
          .eq(
            'activity_type',
            'teacher_intervention'
          )
          .eq('user_id', profile.id)
          .order('created_at', {
            ascending: false,
          });

      if (interventionError) {
        console.error(
          'Failed to load interventions:',
          interventionError
        );
      }

      setInterventions(
        (interventionData || []) as Intervention[]
      );
    } catch (error) {
      console.error(
        'Failed to load student notices:',
        error
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Spinner className="py-20" />;
  }

  if (!profile) {
    return null;
  }

  const hasContent =
    notices.length > 0 || interventions.length > 0;

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Notifications
        </h2>

        <p className="mt-1 text-gray-500">
          Announcements, guidance and messages from your
          teachers.
        </p>
      </div>

      {/* Teacher interventions */}
      {interventions.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-indigo-600" />

            <h3 className="text-lg font-semibold text-gray-900">
              Teacher Guidance
            </h3>

            <Badge className="border-indigo-200 bg-indigo-50 text-indigo-700">
              {interventions.length}
            </Badge>
          </div>

          <div className="space-y-3">
            {interventions.map((intervention) => {
              const average =
                intervention.metadata?.average_score;

              return (
                <Card
                  key={intervention.id}
                  className="border-indigo-100 p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                      <MessageSquare className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-gray-900">
                          Message from{' '}
                          {intervention.metadata
                            ?.teacher_name ||
                            'Your Teacher'}
                        </h3>

                        {typeof average ===
                          'number' &&
                          average < 50 && (
                            <Badge className="border-red-200 bg-red-50 text-red-700">
                              <AlertTriangle className="mr-1 h-3 w-3" />
                              Needs Improvement
                            </Badge>
                          )}
                      </div>

                      <p className="mt-3 whitespace-pre-line text-sm leading-6 text-gray-700">
                        {intervention.description}
                      </p>

                      {typeof average ===
                        'number' && (
                        <div className="mt-3 inline-flex rounded-lg bg-gray-50 px-3 py-2">
                          <span className="text-xs text-gray-500">
                            Current average:&nbsp;
                          </span>

                          <span
                            className={`text-xs font-semibold ${
                              average < 50
                                ? 'text-red-600'
                                : average < 75
                                ? 'text-yellow-600'
                                : 'text-green-600'
                            }`}
                          >
                            {average}%
                          </span>
                        </div>
                      )}

                      <p className="mt-3 text-xs text-gray-400">
                        {timeAgo(
                          intervention.created_at
                        )}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* General notices */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-accent-600" />

          <h3 className="text-lg font-semibold text-gray-900">
            Announcements
          </h3>
        </div>

        {notices.length === 0 ? (
          <EmptyState
            icon={<Bell className="h-6 w-6" />}
            title="No announcements"
            description="New announcements will appear here."
          />
        ) : (
          <div className="space-y-3">
            {notices.map((n) => (
              <Card
                key={n.id}
                className="p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-accent-50 text-accent-600">
                    <Zap className="h-5 w-5" />
                  </div>

                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-gray-900">
                        {n.title}
                      </h3>

                      <Badge className="border-gray-200 bg-gray-50 text-gray-600 capitalize">
                        {n.audience}
                      </Badge>
                    </div>

                    <p className="mt-1 text-sm text-gray-600">
                      {n.content}
                    </p>

                    <p className="mt-2 text-xs text-gray-400">
                      {timeAgo(n.created_at)}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Completely empty state */}
      {!hasContent && (
        <EmptyState
          icon={<Bell className="h-6 w-6" />}
          title="You're all caught up"
          description="There are no announcements or teacher messages right now."
        />
      )}
    </div>
  );
}