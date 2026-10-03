import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Card, Badge } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { EmptyState, Spinner } from '@/components/ui/EmptyState';
import { GraduationCap, Plus, Trash2, Pencil } from 'lucide-react';
import type { Batch } from '@/types';

export function AdminBatches() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [batches, setBatches] = useState<(Batch & { student_count?: number })[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Batch | null>(null);
  const [form, setForm] = useState({ name: '', year: '', department: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      await refresh();
      setLoading(false);
    })();
  }, [profile]);

  const refresh = async () => {
    const { data } = await supabase.from('batches').select('*').order('name');
    const batchesData = data as Batch[] || [];
    const withCounts = await Promise.all(batchesData.map(async b => {
      const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('batch_id', b.id).eq('role', 'student');
      return { ...b, student_count: count || 0 };
    }));
    setBatches(withCounts);
  };

  const save = async () => {
    if (!profile) return;
    setSaving(true);
    if (editing) {
      await supabase.from('batches').update(form).eq('id', editing.id);
    } else {
      await supabase.from('batches').insert({ ...form, created_by: profile.id });
    }
    setSaving(false);
    setShowModal(false);
    setEditing(null);
    setForm({ name: '', year: '', department: '' });
    await refresh();
  };

  const deleteBatch = async (id: string) => {
    if (!confirm('Delete this batch? Students in this batch will be unassigned.')) return;
    await supabase.from('batches').delete().eq('id', id);
    await refresh();
  };

  if (loading) return <Spinner className="py-20" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Batches</h2>
          <p className="mt-1 text-gray-500">Manage student batches and sections.</p>
        </div>
        <button onClick={() => { setEditing(null); setForm({ name: '', year: '', department: '' }); setShowModal(true); }} className="btn-primary">
          <Plus className="h-4 w-4" /> New Batch
        </button>
      </div>

      {batches.length === 0 ? (
        <EmptyState icon={<GraduationCap className="h-6 w-6" />} title="No batches yet" description="Create batches to organize students." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {batches.map((b) => (
            <Card key={b.id} className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success-50 text-success-600">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{b.name}</h3>
                    <p className="text-xs text-gray-500">{b.department} · {b.year}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditing(b); setForm({ name: b.name, year: b.year, department: b.department }); setShowModal(true); }} className="btn-ghost text-xs"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => deleteBatch(b.id)} className="btn-ghost text-xs text-error-600"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              <Badge className="text-primary-700 bg-primary-50 border-primary-200 mt-3">{b.student_count || 0} students</Badge>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Batch' : 'Create Batch'}>
        <div className="space-y-4">
          <div>
            <label className="label">Batch Name</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. CSE 2024 Batch A" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Year</label>
              <input className="input" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} placeholder="e.g. 2024" />
            </div>
            <div>
              <label className="label">Department</label>
              <input className="input" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="e.g. CSE" />
            </div>
          </div>
          <button onClick={save} disabled={saving || !form.name} className="btn-primary w-full">
            {saving ? 'Saving...' : editing ? 'Update Batch' : 'Create Batch'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
