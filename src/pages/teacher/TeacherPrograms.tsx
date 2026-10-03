import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Card, Badge } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { EmptyState, Spinner } from '@/components/ui/EmptyState';
import { difficultyColor, formatDate } from '@/lib/utils';
import { Code2, Plus, Pencil, Trash2, Clock } from 'lucide-react';
import type { Program, Topic, Lab } from '@/types';

export function TeacherPrograms() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [topics, setTopics] = useState<(Topic & { lab?: Lab; programs?: Program[] })[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [form, setForm] = useState({
    title: '', description: '', difficulty: 'easy', language: 'C',
    expected_output: '', marks: 10, deadline: '',
  });
  const [saving, setSaving] = useState(false);

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
    const { data } = await supabase
      .from('topics')
      .select('*, lab(*), programs(*)')
      .in('lab_id', labIds)
      .order('name');
    setTopics(data as any || []);
  };

  const saveProgram = async () => {
    if (!profile || !selectedTopic) return;
    setSaving(true);
    const payload = {
      topic_id: selectedTopic,
      title: form.title,
      description: form.description,
      difficulty: form.difficulty,
      language: form.language,
      expected_output: form.expected_output || null,
      marks: Number(form.marks),
      deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
    };
    if (editingProgram) {
      await supabase.from('programs').update(payload).eq('id', editingProgram.id);
    } else {
      await supabase.from('programs').insert({ ...payload, created_by: profile.id });
    }
    setSaving(false);
    setShowModal(false);
    setEditingProgram(null);
    resetForm();
    await refresh();
  };

  const resetForm = () => {
    setForm({ title: '', description: '', difficulty: 'easy', language: 'C', expected_output: '', marks: 10, deadline: '' });
  };

  const openEdit = (program: Program, topicId: string) => {
    setEditingProgram(program);
    setSelectedTopic(topicId);
    setForm({
      title: program.title,
      description: program.description,
      difficulty: program.difficulty,
      language: program.language,
      expected_output: program.expected_output || '',
      marks: program.marks,
      deadline: program.deadline ? new Date(program.deadline).toISOString().slice(0, 16) : '',
    });
    setShowModal(true);
  };

  const deleteProgram = async (id: string) => {
    if (!confirm('Delete this program and all its submissions?')) return;
    await supabase.from('programs').delete().eq('id', id);
    await refresh();
  };

  if (loading) return <Spinner className="py-20" />;
  if (!profile) return null;

  const allTopics = topics.flatMap(t => [{ id: t.id, label: `${t.lab?.name} → ${t.name}` }]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Programs</h2>
          <p className="mt-1 text-gray-500">Create programming questions for your lab topics.</p>
        </div>
        <button onClick={() => { setEditingProgram(null); resetForm(); setSelectedTopic(''); setShowModal(true); }} className="btn-primary">
          <Plus className="h-4 w-4" /> New Program
        </button>
      </div>

      {topics.length === 0 ? (
        <EmptyState icon={<Code2 className="h-6 w-6" />} title="No topics available" description="Create labs and topics first before adding programs." />
      ) : (
        <div className="space-y-4">
          {topics.map((topic) => (
            <Card key={topic.id} className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{topic.name}</h3>
                  <p className="text-xs text-gray-500">{topic.lab?.name}</p>
                </div>
                <Badge className="text-gray-600 bg-gray-50 border-gray-200">{topic.programs?.length || 0} programs</Badge>
              </div>
              {topic.programs && topic.programs.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {topic.programs.map((prog) => (
                    <div key={prog.id} className="rounded-lg border border-gray-100 p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 truncate">{prog.title}</h4>
                          <p className="text-xs text-gray-500 line-clamp-2 mt-1">{prog.description}</p>
                        </div>
                        <div className="flex gap-1 ml-2">
                          <button onClick={() => openEdit(prog, topic.id)} className="btn-ghost text-xs"><Pencil className="h-3.5 w-3.5" /></button>
                          <button onClick={() => deleteProgram(prog.id)} className="btn-ghost text-xs text-error-600"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        <Badge className={difficultyColor(prog.difficulty)}>{prog.difficulty}</Badge>
                        <Badge className="text-gray-600 bg-gray-50 border-gray-200">{prog.language}</Badge>
                        <Badge className="text-gray-600 bg-gray-50 border-gray-200">{prog.marks} marks</Badge>
                        {prog.deadline && <span className="flex items-center gap-1 text-xs text-gray-400"><Clock className="h-3 w-3" />{formatDate(prog.deadline)}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No programs yet.</p>
              )}
            </Card>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editingProgram ? 'Edit Program' : 'Create Program'} size="lg">
        <div className="space-y-4">
          <div>
            <label className="label">Topic</label>
            <select className="input" value={selectedTopic} onChange={(e) => setSelectedTopic(e.target.value)} disabled={!!editingProgram}>
              <option value="">Select a topic</option>
              {allTopics.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Title</label>
            <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Reverse an Array" />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe the problem..." />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label">Difficulty</label>
              <select className="input" value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="label">Language</label>
              <select className="input" value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })}>
                <option value="C">C</option>
                <option value="C++">C++</option>
                <option value="Java">Java</option>
                <option value="Python">Python</option>
              </select>
            </div>
            <div>
              <label className="label">Marks</label>
              <input type="number" className="input" value={form.marks} onChange={(e) => setForm({ ...form, marks: Number(e.target.value) })} />
            </div>
          </div>
          <div>
            <label className="label">Expected Output (optional)</label>
            <textarea className="input font-mono text-sm" rows={3} value={form.expected_output} onChange={(e) => setForm({ ...form, expected_output: e.target.value })} placeholder="Expected program output..." />
          </div>
          <div>
            <label className="label">Deadline (optional)</label>
            <input type="datetime-local" className="input" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
          </div>
          <button onClick={saveProgram} disabled={saving || !form.title || !form.description || !selectedTopic} className="btn-primary w-full">
            {saving ? 'Saving...' : editingProgram ? 'Update Program' : 'Create Program'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
