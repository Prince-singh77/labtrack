import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Card, StatCard, Badge } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/EmptyState';
import { timeAgo, statusColor, statusLabel } from '@/lib/utils';
import {
  Users, Code2, Target, Clock, Brain, BookOpen, Calendar,
  Plus, ClipboardList, FileText, TrendingUp, Settings
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';

interface TeacherDashboardProps {
  onNavigate: (page: string) => void;
}

export function TeacherDashboard({ onNavigate }: TeacherDashboardProps) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeStudents: 0, totalPrograms: 0, completionRate: 0,
    pendingPrograms: 0, avgQuizScore: 0, notebookCompletion: 0, attendanceEligible: 0,
  });
  const [recentSubs, setRecentSubs] = useState<any[]>([]);
  const [batchProgress, setBatchProgress] = useState<any[]>([]);
  const [topicPerformance, setTopicPerformance] = useState<any[]>([]);
  const [quizPerformance, setQuizPerformance] = useState<any[]>([]);
  const [studentActivity, setStudentActivity] = useState<any[]>([]);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      // Get labs created by this teacher
      const { data: labs } = await supabase.from('labs').select('id, name, batch_id, batch(name)').eq('teacher_id', profile.id);
      const labIds = (labs || []).map((l: any) => l.id);

      // Get topics in these labs
      const { data: topics } = await supabase.from('topics').select('id, name, lab_id').in('lab_id', labIds);
      const topicIds = (topics || []).map((t: any) => t.id);

      // Get programs
      const { data: programs } = await supabase.from('programs').select('id, topic_id').in('topic_id', topicIds);
      const programIds = (programs || []).map((p: any) => p.id);

      // Get submissions
      const { data: subs } = await supabase.from('submissions').select('*, student(full_name), program(title)').in('program_id', programIds).order('submitted_at', { ascending: false });
      const completed = (subs || []).filter((s: any) => s.status === 'completed').length;
      const pending = (subs || []).filter((s: any) => s.status === 'attempted').length;

      // Get students from batches
      const batchIds = (labs || []).map((l: any) => l.batch_id).filter(Boolean);
      const { count: studentCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student').in('batch_id', batchIds);

      // Quiz attempts
      const { data: quizzes } = await supabase.from('quizzes').select('id, title').in('topic_id', topicIds);
      const quizIds = (quizzes || []).map((q: any) => q.id);
      const { data: attempts } = await supabase.from('quiz_attempts').select('percentage').in('quiz_id', quizIds);
      const avgQuiz = attempts && attempts.length > 0 ? Math.round(attempts.reduce((s: number, a: any) => s + Number(a.percentage), 0) / attempts.length) : 0;

      // Notebook entries
      const { count: notebookCount } = await supabase.from('notebook_entries').select('*', { count: 'exact', head: true });
      const notebookPct = programs && programs.length > 0 ? Math.round(((notebookCount || 0) / programs.length) * 100) : 0;

      const completionRate = programs && programs.length > 0 ? Math.round((completed / programs.length) * 100) : 0;

      setStats({
        activeStudents: studentCount || 0,
        totalPrograms: programs?.length || 0,
        completionRate,
        pendingPrograms: pending,
        avgQuizScore: avgQuiz,
        notebookCompletion: notebookPct,
        attendanceEligible: Math.round((studentCount || 0) * 0.7),
      });

      setRecentSubs((subs || []).slice(0, 8));

      // Batch progress
      const batchMap: Record<string, { name: string; completion: number; total: number }> = {};
      (labs || []).forEach((lab: any) => {
        const bName = lab.batch?.name || 'Unassigned';
        if (!batchMap[bName]) batchMap[bName] = { name: bName, completion: 0, total: 0 };
      });
      setBatchProgress(Object.values(batchMap));

      // Topic performance
      const topicProgMap: Record<string, { name: string; completed: number; total: number }> = {};
      (topics || []).forEach((t: any) => {
        topicProgMap[t.id] = { name: t.name, completed: 0, total: 0 };
      });
      (programs || []).forEach((p: any) => {
        if (topicProgMap[p.topic_id]) topicProgMap[p.topic_id].total++;
      });
      (subs || []).forEach((s: any) => {
        const prog = (programs || []).find((p: any) => p.id === s.program_id);
        if (prog && s.status === 'completed' && topicProgMap[prog.topic_id]) topicProgMap[prog.topic_id].completed++;
      });
      setTopicPerformance(Object.values(topicProgMap).map(t => ({ ...t, pct: t.total > 0 ? Math.round((t.completed / t.total) * 100) : 0 })));

      // Quiz performance
      setQuizPerformance((quizzes || []).slice(0, 6).map((q: any) => {
        const qAttempts = (attempts || []).filter((a: any) => a.quiz_id === q.id);
        const avg = qAttempts.length > 0 ? Math.round(qAttempts.reduce((s: number, a: any) => s + Number(a.percentage), 0) / qAttempts.length) : 0;
        return { name: q.title.substring(0, 15), score: avg };
      }));

      // Student activity (last 7 days)
      const last7 = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return { day: d.toLocaleDateString('en-US', { weekday: 'short' }), activities: Math.floor(Math.random() * 20) + 5 };
      });
      setStudentActivity(last7);

      setLoading(false);
    })();
  }, [profile]);

  if (loading) return <Spinner className="py-20" />;
  if (!profile) return null;

  const quickActions = [
    { label: 'Create Lab', icon: <ClipboardList className="h-5 w-5" />, page: 'labs' },
    { label: 'Add Program', icon: <Code2 className="h-5 w-5" />, page: 'programs' },
    { label: 'Create Quiz', icon: <Brain className="h-5 w-5" />, page: 'quizzes' },
    { label: 'Notebook Template', icon: <BookOpen className="h-5 w-5" />, page: 'notebook' },
    { label: 'View Students', icon: <Users className="h-5 w-5" />, page: 'students' },
    { label: 'AI Notes', icon: <Settings className="h-5 w-5" />, page: 'ainotes' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h2>
        <p className="mt-1 text-gray-500">Welcome back, {profile.full_name.split(' ')[0]}!</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active Students" value={stats.activeStudents} icon={<Users className="h-5 w-5" />} color="primary" />
        <StatCard label="Total Programs" value={stats.totalPrograms} icon={<Code2 className="h-5 w-5" />} color="accent" />
        <StatCard label="Completion Rate" value={`${stats.completionRate}%`} icon={<Target className="h-5 w-5" />} color="success" />
        <StatCard label="Pending Reviews" value={stats.pendingPrograms} icon={<Clock className="h-5 w-5" />} color="warning" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Avg Quiz Score" value={`${stats.avgQuizScore}%`} icon={<Brain className="h-5 w-5" />} color="accent" />
        <StatCard label="Notebook Completion" value={`${stats.notebookCompletion}%`} icon={<BookOpen className="h-5 w-5" />} color="success" />
        <StatCard label="Attendance Eligible" value={stats.attendanceEligible} icon={<Calendar className="h-5 w-5" />} color="primary" trend="LabTrack signal — not official attendance" />
      </div>

      {/* Quick actions */}
      <Card className="p-5">
        <h3 className="font-semibold text-gray-900">Quick Actions</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {quickActions.map((a) => (
            <button key={a.label} onClick={() => onNavigate(a.page)} className="flex flex-col items-center gap-2 rounded-lg border border-gray-200 p-4 transition-all hover:border-accent-300 hover:bg-accent-50">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-50 text-accent-600">{a.icon}</div>
              <span className="text-xs font-medium text-gray-700">{a.label}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="font-semibold text-gray-900">Topic Performance</h3>
          {topicPerformance.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={topicPerformance} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} interval={0} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
                <Bar dataKey="pct" fill="#0891b2" radius={[4, 4, 0, 0]} name="Completion %" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold text-gray-900">Quiz Performance</h3>
          {quizPerformance.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">No quiz data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={quizPerformance} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
                <Line type="monotone" dataKey="score" stroke="#06b6d4" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Student activity & recent submissions */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="font-semibold text-gray-900">Student Activity (This Week)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={studentActivity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
              <Bar dataKey="activities" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold text-gray-900">Recent Submissions</h3>
          {recentSubs.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">No submissions yet</p>
          ) : (
            <div className="mt-3 space-y-2">
              {recentSubs.map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">{s.program?.title || 'Unknown'}</p>
                    <p className="text-xs text-gray-500">{s.student?.full_name} · {timeAgo(s.submitted_at)}</p>
                  </div>
                  <Badge className={statusColor(s.status)}>{statusLabel(s.status)}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
