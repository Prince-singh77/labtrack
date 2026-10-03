import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Card, Badge } from '@/components/ui/Card';
import { EmptyState, Spinner } from '@/components/ui/EmptyState';
import { Users, Search, GraduationCap, Mail } from 'lucide-react';
import type { Profile, Batch } from '@/types';

export function AdminUsers() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<(Profile & { batch?: Batch })[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('profiles').select('*, batch(name)').order('created_at', { ascending: false });
      setUsers(data as any || []);
      setLoading(false);
    })();
  }, [profile]);

  if (loading) return <Spinner className="py-20" />;

  const filtered = users.filter(u => {
    if (search) {
      const q = search.toLowerCase();
      if (!u.full_name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q) && !(u.roll_number || '').toLowerCase().includes(q)) return false;
    }
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    return true;
  });

  const updateRole = async (id: string, role: string) => {
    await supabase.from('profiles').update({ role }).eq('id', id);
    setUsers(prev => prev.map(u => u.id === id ? { ...u, role: role as any } : u));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
        <p className="mt-1 text-gray-500">View and manage all users. Change roles as needed.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input className="input pl-10" placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input sm:w-40" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="all">All Roles</option>
          <option value="student">Students</option>
          <option value="teacher">Teachers</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Users className="h-6 w-6" />} title="No users found" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs font-semibold text-gray-500">
                <th className="pb-3 pr-4">Name</th>
                <th className="pb-3 pr-4 hidden sm:table-cell">Email</th>
                <th className="pb-3 pr-4 hidden md:table-cell">Roll No</th>
                <th className="pb-3 pr-4 hidden lg:table-cell">Batch</th>
                <th className="pb-3">Role</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b border-gray-100">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-accent-500 text-xs font-semibold text-white">
                        {u.full_name?.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-gray-900">{u.full_name}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4 hidden sm:table-cell text-sm text-gray-600">{u.email}</td>
                  <td className="py-3 pr-4 hidden md:table-cell text-sm text-gray-600">{u.roll_number || '—'}</td>
                  <td className="py-3 pr-4 hidden lg:table-cell text-sm text-gray-600">{u.batch?.name || '—'}</td>
                  <td className="py-3">
                    <select
                      value={u.role}
                      onChange={(e) => updateRole(u.id, e.target.value)}
                      className="rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-700 focus:border-primary-500 focus:outline-none"
                    >
                      <option value="student">Student</option>
                      <option value="teacher">Teacher</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
