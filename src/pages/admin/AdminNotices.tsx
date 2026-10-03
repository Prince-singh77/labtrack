import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Card, Badge } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { EmptyState, Spinner } from '@/components/ui/EmptyState';
import { timeAgo } from '@/lib/utils';
import { Bell, Plus, Trash2, Zap } from 'lucide-react';
import type { Notice } from '@/types';

export function AdminNotices() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', audience: 'all' as const });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('notices').select('*').order('created_at', { ascending: false });
      setNotices(data as Notice[] || []);
      setLoading(false);
    })();
  }, [profile]);

  const save = async () => {
    if (!profile) return;
    setSaving(true);
    await supabase.from('notices').insert({ ...form, created_by: profile.id });
    setSaving(false);
    setShowModal(false);
    setForm({ title: '', content: '', audience: 'all' });
    const { data } = await supabase.from('notices').select('*').order('created_at', { ascending: false });
    setNotices(data as Notice[] || []);
  };

  const deleteNotice = async (id: string) => {
    if (!confirm('Delete this notice?')) return;
    await supabase.from('notices').delete().eq('id', id);
    const { data } = await supabase.from('notices').select('*').order('created_at', { ascending: false });
    setNotices(data as Notice[] || []);
  };

  if (loading) return <Spinner className="py-20" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Notices</h2>
          <p className="mt-1 text-gray-500">Post system-wide announcements.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus className="h-4 w-4" /> New Notice
        </button>
      </div>

      {notices.length === 0 ? (
        <EmptyState icon={<Bell className="h-6 w-6" />} title="No notices" />
      ) : (
        <div className="space-y-3">
          {notices.map((n) => (
            <Card key={n.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-50 text-accent-600 flex-shrink-0">
                    <Zap className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{n.title}</h3>
                      <Badge className="text-gray-600 bg-gray-50 border-gray-200 capitalize">{n.audience}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">{n.content}</p>
                    <p className="mt-2 text-xs text-gray-400">{timeAgo(n.created_at)}</p>
                  </div>
                </div>
                <button onClick={() => deleteNotice(n.id)} className="btn-ghost text-xs text-error-600"><Trash2 className="h-4 w-4" /></button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="New Notice">
        <div className="space-y-4">
          <div>
            <label className="label">Title</label>
            <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="label">Content</label>
            <textarea className="input" rows={4} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
          </div>
          <div>
            <label className="label">Audience</label>
            <select className="input" value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value as any })}>
              <option value="all">Everyone</option>
              <option value="students">Students Only</option>
              <option value="teachers">Teachers Only</option>
            </select>
          </div>
          <button onClick={save} disabled={saving || !form.title || !form.content} className="btn-primary w-full">
            {saving ? 'Posting...' : 'Post Notice'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
