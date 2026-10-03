import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Card, Badge } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { EmptyState, Spinner } from '@/components/ui/EmptyState';
import { statusColor, statusLabel, formatDateTime, difficultyColor } from '@/lib/utils';
import { FileText, Search, CheckCircle2, XCircle, MessageSquare } from 'lucide-react';
import type { Submission } from '@/types';

export function TeacherSubmissions() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState<(Submission & { student?: any; program?: any })[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [reviewing, setReviewing] = useState<Submission | null>(null);
  const [feedback, setFeedback] = useState('');
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      await refresh();
      setLoading(false);
    })();
  }, [profile]);

  const refresh = async () => {
    if (!profile) return;
    const { data: labs } = await supabase.from('labs').select('id').or(`teacher_id.eq.${profile.id},teacher_id.is.null`);
    const labIds = (labs || []).map((l: any) => l.id);
    const { data: topics } = await supabase.from('topics').select('id').in('lab_id', labIds);
    const topicIds = (topics || []).map((t: any) => t.id);
    const { data: programs } = await supabase.from('programs').select('id').in('topic_id', topicIds);
    const programIds = (programs || []).map((p: any) => p.id);

    const { data } = await supabase
      .from('submissions')
      .select('*, student(full_name, email, roll_number), program(title, difficulty, language, topic(name))')
      .in('program_id', programIds)
      .order('submitted_at', { ascending: false });
    setSubmissions(data as any || []);
  };

  const openReview = (sub: Submission) => {
    setReviewing(sub);
    setFeedback(sub.feedback || '');
  };

  const verifySubmission = async (status: 'completed' | 'passed') => {
    if (!reviewing || !profile) return;
    setVerifying(true);
    await supabase.from('submissions').update({
      status,
      feedback,
      verified_by: profile.id,
      verified_at: new Date().toISOString(),
    }).eq('id', reviewing.id);

    if (status === 'completed') {
      await supabase.from('activity_log').insert({
        user_id: reviewing.student_id,
        activity_type: 'program_completed',
        description: `Program verified as completed: ${reviewing.program?.title}`,
        metadata: { program_id: reviewing.program_id },
      });
    }

    setVerifying(false);
    setReviewing(null);
    await refresh();
  };

  if (loading) return <Spinner className="py-20" />;
  if (!profile) return null;

  const filtered = submissions.filter(s => {
    if (search) {
      const q = search.toLowerCase();
      if (!s.student?.full_name?.toLowerCase().includes(q) && !s.program?.title?.toLowerCase().includes(q)) return false;
    }
    if (filterStatus !== 'all' && s.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Submissions</h2>
        <p className="mt-1 text-gray-500">Review and verify student submissions.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input className="input pl-10" placeholder="Search by student or program..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input sm:w-40" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="all">All Status</option>
          <option value="attempted">Attempted</option>
          <option value="passed">Passed</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<FileText className="h-6 w-6" />} title="No submissions" description="Student submissions will appear here for review." />
      ) : (
        <div className="space-y-3">
          {filtered.map((s) => (
            <Card key={s.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium text-gray-900">{s.program?.title}</h3>
                    <Badge className={statusColor(s.status)}>{statusLabel(s.status)}</Badge>
                    {s.program && <Badge className={difficultyColor(s.program.difficulty)}>{s.program.difficulty}</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    {s.student?.full_name} ({s.student?.roll_number || 'no roll'}) · {formatDateTime(s.submitted_at)}
                  </p>
                  {s.feedback && <p className="mt-1 text-xs text-blue-600">Feedback: {s.feedback}</p>}
                </div>
                <button onClick={() => openReview(s)} className="btn-secondary text-sm">
                  <MessageSquare className="h-4 w-4" /> Review
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Review modal */}
      <Modal open={!!reviewing} onClose={() => setReviewing(null)} title="Review Submission" size="lg">
        {reviewing && (
          <div className="space-y-4">
            <div className="rounded-lg bg-gray-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{reviewing.program?.title}</p>
                  <p className="text-sm text-gray-500">{reviewing.student?.full_name} · {reviewing.program?.language}</p>
                </div>
                <Badge className={statusColor(reviewing.status)}>{statusLabel(reviewing.status)}</Badge>
              </div>
            </div>
            <div>
              <label className="label">Student Code</label>
              <pre className="rounded-md bg-gray-900 p-4 text-xs text-green-400 overflow-x-auto max-h-64">{reviewing.code}</pre>
            </div>
            <div>
              <label className="label">Output</label>
              <pre className="rounded-md bg-gray-100 p-3 text-xs text-gray-700 overflow-x-auto">{reviewing.output}</pre>
            </div>
            <div>
              <label className="label">Explanation</label>
              <p className="text-sm text-gray-600 rounded-md bg-gray-50 p-3">{reviewing.explanation}</p>
            </div>
            <div>
              <label className="label">Feedback (optional)</label>
              <textarea className="input" rows={3} value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Provide feedback to the student..." />
            </div>
            <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
              <button onClick={() => verifySubmission('passed')} disabled={verifying} className="btn-secondary">
                <CheckCircle2 className="h-4 w-4 text-blue-600" /> Mark Passed
              </button>
              <button onClick={() => verifySubmission('completed')} disabled={verifying} className="btn-primary">
                <CheckCircle2 className="h-4 w-4" /> Verify & Complete
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
