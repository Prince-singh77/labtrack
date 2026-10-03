import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Card, Badge } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { EmptyState, Spinner } from '@/components/ui/EmptyState';
import { ActivityCalendar } from '@/components/charts/ActivityCalendar';
import { calculateStreak, statusColor, statusLabel, timeAgo } from '@/lib/utils';
import { Users, Search, GraduationCap, Flame, Target, Brain, BookOpen } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import type { Profile, Submission, QuizAttempt, ActivityLog } from '@/types';

export function TeacherStudents() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Profile[]>([]);
  const [search, setSearch] = useState('');
  const [batchFilter, setBatchFilter] = useState('all');
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Profile | null>(null);
  const [studentData, setStudentData] = useState<{
    submissions: Submission[];
    quizAttempts: QuizAttempt[];
    activity: ActivityLog[];
    notebookCount: number;
  } | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const { data: labs } = await supabase.from('labs').select('batch_id').or(`teacher_id.eq.${profile.id},teacher_id.is.null`);
      const batchIds = (labs || []).map((l: any) => l.batch_id).filter(Boolean);
      const { data: bats } = await supabase.from('batches').select('*').in('id', batchIds.length > 0 ? batchIds : ['00000000-0000-0000-0000-000000000000']);
      setBatches(bats || []);

      const { data } = await supabase.from('profiles').select('*, batch(name)').eq('role', 'student').order('full_name');
      setStudents(data as any || []);
      setLoading(false);
    })();
  }, [profile]);

  const openStudent = async (student: Profile) => {
    setSelectedStudent(student);
    setLoadingDetail(true);
    const { data: subs } = await supabase.from('submissions').select('*, program(title, topic(name))').eq('student_id', student.id).order('submitted_at', { ascending: false });
    const { data: quizzes } = await supabase.from('quiz_attempts').select('*, quiz(title)').eq('student_id', student.id).order('attempted_at', { ascending: false });
    const { data: acts } = await supabase.from('activity_log').select('*').eq('user_id', student.id).order('activity_date');
    const { count } = await supabase.from('notebook_entries').select('*', { count: 'exact', head: true }).eq('student_id', student.id);
    setStudentData({
      submissions: subs as Submission[] || [],
      quizAttempts: quizzes as QuizAttempt[] || [],
      activity: acts as ActivityLog[] || [],
      notebookCount: count || 0,
    });
    setLoadingDetail(false);
  };

  if (loading) return <Spinner className="py-20" />;
  if (!profile) return null;

  const filtered = students.filter(s => {
    if (search && !s.full_name.toLowerCase().includes(search.toLowerCase()) && !(s.roll_number || '').toLowerCase().includes(search.toLowerCase())) return false;
    if (batchFilter !== 'all' && s.batch_id !== batchFilter) return false;
    return true;
  });

  const activityMap: Record<string, number> = {};
  if (studentData) {
    studentData.activity.forEach(a => { activityMap[a.activity_date] = (activityMap[a.activity_date] || 0) + 1; });
  }
  const { current, longest } = studentData ? calculateStreak(studentData.activity.map(a => a.activity_date)) : { current: 0, longest: 0 };
  const completed = studentData?.submissions.filter(s => s.status === 'completed').length || 0;
  const pending = studentData?.submissions.filter(s => s.status === 'attempted').length || 0;
  const totalPrograms = studentData?.submissions.length || 1;
  const completionRate = Math.round((completed / totalPrograms) * 100);
  const avgQuiz = studentData && studentData.quizAttempts.length > 0
    ? Math.round(studentData.quizAttempts.reduce((s, q) => s + Number(q.percentage), 0) / studentData.quizAttempts.length)
    : 0;

  // Topic-wise data
  const topicMap: Record<string, { name: string; completed: number; total: number }> = {};
  studentData?.submissions.forEach(s => {
    const topicName = (s as any).program?.topic?.name || 'Unknown';
    if (!topicMap[topicName]) topicMap[topicName] = { name: topicName, completed: 0, total: 0 };
    topicMap[topicName].total++;
    if (s.status === 'completed') topicMap[topicName].completed++;
  });
  const topicData = Object.values(topicMap).map(t => ({ ...t, pct: t.total > 0 ? Math.round((t.completed / t.total) * 100) : 0 }));

  const quizData = studentData?.quizAttempts.map((q, i) => ({ attempt: `Q${i + 1}`, score: Number(q.percentage) })) || [];

  // Attendance eligibility
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  const recentActivity = studentData?.activity.filter(a => new Date(a.activity_date) >= twoWeeksAgo).length || 0;
  const attendanceEligible = recentActivity >= 6;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Students</h2>
        <p className="mt-1 text-gray-500">Click any student to view their detailed progress profile.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input className="input pl-10" placeholder="Search by name or roll number..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input sm:w-48" value={batchFilter} onChange={(e) => setBatchFilter(e.target.value)}>
          <option value="all">All Batches</option>
          {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Users className="h-6 w-6" />} title="No students found" description="Students will appear here once they sign up." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => (
            <Card key={s.id} className="p-4" hover onClick={() => openStudent(s)}>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-accent-500 text-sm font-semibold text-white">
                  {s.full_name?.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">{s.full_name}</p>
                  <p className="text-xs text-gray-500">{s.roll_number || 'No roll'} · {(s as any).batch?.name || 'No batch'}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Student detail modal */}
      <Modal open={!!selectedStudent} onClose={() => { setSelectedStudent(null); setStudentData(null); }} title="Student Profile" size="xl">
        {selectedStudent && (
          loadingDetail ? <Spinner className="py-12" /> : (
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center gap-4 rounded-lg bg-gray-50 p-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-accent-500 text-lg font-bold text-white">
                  {selectedStudent.full_name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{selectedStudent.full_name}</h3>
                  <p className="text-sm text-gray-500">{selectedStudent.email} · {selectedStudent.roll_number || 'No roll'}</p>
                </div>
                <div className="ml-auto">
                  <div className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${attendanceEligible ? 'bg-success-50 text-success-700' : 'bg-warning-50 text-warning-700'}`}>
                    Attendance: {attendanceEligible ? 'Eligible' : 'At Risk'}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Card className="p-3 text-center">
                  <Target className="mx-auto h-5 w-5 text-primary-600" />
                  <p className="mt-1 text-xl font-bold text-gray-900">{completionRate}%</p>
                  <p className="text-xs text-gray-500">Completion</p>
                </Card>
                <Card className="p-3 text-center">
                  <Flame className="mx-auto h-5 w-5 text-orange-500" />
                  <p className="mt-1 text-xl font-bold text-gray-900">{current}</p>
                  <p className="text-xs text-gray-500">Current Streak</p>
                </Card>
                <Card className="p-3 text-center">
                  <Brain className="mx-auto h-5 w-5 text-accent-600" />
                  <p className="mt-1 text-xl font-bold text-gray-900">{avgQuiz}%</p>
                  <p className="text-xs text-gray-500">Quiz Avg</p>
                </Card>
                <Card className="p-3 text-center">
                  <BookOpen className="mx-auto h-5 w-5 text-success-600" />
                  <p className="mt-1 text-xl font-bold text-gray-900">{studentData?.notebookCount || 0}</p>
                  <p className="text-xs text-gray-500">Notebook Entries</p>
                </Card>
              </div>

              {/* Activity calendar */}
              <Card className="p-4">
                <p className="text-sm font-semibold text-gray-900">Activity Calendar (Longest: {longest} days)</p>
                <div className="mt-3">
                  <ActivityCalendar activityMap={activityMap} />
                </div>
              </Card>

              {/* Charts */}
              <div className="grid gap-4 lg:grid-cols-2">
                <Card className="p-4">
                  <p className="text-sm font-semibold text-gray-900">Topic-wise Progress</p>
                  {topicData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={topicData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} angle={-20} textAnchor="end" height={50} />
                        <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
                        <Bar dataKey="pct" fill="#2563eb" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <p className="py-8 text-center text-sm text-gray-400">No data</p>}
                </Card>
                <Card className="p-4">
                  <p className="text-sm font-semibold text-gray-900">Quiz Score Trend</p>
                  {quizData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={quizData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                        <XAxis dataKey="attempt" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
                        <Line type="monotone" dataKey="score" stroke="#06b6d4" strokeWidth={2} dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : <p className="py-8 text-center text-sm text-gray-400">No quiz attempts</p>}
                </Card>
              </div>

              {/* Submission history */}
              <Card className="p-4">
                <p className="text-sm font-semibold text-gray-900">Submission History</p>
                <div className="mt-2 max-h-48 overflow-y-auto space-y-2">
                  {studentData?.submissions.length === 0 ? (
                    <p className="py-4 text-center text-sm text-gray-400">No submissions</p>
                  ) : (
                    studentData?.submissions.slice(0, 10).map(s => (
                      <div key={s.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-gray-900">{(s as any).program?.title}</p>
                          <p className="text-xs text-gray-400">{timeAgo(s.submitted_at)}</p>
                        </div>
                        <Badge className={statusColor(s.status)}>{statusLabel(s.status)}</Badge>
                      </div>
                    ))
                  )}
                </div>
              </Card>

              {/* Recent activity */}
              <Card className="p-4">
                <p className="text-sm font-semibold text-gray-900">Recent Activity</p>
                <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
                  {studentData?.activity.length === 0 ? (
                    <p className="py-4 text-center text-sm text-gray-400">No activity</p>
                  ) : (
                    studentData?.activity.slice(-10).reverse().map(a => (
                      <div key={a.id} className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary-500" />
                        {a.description || a.activity_type} <span className="text-gray-400 ml-auto">{a.activity_date}</span>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>
          )
        )}
      </Modal>
    </div>
  );
}
