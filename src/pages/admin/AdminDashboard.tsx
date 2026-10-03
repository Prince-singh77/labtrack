import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Card, StatCard, Badge } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/EmptyState';
import { timeAgo } from '@/lib/utils';
import {
  Users, GraduationCap, BookOpen, FlaskConical, Bell, Code2, Brain, Award, ClipboardList
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

export function AdminDashboard() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    students: 0, teachers: 0, batches: 0, subjects: 0, labs: 0, programs: 0, quizzes: 0, achievements: 0,
  });
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [roleData, setRoleData] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { count: students } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student');
      const { count: teachers } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'teacher');
      const { count: batches } = await supabase.from('batches').select('*', { count: 'exact', head: true });
      const { count: subjects } = await supabase.from('subjects').select('*', { count: 'exact', head: true });
      const { count: labs } = await supabase.from('labs').select('*', { count: 'exact', head: true });
      const { count: programs } = await supabase.from('programs').select('*', { count: 'exact', head: true });
      const { count: quizzes } = await supabase.from('quizzes').select('*', { count: 'exact', head: true });
      const { count: achievements } = await supabase.from('achievements').select('*', { count: 'exact', head: true });

      setStats({ students: students || 0, teachers: teachers || 0, batches: batches || 0, subjects: subjects || 0, labs: labs || 0, programs: programs || 0, quizzes: quizzes || 0, achievements: achievements || 0 });

      const { data: recent } = await supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(5);
      setRecentUsers(recent || []);

      setRoleData([
        { name: 'Students', value: students || 0, fill: '#2563eb' },
        { name: 'Teachers', value: teachers || 0, fill: '#0891b2' },
      ]);

      setLoading(false);
    })();
  }, [profile]);

  if (loading) return <Spinner className="py-20" />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Admin Dashboard</h2>
        <p className="mt-1 text-gray-500">Manage users, batches, subjects, labs, and system-wide settings.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Students" value={stats.students} icon={<Users className="h-5 w-5" />} color="primary" />
        <StatCard label="Teachers" value={stats.teachers} icon={<GraduationCap className="h-5 w-5" />} color="accent" />
        <StatCard label="Batches" value={stats.batches} icon={<GraduationCap className="h-5 w-5" />} color="success" />
        <StatCard label="Subjects" value={stats.subjects} icon={<BookOpen className="h-5 w-5" />} color="warning" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Labs" value={stats.labs} icon={<FlaskConical className="h-5 w-5" />} color="primary" />
        <StatCard label="Programs" value={stats.programs} icon={<Code2 className="h-5 w-5" />} color="accent" />
        <StatCard label="Quizzes" value={stats.quizzes} icon={<Brain className="h-5 w-5" />} color="success" />
        <StatCard label="Achievements" value={stats.achievements} icon={<Award className="h-5 w-5" />} color="warning" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="font-semibold text-gray-900">User Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={roleData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {roleData.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold text-gray-900">Recent Users</h3>
          {recentUsers.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">No users yet</p>
          ) : (
            <div className="mt-3 space-y-2">
              {recentUsers.map((u) => (
                <div key={u.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-accent-500 text-sm font-semibold text-white">
                      {u.full_name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{u.full_name}</p>
                      <p className="text-xs text-gray-500">{u.email}</p>
                    </div>
                  </div>
                  <Badge className={
                    u.role === 'admin' ? 'text-warning-700 bg-warning-50 border-warning-200' :
                    u.role === 'teacher' ? 'text-accent-700 bg-accent-50 border-accent-200' :
                    'text-primary-700 bg-primary-50 border-primary-200'
                  }>{u.role}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
