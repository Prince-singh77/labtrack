import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Card, Badge } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { EmptyState, Spinner } from '@/components/ui/EmptyState';
import { FlaskConical, Plus, Trash2, FolderOpen, Pencil } from 'lucide-react';
import type { Subject, Batch, Lab, Topic } from '@/types';

export function TeacherLabs() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [labs, setLabs] = useState<(Lab & { subject?: Subject; batch?: Batch; topics?: Topic[] })[]>([]);
  const [showLabModal, setShowLabModal] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showTopicModal, setShowTopicModal] = useState<Lab | null>(null);
  const [editingLab, setEditingLab] = useState<Lab | null>(null);
  const [labForm, setLabForm] = useState({ name: '', description: '', subject_id: '', batch_id: '' });
  const [subjectForm, setSubjectForm] = useState({ name: '', code: '', description: '' });
  const [topicForm, setTopicForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      await refresh();
      const { data: subs } = await supabase.from('subjects').select('*').order('name');
      setSubjects(subs as Subject[] || []);
      const { data: bats } = await supabase.from('batches').select('*').order('name');
      setBatches(bats as Batch[] || []);
      setLoading(false);
    })();
  }, [profile]);

  const refresh = async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('labs')
      .select('*, subject(*), batch(*), topics(*)')
      .or(`teacher_id.eq.${profile.id},teacher_id.is.null`)
      .order('created_at', { ascending: false });
    setLabs(data as any || []);
  };

  const saveLab = async () => {
    if (!profile) return;
    setSaving(true);
    if (editingLab) {
      await supabase.from('labs').update({
        name: labForm.name, description: labForm.description,
        subject_id: labForm.subject_id, batch_id: labForm.batch_id || null,
      }).eq('id', editingLab.id);
    } else {
      await supabase.from('labs').insert({
        name: labForm.name, description: labForm.description,
        subject_id: labForm.subject_id, batch_id: labForm.batch_id || null,
        teacher_id: profile.id,
      });
    }
    setSaving(false);
    setShowLabModal(false);
    setEditingLab(null);
    setLabForm({ name: '', description: '', subject_id: '', batch_id: '' });
    await refresh();
  };

  const saveSubject = async () => {
    setSaving(true);
    await supabase.from('subjects').insert(subjectForm);
    setSaving(false);
    setShowSubjectModal(false);
    setSubjectForm({ name: '', code: '', description: '' });
    const { data: subs } = await supabase.from('subjects').select('*').order('name');
    setSubjects(subs as Subject[] || []);
  };

  const saveTopic = async () => {
    if (!showTopicModal) return;
    setSaving(true);
    await supabase.from('topics').insert({
      lab_id: showTopicModal.id, name: topicForm.name, description: topicForm.description,
    });
    setSaving(false);
    setShowTopicModal(null);
    setTopicForm({ name: '', description: '' });
    await refresh();
  };

  const deleteLab = async (id: string) => {
    if (!confirm('Delete this lab and all its topics and programs?')) return;
    await supabase.from('labs').delete().eq('id', id);
    await refresh();
  };

  const openEditLab = (lab: Lab) => {
    setEditingLab(lab);
    setLabForm({ name: lab.name, description: lab.description || '', subject_id: lab.subject_id, batch_id: lab.batch_id || '' });
    setShowLabModal(true);
  };

  if (loading) return <Spinner className="py-20" />;
  if (!profile) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Labs</h2>
          <p className="mt-1 text-gray-500">Create and manage labs, subjects, and topics.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowSubjectModal(true)} className="btn-secondary">
            <Plus className="h-4 w-4" /> New Subject
          </button>
          <button onClick={() => { setEditingLab(null); setLabForm({ name: '', description: '', subject_id: '', batch_id: '' }); setShowLabModal(true); }} className="btn-primary">
            <Plus className="h-4 w-4" /> New Lab
          </button>
        </div>
      </div>

      {subjects.length === 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          Create a subject first before adding labs.
        </div>
      )}

      {labs.length === 0 ? (
        <EmptyState icon={<FlaskConical className="h-6 w-6" />} title="No labs yet" description="Create your first lab to start adding programs." />
      ) : (
        <div className="space-y-4">
          {labs.map((lab) => (
            <Card key={lab.id} className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent-50 text-accent-600">
                    <FlaskConical className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{lab.name}</h3>
                    <p className="text-sm text-gray-500">{lab.subject?.name} ({lab.subject?.code}) · {lab.batch?.name || 'No batch'}</p>
                    {lab.description && <p className="mt-1 text-sm text-gray-600">{lab.description}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => openEditLab(lab)} className="btn-ghost text-sm"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => deleteLab(lab.id)} className="btn-ghost text-sm text-error-600"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>

              <div className="mt-4 border-t border-gray-100 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-700">Topics</h4>
                  <button onClick={() => setShowTopicModal(lab)} className="btn-ghost text-xs"><Plus className="h-3 w-3" /> Add Topic</button>
                </div>
                {lab.topics && lab.topics.length > 0 ? (
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {lab.topics.map((topic) => (
                      <div key={topic.id} className="flex items-center gap-2 rounded-lg border border-gray-100 p-3">
                        <FolderOpen className="h-4 w-4 text-accent-500" />
                        <span className="text-sm text-gray-700">{topic.name}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">No topics yet. Add a topic to start creating programs.</p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Lab modal */}
      <Modal open={showLabModal} onClose={() => setShowLabModal(false)} title={editingLab ? 'Edit Lab' : 'Create Lab'}>
        <div className="space-y-4">
          <div>
            <label className="label">Lab Name</label>
            <input className="input" value={labForm.name} onChange={(e) => setLabForm({ ...labForm, name: e.target.value })} placeholder="e.g. Data Structures Lab" />
          </div>
          <div>
            <label className="label">Subject</label>
            <select className="input" value={labForm.subject_id} onChange={(e) => setLabForm({ ...labForm, subject_id: e.target.value })}>
              <option value="">Select subject</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
            </select>
          </div>
          <div>
            <label className="label">Batch</label>
            <select className="input" value={labForm.batch_id} onChange={(e) => setLabForm({ ...labForm, batch_id: e.target.value })}>
              <option value="">No batch (all students)</option>
              {batches.map(b => <option key={b.id} value={b.id}>{b.name} — {b.department}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows={3} value={labForm.description} onChange={(e) => setLabForm({ ...labForm, description: e.target.value })} placeholder="Lab description..." />
          </div>
          <button onClick={saveLab} disabled={saving || !labForm.name || !labForm.subject_id} className="btn-primary w-full">
            {saving ? 'Saving...' : editingLab ? 'Update Lab' : 'Create Lab'}
          </button>
        </div>
      </Modal>

      {/* Subject modal */}
      <Modal open={showSubjectModal} onClose={() => setShowSubjectModal(false)} title="New Subject">
        <div className="space-y-4">
          <div>
            <label className="label">Subject Name</label>
            <input className="input" value={subjectForm.name} onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })} placeholder="e.g. Data Structures" />
          </div>
          <div>
            <label className="label">Subject Code</label>
            <input className="input" value={subjectForm.code} onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })} placeholder="e.g. CS201" />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows={2} value={subjectForm.description} onChange={(e) => setSubjectForm({ ...subjectForm, description: e.target.value })} />
          </div>
          <button onClick={saveSubject} disabled={saving || !subjectForm.name || !subjectForm.code} className="btn-primary w-full">
            {saving ? 'Saving...' : 'Create Subject'}
          </button>
        </div>
      </Modal>

      {/* Topic modal */}
      <Modal open={!!showTopicModal} onClose={() => setShowTopicModal(null)} title={`Add Topic to ${showTopicModal?.name || ''}`}>
        <div className="space-y-4">
          <div>
            <label className="label">Topic Name</label>
            <input className="input" value={topicForm.name} onChange={(e) => setTopicForm({ ...topicForm, name: e.target.value })} placeholder="e.g. Arrays" />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows={2} value={topicForm.description} onChange={(e) => setTopicForm({ ...topicForm, description: e.target.value })} />
          </div>
          <button onClick={saveTopic} disabled={saving || !topicForm.name} className="btn-primary w-full">
            {saving ? 'Saving...' : 'Add Topic'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
