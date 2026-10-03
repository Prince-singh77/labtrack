import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Card, Badge } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { EmptyState, Spinner } from '@/components/ui/EmptyState';
import { BookOpen, Plus, Trash2, Pencil } from 'lucide-react';
import type { Subject } from '@/types';

export function AdminSubjects() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Subject | null>(null);
  const [form, setForm] = useState({ name: '', code: '', description: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      await refresh();
      setLoading(false);
    })();
  }, [profile]);

  const refresh = async () => {
    const { data } = await supabase.from('subjects').select('*').order('name');
    setSubjects(data as Subject[] || []);
  };

  const save = async () => {
    if (!profile) return;
    setSaving(true);
    if (editing) {
      await supabase.from('subjects').update(form).eq('id', editing.id);
    } else {
      await supabase.from('subjects').insert({ ...form, created_by: profile.id });
    }
    setSaving(false);
    setShowModal(false);
    setEditing(null);
    setForm({ name: '', code: '', description: '' });
    await refresh();
  };

  const deleteSubject = async (id: string) => {
    if (!confirm('Delete this subject and all its labs?')) return;
    await supabase.from('subjects').delete().eq('id', id);
    await refresh();
  };

  if (loading) return <Spinner className="py-20" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Subjects</h2>
          <p className="mt-1 text-gray-500">Manage academic subjects.</p>
        </div>
        <button onClick={() => { setEditing(null); setForm({ name: '', code: '', description: '' }); setShowModal(true); }} className="btn-primary">
          <Plus className="h-4 w-4" /> New Subject
        </button>
      </div>

      {subjects.length === 0 ? (
        <EmptyState icon={<BookOpen className="h-6 w-6" />} title="No subjects yet" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((s) => (
            <Card key={s.id} className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{s.name}</h3>
                    <Badge className="text-gray-600 bg-gray-50 border-gray-200 mt-1">{s.code}</Badge>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditing(s); setForm({ name: s.name, code: s.code, description: s.description || '' }); setShowModal(true); }} className="btn-ghost text-xs"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => deleteSubject(s.id)} className="btn-ghost text-xs text-error-600"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              {s.description && <p className="mt-3 text-sm text-gray-600">{s.description}</p>}
            </Card>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Subject' : 'Create Subject'}>
        <div className="space-y-4">
          <div>
            <label className="label">Subject Name</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Data Structures" />
          </div>
          <div>
            <label className="label">Subject Code</label>
            <input className="input" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g. CS201" />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <button onClick={save} disabled={saving || !form.name || !form.code} className="btn-primary w-full">
            {saving ? 'Saving...' : editing ? 'Update Subject' : 'Create Subject'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
