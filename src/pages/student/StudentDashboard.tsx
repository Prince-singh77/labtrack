import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Card, StatCard, Badge } from '@/components/ui/Card';
import { EmptyState, Spinner } from '@/components/ui/EmptyState';
import { ActivityCalendar } from '@/components/charts/ActivityCalendar';
import { calculateStreak, timeAgo, statusColor, statusLabel, difficultyColor } from '@/lib/utils';
import {
  Flame, Target, Code2, CheckCircle2, Clock, Award, BookOpen, Brain,
  Calendar, TrendingUp, Zap, FileText, Trophy
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip,
  RadialBarChart, RadialBar, PolarAngleAxis
} from 'recharts';
import type { Program, Submission, QuizAttempt, ActivityLog, UserAchievement, Notice } from '@/types';

export function StudentDashboard() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([]);
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [notebookCount, setNotebookCount] = useState(0);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const { data: subs } = await supabase
        .from('submissions')
        .select('*, program(*)')
        .eq('student_id', profile.id)
        .order('submitted_at', { ascending: false });
      setSubmissions(subs as Submission[] || []);

      const programIds = (subs || []).map((s: any) => s.program_id);
      let allPrograms: Program[] = [];
      if (programIds.length > 0) {
        const { data: progs } = await supabase
          .from('programs')
          .select('*, topic(*)')
          .in('id', programIds);
        allPrograms = progs as Program[] || [];
      }

      // Get programs from labs/topics assigned to student's batch
      const { data: labs } = await supabase
        .from('labs')
        .select('id, topics(id, programs(*, topic(*)))')
        .eq('batch_id', profile.batch_id);

      const batchPrograms: Program[] = [];
      (labs || []).forEach((lab: any) => {
        (lab.topics || []).forEach((topic: any) => {
          (topic.programs || []).forEach((prog: any) => batchPrograms.push(prog));
        });
      });
      setPrograms([...allPrograms, ...batchPrograms.filter(p => !allPrograms.find(ap => ap.id === p.id))]);

      const { data: quizzes } = await supabase
        .from('quiz_attempts')
        .select('*, quiz(*)')
        .eq('student_id', profile.id)
        .order('attempted_at', { ascending: false });
      setQuizAttempts(quizzes as QuizAttempt[] || []);

      const { data: acts } = await supabase
        .from('activity_log')
        .select('*')
        .eq('user_id', profile.id)
        .order('activity_date', { ascending: true });
      setActivity(acts as ActivityLog[] || []);

      const { data: achs } = await supabase
        .from('user_achievements')
        .select('*, achievement(*)')
        .eq('user_id', profile.id)
        .order('earned_at', { ascending: false })
        .limit(5);
      setAchievements(achs as UserAchievement[] || []);

      const { data: nots } = await supabase
        .from('notices')
        .select('*')
        .or('audience.eq.all,audience.eq.students')
        .order('created_at', { ascending: false })
        .limit(3);
      setNotices(nots as Notice[] || []);

      const { count } = await supabase
        .from('notebook_entries')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', profile.id);
      setNotebookCount(count || 0);

      setLoading(false);
    })();
  }, [profile]);

  if (loading) return <Spinner className="py-20" />;
  if (!profile) return null;

  const activityDates = activity.map(a => a.activity_date);
  const { current: currentStreak, longest: longestStreak } = calculateStreak(activityDates);

  const activityMap: Record<string, number> = {};
  activity.forEach(a => {
    activityMap[a.activity_date] = (activityMap[a.activity_date] || 0) + 1;
  });

  const completed = submissions.filter(s => s.status === 'completed').length;
  const passed = submissions.filter(s => s.status === 'passed').length;
  const attempted = submissions.filter(s => s.status === 'attempted').length;
  const notStarted = programs.length - submissions.length;
  const totalPrograms = programs.length || 1;
  const completionRate = Math.round((completed / totalPrograms) * 100);

  // Weekly activity data
  const last7Days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    return {
      day: d.toLocaleDateString('en-US', { weekday: 'short' }),
      activities: activityMap[dateStr] || 0,
    };
  });

  // Quiz performance
  const avgQuizScore = quizAttempts.length > 0
    ? Math.round(quizAttempts.reduce((sum, q) => sum + Number(q.percentage), 0) / quizAttempts.length)
    : 0;

  const notebookCompletion = totalPrograms > 0 ? Math.round((notebookCount / totalPrograms) * 100) : 0;

  // Attendance eligibility: based on lab activity in last 2 weeks
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  const recentActivity = activity.filter(a => new Date(a.activity_date) >= twoWeeksAgo).length;
  const attendanceEligible = recentActivity >= 6;

  const recentSubmissions = submissions.slice(0, 5);

  const radialData = [{ name: 'Completion', value: completionRate, fill: '#2563eb' }];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="animate-fade-in">
        <h2 className="text-2xl font-bold text-gray-900">Welcome back, {profile.full_name.split(' ')[0]}!</h2>
        <p className="mt-1 text-gray-500">Here's your lab progress at a glance.</p>
      </div>

      {/* Attendance eligibility notice */}
      <div className={`rounded-lg border p-4 ${attendanceEligible ? 'border-success-200 bg-success-50' : 'border-warning-200 bg-warning-50'}`}>
        <div className="flex items-center gap-3">
          {attendanceEligible ? (
            <CheckCircle2 className="h-5 w-5 text-success-600" />
          ) : (
            <Clock className="h-5 w-5 text-warning-600" />
          )}
          <div>
            <p className="text-sm font-semibold text-gray-900">
              Attendance Eligibility: {attendanceEligible ? 'Eligible' : 'At Risk'}
            </p>
            <p className="text-xs text-gray-500">
              Based on {recentActivity} lab activities in the last 2 weeks. Attendance eligibility is a LabTrack signal for manual ERP use — never a replacement for official attendance.
            </p>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Completed Programs" value={completed} icon={<CheckCircle2 className="h-5 w-5" />} color="success" />
        <StatCard label="Pending Programs" value={Math.max(0, programs.length - completed)} icon={<Clock className="h-5 w-5" />} color="warning" />
        <StatCard label="Attempted" value={attempted + passed} icon={<Code2 className="h-5 w-5" />} color="primary" />
        <StatCard label="Passed" value={passed} icon={<Target className="h-5 w-5" />} color="accent" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Current Streak" value={`${currentStreak} days`} icon={<Flame className="h-5 w-5" />} color="warning" trend={`Longest: ${longestStreak} days`} />
        <StatCard label="Overall Progress" value={`${completionRate}%`} icon={<TrendingUp className="h-5 w-5" />} color="primary" />
        <StatCard label="Quiz Average" value={`${avgQuizScore}%`} icon={<Brain className="h-5 w-5" />} color="accent" trend={`${quizAttempts.length} attempts`} />
        <StatCard label="Notebook" value={`${notebookCompletion}%`} icon={<BookOpen className="h-5 w-5" />} color="success" trend={`${notebookCount} entries`} />
      </div>

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Weekly activity chart */}
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Weekly Activity</h3>
            <Calendar className="h-5 w-5 text-gray-400" />
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={last7Days} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
              <Area type="monotone" dataKey="activities" stroke="#2563eb" strokeWidth={2} fill="url(#colorActivity)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Completion radial */}
        <Card className="p-5">
          <h3 className="font-semibold text-gray-900">Overall Completion</h3>
          <ResponsiveContainer width="100%" height={220}>
            <RadialBarChart innerRadius="65%" outerRadius="90%" data={radialData} startAngle={90} endAngle={-270}>
              <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
              <RadialBar background dataKey="value" cornerRadius={10} fill="#2563eb" />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="-mt-32 text-center">
            <p className="text-3xl font-bold text-gray-900">{completionRate}%</p>
            <p className="text-xs text-gray-500">{completed} of {programs.length} programs</p>
          </div>
        </Card>
      </div>

      {/* Activity calendar */}
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Coding Activity Calendar</h3>
          <Flame className="h-5 w-5 text-orange-500" />
        </div>
        <p className="mb-4 text-sm text-gray-500">Current streak: <span className="font-semibold text-orange-600">{currentStreak} days</span> · Longest: <span className="font-semibold">{longestStreak} days</span></p>
        <ActivityCalendar activityMap={activityMap} />
      </Card>

      {/* Recent activity & achievements */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="font-semibold text-gray-900">Recent Submissions</h3>
          {recentSubmissions.length === 0 ? (
            <EmptyState icon={<FileText className="h-6 w-6" />} title="No submissions yet" description="Your recent submissions will appear here." className="py-6" />
          ) : (
            <div className="mt-3 space-y-2">
              {recentSubmissions.map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">{s.program?.title || 'Unknown program'}</p>
                    <p className="text-xs text-gray-500">{timeAgo(s.submitted_at)}</p>
                  </div>
                  <Badge className={statusColor(s.status)}>{statusLabel(s.status)}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold text-gray-900">Recent Achievements</h3>
          {achievements.length === 0 ? (
            <EmptyState icon={<Award className="h-6 w-6" />} title="No achievements yet" description="Complete programs and quizzes to earn badges!" className="py-6" />
          ) : (
            <div className="mt-3 space-y-2">
              {achievements.map((a) => (
                <div key={a.id} className="flex items-center gap-3 rounded-lg border border-gray-100 p-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning-50 text-warning-600">
                    <Trophy className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">{a.achievement?.name}</p>
                    <p className="text-xs text-gray-500">{a.achievement?.description}</p>
                  </div>
                  <Badge className="text-warning-700 bg-warning-50 border-warning-200">+{a.achievement?.points} pts</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Notices */}
      {notices.length > 0 && (
        <Card className="p-5">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-accent-600" />
            <h3 className="font-semibold text-gray-900">Recent Notices</h3>
          </div>
          <div className="mt-3 space-y-2">
            {notices.map((n) => (
              <div key={n.id} className="rounded-lg border border-gray-100 p-3">
                <p className="text-sm font-medium text-gray-900">{n.title}</p>
                <p className="mt-1 text-sm text-gray-600">{n.content}</p>
                <p className="mt-1 text-xs text-gray-400">{timeAgo(n.created_at)}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
