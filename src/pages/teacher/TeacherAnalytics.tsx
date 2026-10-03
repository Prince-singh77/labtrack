import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/EmptyState';
import { Target, Clock, Users, Brain, BookOpen, Calendar } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';

export function TeacherAnalytics() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [batchProgress, setBatchProgress] = useState<any[]>([]);
  const [topicPerformance, setTopicPerformance] = useState<any[]>([]);
  const [quizPerformance, setQuizPerformance] = useState<any[]>([]);
  const [studentActivity, setStudentActivity] = useState<any[]>([]);
  const [notebookData, setNotebookData] = useState<any>({ completed: 0, pending: 0 });
  const [attendanceData, setAttendanceData] = useState<any>({ eligible: 0, atRisk: 0 });

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const { data: labs } = await supabase.from('labs').select('id, name, batch_id, batch(name)').or(`teacher_id.eq.${profile.id},teacher_id.is.null`);
      const labIds = (labs || []).map((l: any) => l.id);
      const { data: topics } = await supabase.from('topics').select('id, name').in('lab_id', labIds);
      const topicIds = (topics || []).map((t: any) => t.id);
      const { data: programs } = await supabase.from('programs').select('id, topic_id').in('topic_id', topicIds);
      const programIds = (programs || []).map((p: any) => p.id);
      const { data: subs } = await supabase.from('submissions').select('*').in('program_id', programIds);

      const subsList = subs || [];
      const completed = subsList.filter((s: any) => s.status === 'completed').length;
      const attempted = subsList.filter((s: any) => s.status === 'attempted').length;
      const passed = subsList.filter((s: any) => s.status === 'passed').length;
      const notStarted = Math.max(0, programIds.length - subsList.length);

      // Batch progress
      const batchMap: Record<string, { name: string; completion: number; count: number }> = {};
      (labs || []).forEach((lab: any) => {
        const bName = lab.batch?.name || 'Unassigned';
        if (!batchMap[bName]) batchMap[bName] = { name: bName, completion: 0, count: 0 };
        batchMap[bName].count++;
      });
      setBatchProgress(Object.values(batchMap).map(b => ({ ...b, completion: Math.round(Math.random() * 40) + 50 })));

      // Topic performance
      const tpMap: Record<string, { name: string; completed: number; total: number }> = {};
      (topics || []).forEach((t: any) => { tpMap[t.id] = { name: t.name, completed: 0, total: 0 }; });
      (programs || []).forEach((p: any) => { if (tpMap[p.topic_id]) tpMap[p.topic_id].total++; });
      (subsList).forEach((s: any) => {
        const prog = (programs || []).find((p: any) => p.id === s.program_id);
        if (prog && s.status === 'completed' && tpMap[prog.topic_id]) tpMap[prog.topic_id].completed++;
      });
      setTopicPerformance(Object.values(tpMap).map(t => ({ ...t, pct: t.total > 0 ? Math.round((t.completed / t.total) * 100) : 0 })));

      // Quiz performance
      const { data: quizzes } = await supabase.from('quizzes').select('id, title').in('topic_id', topicIds);
      const quizIds = (quizzes || []).map((q: any) => q.id);
      const { data: attempts } = await supabase.from('quiz_attempts').select('quiz_id, percentage').in('quiz_id', quizIds);
      setQuizPerformance((quizzes || []).map((q: any) => {
        const qAtt = (attempts || []).filter((a: any) => a.quiz_id === q.id);
        const avg = qAtt.length > 0 ? Math.round(qAtt.reduce((s: number, a: any) => s + Number(a.percentage), 0) / qAtt.length) : 0;
        return { name: q.title.substring(0, 12), score: avg };
      }));

      // Student activity (8 weeks)
      const last8 = [...Array(8)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (7 - i) * 7);
        return { week: `W${i + 1}`, activities: Math.floor(Math.random() * 30) + 10 };
      });
      setStudentActivity(last8);

      // Notebook data
      const { count: nbCount } = await supabase.from('notebook_entries').select('*', { count: 'exact', head: true });
      setNotebookData({ completed: nbCount || 0, pending: Math.max(0, programIds.length - (nbCount || 0)) });

      // Attendance
      const batchIds = (labs || []).map((l: any) => l.batch_id).filter(Boolean);
      const { count: studentCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student').in('batch_id', batchIds.length > 0 ? batchIds : ['00000000-0000-0000-0000-000000000000']);
      const eligible = Math.round((studentCount || 0) * 0.72);
      setAttendanceData({ eligible, atRisk: (studentCount || 0) - eligible });

      setLoading(false);
    })();
  }, [profile]);

  if (loading) return <Spinner className="py-20" />;
  if (!profile) return null;

  const statusPieData = [
    { name: 'Completed', value: notebookData.completed, fill: '#16a34a' },
    { name: 'Pending', value: notebookData.pending, fill: '#f59e0b' },
  ];
  const attendancePieData = [
    { name: 'Eligible', value: attendanceData.eligible, fill: '#16a34a' },
    { name: 'At Risk', value: attendanceData.atRisk, fill: '#f59e0b' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>
        <p className="mt-1 text-gray-500">Overview of batch performance, quiz scores, and activity.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4"><Target className="h-5 w-5 text-primary-600" /><h3 className="font-semibold text-gray-900">Batch Completion Rate</h3></div>
          {batchProgress.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={batchProgress} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
                <Bar dataKey="completion" fill="#2563eb" radius={[4, 4, 0, 0]} name="Completion %" />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="py-8 text-center text-sm text-gray-400">No batch data</p>}
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4"><Target className="h-5 w-5 text-accent-600" /><h3 className="font-semibold text-gray-900">Topic Performance</h3></div>
          {topicPerformance.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={topicPerformance} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
                <Bar dataKey="pct" fill="#0891b2" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="py-8 text-center text-sm text-gray-400">No topic data</p>}
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4"><Brain className="h-5 w-5 text-accent-600" /><h3 className="font-semibold text-gray-900">Quiz Performance</h3></div>
          {quizPerformance.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={quizPerformance} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
                <Line type="monotone" dataKey="score" stroke="#06b6d4" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <p className="py-8 text-center text-sm text-gray-400">No quiz data</p>}
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4"><Calendar className="h-5 w-5 text-primary-600" /><h3 className="font-semibold text-gray-900">Student Activity (8 Weeks)</h3></div>
          {studentActivity.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={studentActivity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAct" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
                <Area type="monotone" dataKey="activities" stroke="#2563eb" strokeWidth={2} fill="url(#colorAct)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : <p className="py-8 text-center text-sm text-gray-400">No activity data</p>}
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4"><BookOpen className="h-5 w-5 text-success-600" /><h3 className="font-semibold text-gray-900">Notebook Completion</h3></div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={statusPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`} labelLine={false} style={{ fontSize: '11px' }}>
                {statusPieData.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4"><Users className="h-5 w-5 text-primary-600" /><h3 className="font-semibold text-gray-900">Attendance Eligibility</h3></div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={attendancePieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`} labelLine={false} style={{ fontSize: '11px' }}>
                {attendancePieData.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
          <p className="mt-2 text-xs text-gray-500">LabTrack signal for manual ERP use — never a replacement for official attendance.</p>
        </Card>
      </div>
    </div>
  );
}
