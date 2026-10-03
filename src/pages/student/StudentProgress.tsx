import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/EmptyState';
import { ActivityCalendar } from '@/components/charts/ActivityCalendar';
import { calculateStreak } from '@/lib/utils';
import { Flame, TrendingUp, Target, Brain, BookOpen } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, RadialBarChart, RadialBar, PolarAngleAxis
} from 'recharts';
import type { Program, Submission, QuizAttempt, ActivityLog } from '@/types';

export function StudentProgress() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([]);
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [notebookCount, setNotebookCount] = useState(0);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const { data: labs } = await supabase
        .from('labs')
        .select('topics(id, programs(*, topic(*)))')
        .eq('batch_id', profile.batch_id);
      const allProgs: Program[] = [];
      (labs || []).forEach((lab: any) => {
        (lab.topics || []).forEach((t: any) => (t.programs || []).forEach((p: Program) => allProgs.push(p)));
      });
      setPrograms(allProgs);

      const { data: subs } = await supabase.from('submissions').select('*, program(*)').eq('student_id', profile.id);
      setSubmissions(subs as Submission[] || []);

      const { data: quizzes } = await supabase.from('quiz_attempts').select('*, quiz(*)').eq('student_id', profile.id).order('attempted_at');
      setQuizAttempts(quizzes as QuizAttempt[] || []);

      const { data: acts } = await supabase.from('activity_log').select('*').eq('user_id', profile.id).order('activity_date');
      setActivity(acts as ActivityLog[] || []);

      const { count } = await supabase.from('notebook_entries').select('*', { count: 'exact', head: true }).eq('student_id', profile.id);
      setNotebookCount(count || 0);

      setLoading(false);
    })();
  }, [profile]);

  if (loading) return <Spinner className="py-20" />;
  if (!profile) return null;

  const activityMap: Record<string, number> = {};
  activity.forEach(a => { activityMap[a.activity_date] = (activityMap[a.activity_date] || 0) + 1; });
  const { current, longest } = calculateStreak(activity.map(a => a.activity_date));

  const completed = submissions.filter(s => s.status === 'completed').length;
  const passed = submissions.filter(s => s.status === 'passed').length;
  const attempted = submissions.filter(s => s.status === 'attempted').length;
  const notStarted = Math.max(0, programs.length - submissions.length);
  const completionRate = programs.length > 0 ? Math.round((completed / programs.length) * 100) : 0;

  // Topic-wise progress
  const topicMap: Record<string, { name: string; total: number; completed: number }> = {};
  programs.forEach(p => {
    const topicName = (p as any).topic?.name || 'Unknown';
    if (!topicMap[p.topic_id]) topicMap[p.topic_id] = { name: topicName, total: 0, completed: 0 };
    topicMap[p.topic_id].total++;
    if (submissions.find(s => s.program_id === p.id && s.status === 'completed')) topicMap[p.topic_id].completed++;
  });
  const topicData = Object.values(topicMap).map(t => ({ ...t, pct: t.total > 0 ? Math.round((t.completed / t.total) * 100) : 0 }));

  // Status distribution
  const statusData = [
    { name: 'Completed', value: completed, fill: '#16a34a' },
    { name: 'Passed', value: passed, fill: '#2563eb' },
    { name: 'Attempted', value: attempted, fill: '#f59e0b' },
    { name: 'Not Started', value: notStarted, fill: '#d1d5db' },
  ];

  // Quiz score trend
  const quizData = quizAttempts.map((q, i) => ({
    attempt: `Q${i + 1}`,
    score: Number(q.percentage),
    title: q.quiz?.title || 'Quiz',
  }));

  // Weekly activity
  const last8Weeks = [...Array(8)].map((_, i) => {
    const start = new Date();
    start.setDate(start.getDate() - (7 - i) * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const count = activity.filter(a => {
      const d = new Date(a.activity_date);
      return d >= start && d <= end;
    }).length;
    return { week: `W${i + 1}`, activities: count };
  });

  const notebookPct = programs.length > 0 ? Math.round((notebookCount / programs.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Progress Analytics</h2>
        <p className="mt-1 text-gray-500">Visualize your lab performance and growth over time.</p>
      </div>

      {/* Streak summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
              <Flame className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{current}</p>
              <p className="text-sm text-gray-500">Current Streak (days)</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
              <Target className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{longest}</p>
              <p className="text-sm text-gray-500">Longest Streak (days)</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success-50 text-success-600">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{completionRate}%</p>
              <p className="text-sm text-gray-500">Overall Completion</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Activity calendar */}
      <Card className="p-5">
        <h3 className="font-semibold text-gray-900">Activity Calendar</h3>
        <p className="mb-4 text-sm text-gray-500">GitHub-style activity heatmap based on meaningful lab activity</p>
        <ActivityCalendar activityMap={activityMap} />
      </Card>

      {/* Charts grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Topic-wise progress */}
        <Card className="p-5">
          <h3 className="font-semibold text-gray-900">Topic-wise Progress</h3>
          {topicData.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={topicData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} interval={0} angle={-15} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
                <Bar dataKey="completed" fill="#2563eb" radius={[4, 4, 0, 0]} name="Completed" />
                <Bar dataKey="total" fill="#dbeafe" radius={[4, 4, 0, 0]} name="Total" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Status distribution pie */}
        <Card className="p-5">
          <h3 className="font-semibold text-gray-900">Program Status Distribution</h3>
          {statusData.every(d => d.value === 0) ? (
            <p className="py-8 text-center text-sm text-gray-400">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`} labelLine={false} style={{ fontSize: '11px' }}>
                  {statusData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Quiz score trend */}
        <Card className="p-5">
          <h3 className="font-semibold text-gray-900">Quiz Score Trend</h3>
          {quizData.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">No quiz attempts yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={quizData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="attempt" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
                <Line type="monotone" dataKey="score" stroke="#06b6d4" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Weekly activity */}
        <Card className="p-5">
          <h3 className="font-semibold text-gray-900">Weekly Activity (8 Weeks)</h3>
          {last8Weeks.every(w => w.activities === 0) ? (
            <p className="py-8 text-center text-sm text-gray-400">No activity yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={last8Weeks} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
                <Bar dataKey="activities" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Notebook completion radial */}
      <Card className="p-5">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-success-600" />
          <h3 className="font-semibold text-gray-900">Practical Notebook Completion</h3>
        </div>
        <div className="flex items-center gap-8">
          <ResponsiveContainer width="50%" height={200}>
            <RadialBarChart innerRadius="65%" outerRadius="90%" data={[{ name: 'Notebook', value: notebookPct, fill: '#16a34a' }]} startAngle={90} endAngle={-270}>
              <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
              <RadialBar background dataKey="value" cornerRadius={10} fill="#16a34a" />
            </RadialBarChart>
          </ResponsiveContainer>
          <div>
            <p className="text-3xl font-bold text-gray-900">{notebookPct}%</p>
            <p className="text-sm text-gray-500">{notebookCount} of {programs.length} notebook entries</p>
            <div className="mt-3 flex items-center gap-2 text-sm">
              <Brain className="h-4 w-4 text-accent-600" />
              <span className="text-gray-600">Quiz attempts: {quizAttempts.length}</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
