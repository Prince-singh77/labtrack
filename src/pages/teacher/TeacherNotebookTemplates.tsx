import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Card, Badge } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { EmptyState, Spinner } from '@/components/ui/EmptyState';
import { BookOpen, Plus, Pencil, Trash2, Eye } from 'lucide-react';
import type { NotebookTemplate, Lab } from '@/types';

const sectionLabels: Record<string, string> = {
  experiment_number: 'Experiment Number',
  title: 'Title',
  aim: 'Aim',
  theory: 'Theory',
  algorithm: 'Algorithm',
  code: 'Code',
  output: 'Output',
  result: 'Result',
  viva_questions: 'Viva Questions',
};

const allSections = Object.keys(sectionLabels);

export function TeacherNotebookTemplates() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<(NotebookTemplate & { lab?: Lab })[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<NotebookTemplate | null>(null);
  const [form, setForm] = useState({ title: '', lab_id: '', sections: allSections });
  const [previewTemplate, setPreviewTemplate] = useState<NotebookTemplate | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      await refresh();
      const { data: labData } = await supabase.from('labs').select('*').or(`teacher_id.eq.${profile.id},teacher_id.is.null`).order('name');
      setLabs(labData as Lab[] || []);
      setLoading(false);
    })();
  }, [profile]);

  const refresh = async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('notebook_templates')
      .select('*, lab(name)')
      .order('created_at', { ascending: false });
    setTemplates(data as any || []);
  };

  const save = async () => {
    if (!profile) return;
    setSaving(true);
    const payload = { title: form.title, lab_id: form.lab_id || null, sections: form.sections };
    if (editing) {
      await supabase.from('notebook_templates').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('notebook_templates').insert({ ...payload, created_by: profile.id });
    }
    setSaving(false);
    setShowModal(false);
    setEditing(null);
    setForm({ title: '', lab_id: '', sections: allSections });
    await refresh();
  };

  const toggleSection = (section: string) => {
    setForm(prev => ({
      ...prev,
      sections: prev.sections.includes(section)
        ? prev.sections.filter(s => s !== section)
        : [...prev.sections, section],
    }));
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm('Delete this template?')) return;
    await supabase.from('notebook_templates').delete().eq('id', id);
    await refresh();
  };

  if (loading) return <Spinner className="py-20" />;
  if (!profile) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Notebook Templates</h2>
          <p className="mt-1 text-gray-500">Design custom practical notebook templates for your labs.</p>
        </div>
        <button onClick={() => { setEditing(null); setForm({ title: '', lab_id: '', sections: allSections }); setShowModal(true); }} className="btn-primary">
          <Plus className="h-4 w-4" /> New Template
        </button>
      </div>

      {templates.length === 0 ? (
        <EmptyState icon={<BookOpen className="h-6 w-6" />} title="No templates yet" description="Create a notebook template to define which sections students see." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {templates.map((tpl) => (
            <Card key={tpl.id} className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success-50 text-success-600">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{tpl.title}</h3>
                    <p className="text-xs text-gray-500">{tpl.lab?.name || 'No lab assigned'}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setPreviewTemplate(tpl)} className="btn-ghost text-xs"><Eye className="h-4 w-4" /></button>
                  <button onClick={() => { setEditing(tpl); setForm({ title: tpl.title, lab_id: tpl.lab_id || '', sections: tpl.sections }); setShowModal(true); }} className="btn-ghost text-xs"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => deleteTemplate(tpl.id)} className="btn-ghost text-xs text-error-600"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {tpl.sections.map(s => (
                  <Badge key={s} className="text-gray-600 bg-gray-50 border-gray-200">{sectionLabels[s] || s}</Badge>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Template' : 'Create Template'}>
        <div className="space-y-4">
          <div>
            <label className="label">Template Title</label>
            <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Standard Practical Notebook" />
          </div>
          <div>
            <label className="label">Assign to Lab</label>
            <select className="input" value={form.lab_id} onChange={(e) => setForm({ ...form, lab_id: e.target.value })}>
              <option value="">No lab (general template)</option>
              {labs.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Sections</label>
            <div className="space-y-2">
              {allSections.map(s => (
                <label key={s} className="flex items-center gap-2 rounded-lg border border-gray-100 p-2.5 cursor-pointer hover:bg-gray-50">
                  <input type="checkbox" checked={form.sections.includes(s)} onChange={() => toggleSection(s)} className="rounded text-primary-600" />
                  <span className="text-sm text-gray-700">{sectionLabels[s]}</span>
                </label>
              ))}
            </div>
          </div>
          <button onClick={save} disabled={saving || !form.title} className="btn-primary w-full">
            {saving ? 'Saving...' : editing ? 'Update Template' : 'Create Template'}
          </button>
        </div>
      </Modal>

      {/* Preview modal */}
      <Modal open={!!previewTemplate} onClose={() => setPreviewTemplate(null)} title="Template Preview" size="lg">
        {previewTemplate && (
          <div className="space-y-3">
            <div className="border-b-2 border-gray-900 pb-2">
              <p className="text-center text-xs font-bold uppercase tracking-wider text-gray-500">Laboratory Record</p>
              <p className="mt-1 text-center text-lg font-bold text-gray-900">{previewTemplate.title}</p>
            </div>
            {previewTemplate.sections.map(s => (
              <div key={s}>
                <p className="font-semibold text-sm text-gray-700">{sectionLabels[s] || s}</p>
                <div className="mt-1 rounded-md border border-dashed border-gray-200 p-4 text-xs text-gray-400">
                  {s === 'code' ? '// Student code will appear here (locked)' :
                   s === 'output' ? '// Program output will appear here' :
                   s === 'experiment_number' ? '1' :
                   'Content will be filled when the program is completed.'}
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
