import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Card, Badge } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { EmptyState, Spinner } from '@/components/ui/EmptyState';
import { HelpCircle, Send, MessageSquare } from 'lucide-react';
import { timeAgo } from '@/lib/utils';
import type { HelpRequest, Program } from '@/types';

export function StudentHelpRequests() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<(HelpRequest & { program?: Program })[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [question, setQuestion] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      await refresh();
      const { data: labs } = await supabase
        .from('labs')
        .select('topics(id, programs(*))')
        .eq('batch_id', profile.batch_id);
      const allProgs: Program[] = [];
      (labs || []).forEach((lab: any) => (lab.topics || []).forEach((t: any) => (t.programs || []).forEach((p: Program) => allProgs.push(p))));
      setPrograms(allProgs);
      setLoading(false);
    })();
  }, [profile]);

  const refresh = async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('help_requests')
      .select('*, program(*)')
      .eq('student_id', profile.id)
      .order('created_at', { ascending: false });
    setRequests(data as any || []);
  };

  const submitRequest = async () => {
    if (!profile || !question.trim()) return;
    setSubmitting(true);
    const { error } = await supabase.from('help_requests').insert({
      student_id: profile.id,
      program_id: selectedProgram || null,
      question: question.trim(),
    });
    if (error) { alert(error.message); setSubmitting(false); return; }
    setQuestion('');
    setSelectedProgram('');
    setShowModal(false);
    setSubmitting(false);
    await refresh();
  };

  const closeRequest = async (id: string) => {
    await supabase.from('help_requests').update({ status: 'closed' }).eq('id', id);
    await refresh();
  };

  if (loading) return <Spinner className="py-20" />;
  if (!profile) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Help Requests</h2>
          <p className="mt-1 text-gray-500">Ask your teachers for help on specific programs.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Send className="h-4 w-4" /> New Request
        </button>
      </div>

      {requests.length === 0 ? (
        <EmptyState icon={<HelpCircle className="h-6 w-6" />} title="No help requests" description="Stuck on a program? Ask for help here." />
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <Card key={r.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge className={
                      r.status === 'open' ? 'text-warning-700 bg-warning-50 border-warning-200' :
                      r.status === 'answered' ? 'text-success-700 bg-success-50 border-success-200' :
                      'text-gray-600 bg-gray-50 border-gray-200'
                    }>
                      {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                    </Badge>
                    {r.program && <span className="text-xs text-gray-500">{r.program.title}</span>}
                    <span className="text-xs text-gray-400">{timeAgo(r.created_at)}</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-900">{r.question}</p>
                  {r.response && (
                    <div className="mt-3 flex items-start gap-2 rounded-lg bg-blue-50 p-3">
                      <MessageSquare className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-blue-700">Teacher Response</p>
                        <p className="mt-1 text-sm text-blue-800">{r.response}</p>
                      </div>
                    </div>
                  )}
                </div>
                {r.status !== 'closed' && (
                  <button onClick={() => closeRequest(r.id)} className="btn-ghost text-xs">Close</button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="New Help Request">
        <div className="space-y-4">
          <div>
            <label className="label">Related Program (optional)</label>
            <select className="input" value={selectedProgram} onChange={(e) => setSelectedProgram(e.target.value)}>
              <option value="">General question</option>
              {programs.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Your Question</label>
            <textarea className="input" rows={4} value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Describe what you're stuck on..." />
          </div>
          <button onClick={submitRequest} disabled={submitting || !question.trim()} className="btn-primary w-full">
            {submitting ? 'Sending...' : 'Send Request'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
