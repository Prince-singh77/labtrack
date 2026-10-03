import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Card, Badge } from '@/components/ui/Card';
import { EmptyState, Spinner } from '@/components/ui/EmptyState';
import { timeAgo } from '@/lib/utils';
import { HelpCircle, Send, MessageSquare } from 'lucide-react';
import type { HelpRequest } from '@/types';

export function TeacherHelpRequests() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<(HelpRequest & { student?: any; program?: any })[]>([]);
  const [responding, setResponding] = useState<HelpRequest | null>(null);
  const [response, setResponse] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      await refresh();
      setLoading(false);
    })();
  }, [profile]);

  const refresh = async () => {
    const { data } = await supabase
      .from('help_requests')
      .select('*, student(full_name, email, roll_number), program(title)')
      .order('created_at', { ascending: false });
    setRequests(data as any || []);
  };

  const submitResponse = async () => {
    if (!responding || !profile) return;
    setSaving(true);
    await supabase.from('help_requests').update({
      response,
      status: 'answered',
      responded_by: profile.id,
      responded_at: new Date().toISOString(),
    }).eq('id', responding.id);
    setSaving(false);
    setResponding(null);
    setResponse('');
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
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Help Requests</h2>
        <p className="mt-1 text-gray-500">Respond to student help requests.</p>
      </div>

      {requests.length === 0 ? (
        <EmptyState icon={<HelpCircle className="h-6 w-6" />} title="No help requests" description="Student questions will appear here." />
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <Card key={r.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={r.status === 'open' ? 'text-warning-700 bg-warning-50 border-warning-200' : r.status === 'answered' ? 'text-success-700 bg-success-50 border-success-200' : 'text-gray-600 bg-gray-50 border-gray-200'}>
                      {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                    </Badge>
                    <span className="text-sm font-medium text-gray-900">{r.student?.full_name}</span>
                    {r.program && <span className="text-xs text-gray-500">· {r.program.title}</span>}
                    <span className="text-xs text-gray-400">{timeAgo(r.created_at)}</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-700">{r.question}</p>
                  {r.response && (
                    <div className="mt-3 flex items-start gap-2 rounded-lg bg-blue-50 p-3">
                      <MessageSquare className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-blue-800">{r.response}</p>
                    </div>
                  )}
                </div>
                <div className="flex gap-1">
                  {r.status === 'open' && (
                    <button onClick={() => { setResponding(r); setResponse(''); }} className="btn-secondary text-sm">
                      <Send className="h-4 w-4" /> Respond
                    </button>
                  )}
                  {r.status !== 'closed' && (
                    <button onClick={() => closeRequest(r.id)} className="btn-ghost text-xs">Close</button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {responding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setResponding(null)} />
          <div className="relative z-10 w-full max-w-lg rounded-xl bg-white shadow-2xl animate-scale-in p-6">
            <h3 className="text-lg font-semibold text-gray-900">Respond to Help Request</h3>
            <div className="mt-3 rounded-lg bg-gray-50 p-3">
              <p className="text-sm text-gray-700">{responding.question}</p>
              <p className="mt-1 text-xs text-gray-400">{responding.student?.full_name}</p>
            </div>
            <div className="mt-4">
              <label className="label">Your Response</label>
              <textarea className="input" rows={4} value={response} onChange={(e) => setResponse(e.target.value)} placeholder="Type your response..." />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setResponding(null)} className="btn-secondary">Cancel</button>
              <button onClick={submitResponse} disabled={saving || !response.trim()} className="btn-primary">
                {saving ? 'Sending...' : 'Send Response'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
