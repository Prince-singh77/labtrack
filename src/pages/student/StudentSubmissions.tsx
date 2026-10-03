import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Card, Badge } from '@/components/ui/Card';
import { EmptyState, Spinner } from '@/components/ui/EmptyState';
import { statusColor, statusLabel, formatDateTime, difficultyColor } from '@/lib/utils';
import { FileText, Search } from 'lucide-react';
import type { Submission } from '@/types';

export function StudentSubmissions() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const { data } = await supabase
        .from('submissions')
        .select('*, program(*)')
        .eq('student_id', profile.id)
        .order('submitted_at', { ascending: false });
      setSubmissions(data as Submission[] || []);
      setLoading(false);
    })();
  }, [profile]);

  if (loading) return <Spinner className="py-20" />;
  if (!profile) return null;

  const filtered = submissions.filter(s => {
    if (search && !s.program?.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterStatus !== 'all' && s.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">My Submissions</h2>
        <p className="mt-1 text-gray-500">Track the status of all your program submissions.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input className="input pl-10" placeholder="Search submissions..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input sm:w-40" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="all">All Status</option>
          <option value="attempted">Attempted</option>
          <option value="passed">Passed</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<FileText className="h-6 w-6" />} title="No submissions yet" description="Go to Practice to start submitting programs." />
      ) : (
        <div className="space-y-3">
          {filtered.map((s) => (
            <Card key={s.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-gray-900">{s.program?.title || 'Unknown'}</h3>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <Badge className={statusColor(s.status)}>{statusLabel(s.status)}</Badge>
                    {s.program && <Badge className={difficultyColor(s.program.difficulty)}>{s.program.difficulty}</Badge>}
                    <span className="text-xs text-gray-400">Submitted {formatDateTime(s.submitted_at)}</span>
                  </div>
                  {s.feedback && (
                    <div className="mt-2 rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-700">
                      <span className="font-semibold">Teacher feedback:</span> {s.feedback}
                    </div>
                  )}
                  {s.code && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs font-medium text-primary-600">View code</summary>
                      <pre className="mt-1 rounded-md bg-gray-900 p-3 text-xs text-gray-300 overflow-x-auto max-h-48">{s.code}</pre>
                    </details>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
