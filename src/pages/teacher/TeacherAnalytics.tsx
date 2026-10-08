import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/EmptyState';

export function TeacherAnalytics() {
  const { profile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [average, setAverage] = useState(0);
  const [passed, setPassed] = useState(0);
  const [struggling, setStruggling] = useState(0);

  useEffect(() => {
    if (!profile) return;

    loadAnalytics();
  }, [profile]);

  const loadAnalytics = async () => {
    if (!profile) return;

    try {
      const { data: labs } = await supabase
        .from('labs')
        .select('id')
        .or(`teacher_id.eq.${profile.id},teacher_id.is.null`);

      const labIds = (labs || []).map((l: any) => l.id);

      if (!labIds.length) {
        setLoading(false);
        return;
      }

      const { data: topics } = await supabase
        .from('topics')
        .select('id')
        .in('lab_id', labIds);

      const topicIds = (topics || []).map((t: any) => t.id);

      if (!topicIds.length) {
        setLoading(false);
        return;
      }

      const { data: programs } = await supabase
        .from('programs')
        .select('id, marks')
        .in('topic_id', topicIds);

      const programIds = (programs || []).map(
        (p: any) => p.id
      );

      if (!programIds.length) {
        setLoading(false);
        return;
      }

      const { data: submissions } = await supabase
        .from('submissions')
        .select('score, status, program_id')
        .in('program_id', programIds);

      const rows = submissions || [];

      setTotal(rows.length);

      if (rows.length > 0) {
        const scores = rows.map((s: any) => {
          const program = (programs || []).find(
            (p: any) => p.id === s.program_id
          );

          const marks = program?.marks || 10;

          return marks > 0
            ? (Number(s.score || 0) / marks) * 100
            : 0;
        });

        const avg =
          scores.reduce((a, b) => a + b, 0) /
          scores.length;

        setAverage(Math.round(avg));

        const passedCount = scores.filter(
          (score) => score >= 50
        ).length;

        setPassed(
          Math.round((passedCount / scores.length) * 100)
        );

        setStruggling(
          scores.filter((score) => score < 50).length
        );
      }
    } catch (error) {
      console.error('Analytics error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Spinner className="py-20" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Analytics
        </h2>

        <p className="mt-1 text-gray-500">
          Monitor student performance and identify students
          who need help.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5">
          <p className="text-sm text-gray-500">
            Total Submissions
          </p>

          <p className="mt-2 text-3xl font-bold text-gray-900">
            {total}
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-sm text-gray-500">
            Average Score
          </p>

          <p className="mt-2 text-3xl font-bold text-gray-900">
            {average}%
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-sm text-gray-500">
            Pass Rate
          </p>

          <p className="mt-2 text-3xl font-bold text-gray-900">
            {passed}%
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-sm text-gray-500">
            Need Attention
          </p>

          <p className="mt-2 text-3xl font-bold text-red-600">
            {struggling}
          </p>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Performance Overview
        </h3>

        <p className="mt-2 text-sm text-gray-500">
          Students scoring below 50% are automatically
          counted as needing attention.
        </p>

        <div className="mt-6 rounded-lg bg-gray-50 p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              Overall Performance
            </span>

            <span className="font-bold">
              {average}%
            </span>
          </div>

          <div className="mt-3 h-3 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-blue-600"
              style={{
                width: `${Math.min(average, 100)}%`,
              }}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}