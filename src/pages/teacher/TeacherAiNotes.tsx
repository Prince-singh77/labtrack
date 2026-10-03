import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Card, Badge } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { EmptyState, Spinner } from '@/components/ui/EmptyState';
import { Zap, Plus, Pencil, Trash2, Sparkles, FileText } from 'lucide-react';
import type { AiNoteTemplate } from '@/types';

const commonTopics = ['Arrays', 'Loops', 'Functions', 'Pointers', 'Recursion', 'Sorting', 'Structures', 'Linked Lists', 'Stacks', 'Queues', 'Trees', 'Graphs'];

export function TeacherAiNotes() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<AiNoteTemplate[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<AiNoteTemplate | null>(null);
  const [form, setForm] = useState({ topic: '', language: 'C', aim: '', theory: '', algorithm: '', explanation: '', viva_questions: '' });
  const [viewTemplate, setViewTemplate] = useState<AiNoteTemplate | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const { data } = await supabase.from('ai_note_templates').select('*').order('topic');
      setTemplates(data as AiNoteTemplate[] || []);
      setLoading(false);
    })();
  }, [profile]);

  const save = async () => {
    setSaving(true);
    const vivaArray = form.viva_questions.split('\n').filter(q => q.trim());
    const payload = {
      topic: form.topic, language: form.language,
      aim: form.aim, theory: form.theory, algorithm: form.algorithm,
      explanation: form.explanation, viva_questions: vivaArray,
    };
    if (editing) {
      await supabase.from('ai_note_templates').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('ai_note_templates').insert(payload);
    }
    setSaving(false);
    setShowModal(false);
    setEditing(null);
    setForm({ topic: '', language: 'C', aim: '', theory: '', algorithm: '', explanation: '', viva_questions: '' });
    const { data } = await supabase.from('ai_note_templates').select('*').order('topic');
    setTemplates(data as AiNoteTemplate[] || []);
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm('Delete this AI note template?')) return;
    await supabase.from('ai_note_templates').delete().eq('id', id);
    const { data } = await supabase.from('ai_note_templates').select('*').order('topic');
    setTemplates(data as AiNoteTemplate[] || []);
  };

  if (loading) return <Spinner className="py-20" />;
  if (!profile) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">AI Notes</h2>
          <p className="mt-1 text-gray-500">Template-based educational content generator. No paid AI API required.</p>
        </div>
        <button onClick={() => { setEditing(null); setForm({ topic: '', language: 'C', aim: '', theory: '', algorithm: '', explanation: '', viva_questions: '' }); setShowModal(true); }} className="btn-primary">
          <Plus className="h-4 w-4" /> New Template
        </button>
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
        AI Notes uses predefined educational templates. When a student views a notebook entry for a topic, the matching template auto-fills the aim, theory, algorithm, and viva questions. No external API is needed.
      </div>

      {templates.length === 0 ? (
        <EmptyState icon={<Zap className="h-6 w-6" />} title="No note templates yet" description="Create templates for common programming topics to auto-fill notebook content." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {templates.map((tpl) => (
            <Card key={tpl.id} className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <Zap className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{tpl.topic}</h3>
                    <Badge className="text-gray-600 bg-gray-50 border-gray-200 mt-1">{tpl.language}</Badge>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setViewTemplate(tpl)} className="btn-ghost text-xs"><FileText className="h-4 w-4" /></button>
                  <button onClick={() => { setEditing(tpl); setForm({ topic: tpl.topic, language: tpl.language, aim: tpl.aim || '', theory: tpl.theory || '', algorithm: tpl.algorithm || '', explanation: tpl.explanation || '', viva_questions: Array.isArray(tpl.viva_questions) ? tpl.viva_questions.join('\n') : '' }); setShowModal(true); }} className="btn-ghost text-xs"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => deleteTemplate(tpl.id)} className="btn-ghost text-xs text-error-600"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              <p className="mt-3 text-sm text-gray-600 line-clamp-2">{tpl.aim}</p>
              {Array.isArray(tpl.viva_questions) && tpl.viva_questions.length > 0 && (
                <p className="mt-1 text-xs text-gray-400">{tpl.viva_questions.length} viva questions</p>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Note Template' : 'Create Note Template'} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Topic</label>
              <input className="input" list="topics" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} placeholder="e.g. Arrays" />
              <datalist id="topics">
                {commonTopics.map(t => <option key={t} value={t} />)}
              </datalist>
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
          </div>
          <div>
            <label className="label">Aim</label>
            <textarea className="input" rows={2} value={form.aim} onChange={(e) => setForm({ ...form, aim: e.target.value })} placeholder="Write a program to..." />
          </div>
          <div>
            <label className="label">Theory</label>
            <textarea className="input" rows={5} value={form.theory} onChange={(e) => setForm({ ...form, theory: e.target.value })} placeholder="Explain the theoretical concepts..." />
          </div>
          <div>
            <label className="label">Algorithm</label>
            <textarea className="input font-mono text-sm" rows={5} value={form.algorithm} onChange={(e) => setForm({ ...form, algorithm: e.target.value })} placeholder="1. Start&#10;2. ...&#10;3. Stop" />
          </div>
          <div>
            <label className="label">Explanation</label>
            <textarea className="input" rows={3} value={form.explanation} onChange={(e) => setForm({ ...form, explanation: e.target.value })} placeholder="Brief explanation..." />
          </div>
          <div>
            <label className="label">Viva Questions (one per line)</label>
            <textarea className="input" rows={4} value={form.viva_questions} onChange={(e) => setForm({ ...form, viva_questions: e.target.value })} placeholder="What is an array?&#10;How is an array stored in memory?" />
          </div>
          <button onClick={save} disabled={saving || !form.topic} className="btn-primary w-full">
            {saving ? 'Saving...' : editing ? 'Update Template' : 'Create Template'}
          </button>
        </div>
      </Modal>

      {/* View modal */}
      <Modal open={!!viewTemplate} onClose={() => setViewTemplate(null)} title={`${viewTemplate?.topic} — Notes`} size="lg">
        {viewTemplate && (
          <div className="space-y-4">
            <div><span className="font-semibold text-gray-700">Aim: </span><span className="text-gray-600">{viewTemplate.aim}</span></div>
            <div><span className="font-semibold text-gray-700">Theory: </span><p className="mt-1 text-sm text-gray-600 whitespace-pre-wrap">{viewTemplate.theory}</p></div>
            <div><span className="font-semibold text-gray-700">Algorithm: </span><pre className="mt-1 rounded-md bg-gray-100 p-3 text-sm text-gray-700 whitespace-pre-wrap">{viewTemplate.algorithm}</pre></div>
            {viewTemplate.explanation && <div><span className="font-semibold text-gray-700">Explanation: </span><p className="text-sm text-gray-600">{viewTemplate.explanation}</p></div>}
            {Array.isArray(viewTemplate.viva_questions) && viewTemplate.viva_questions.length > 0 && (
              <div>
                <span className="font-semibold text-gray-700">Viva Questions:</span>
                <ol className="mt-1 ml-5 list-decimal text-sm text-gray-600">
                  {viewTemplate.viva_questions.map((q, i) => <li key={i}>{q}</li>)}
                </ol>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
