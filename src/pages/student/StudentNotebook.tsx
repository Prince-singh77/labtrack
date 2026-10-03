import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Card, Badge } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { EmptyState, Spinner } from '@/components/ui/EmptyState';
import { BookOpen, FileText, Printer, Save, Pencil } from 'lucide-react';
import type { NotebookEntry, Program, Submission } from '@/types';

export function StudentNotebook() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<(NotebookEntry & { program?: Program })[]>([]);
  const [editingEntry, setEditingEntry] = useState<NotebookEntry | null>(null);
  const [editForm, setEditForm] = useState({
    aim: '', theory: '', algorithm: '', result: '', viva_questions: '' ,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      await refreshEntries(profile.id);
      setLoading(false);
    })();
  }, [profile]);

  const refreshEntries = async (studentId: string) => {
    const { data } = await supabase
      .from('notebook_entries')
      .select('*, program(*)')
      .eq('student_id', studentId)
      .order('experiment_number', { ascending: true });
    setEntries(data as any || []);
  };

  // Auto-create notebook entries for completed programs that don't have one
  useEffect(() => {
    if (!profile || loading) return;
    (async () => {
      const { data: subs } = await supabase
        .from('submissions')
        .select('*, program(*)')
        .eq('student_id', profile.id)
        .eq('status', 'completed');

      const existingProgramIds = entries.map(e => e.program_id);
      const newCompleted = (subs || []).filter((s: any) => !existingProgramIds.includes(s.program_id));

      if (newCompleted.length === 0) return;

      // Get AI note templates for matching topics
      const maxExpNum = entries.length > 0 ? Math.max(...entries.map(e => e.experiment_number || 0)) : 0;

      for (const sub of newCompleted) {
        const program = (sub as any).program;
        const topicName = (program as any)?.topic?.name || '';

        const { data: template } = await supabase
          .from('ai_note_templates')
          .select('*')
          .ilike('topic', `%${topicName}%`)
          .maybeSingle();

        const expNum = maxExpNum + newCompleted.indexOf(sub) + 1;

        await supabase.from('notebook_entries').insert({
          program_id: sub.program_id,
          student_id: profile.id,
          experiment_number: expNum,
          title: program?.title || '',
          aim: template?.aim || `Write a program to ${program?.title?.toLowerCase() || 'demonstrate the concept'}.`,
          theory: template?.theory || 'Theory content will be added here. Describe the concepts used in this program.',
          algorithm: template?.algorithm || '1. Start\n2. Declare variables\n3. Read input\n4. Process data\n5. Display output\n6. Stop',
          code: sub.code,
          output: sub.output,
          result: 'The program was executed successfully and produced the expected output.',
          viva_questions: template?.viva_questions || ['What is the purpose of this program?', 'Explain the logic used.'],
          status: 'draft',
        });
      }

      await refreshEntries(profile.id);
    })();
  }, [profile, loading, entries.length]);

  const openEdit = (entry: NotebookEntry) => {
    setEditingEntry(entry);
    setEditForm({
      aim: entry.aim || '',
      theory: entry.theory || '',
      algorithm: entry.algorithm || '',
      result: entry.result || '',
      viva_questions: Array.isArray(entry.viva_questions) ? entry.viva_questions.join('\n') : '',
    });
  };

  const saveEntry = async () => {
    if (!editingEntry) return;
    setSaving(true);
    const vivaArray = editForm.viva_questions.split('\n').filter(q => q.trim());
    await supabase.from('notebook_entries').update({
      aim: editForm.aim,
      theory: editForm.theory,
      algorithm: editForm.algorithm,
      result: editForm.result,
      viva_questions: vivaArray,
      status: 'completed',
      updated_at: new Date().toISOString(),
    }).eq('id', editingEntry.id);

    if (profile) await refreshEntries(profile.id);
    setSaving(false);
    setEditingEntry(null);
  };

  const printEntry = (entry: NotebookEntry & { program?: Program }) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const viva = Array.isArray(entry.viva_questions) ? entry.viva_questions : [];
    printWindow.document.write(`
      <html><head><title>Experiment ${entry.experiment_number}</title>
      <style>
        body { font-family: 'Times New Roman', serif; max-width: 800px; margin: 40px auto; padding: 20px; }
        h1 { text-align: center; font-size: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
        h2 { font-size: 16px; margin-top: 24px; }
        pre { background: #f5f5f5; padding: 12px; border-radius: 4px; font-size: 13px; overflow-x: auto; }
        .viva { margin-left: 20px; }
        .meta { text-align: center; color: #666; font-size: 14px; margin-bottom: 20px; }
      </style></head><body>
      <h1>Experiment No. ${entry.experiment_number}</h1>
      <p class="meta"><strong>${entry.title || entry.program?.title}</strong></p>
      <h2>Aim</h2><p>${entry.aim || ''}</p>
      <h2>Theory</h2><p>${(entry.theory || '').replace(/\n/g, '<br>')}</p>
      <h2>Algorithm</h2><pre>${entry.algorithm || ''}</pre>
      <h2>Program Code</h2><pre>${entry.code || ''}</pre>
      <h2>Output</h2><pre>${entry.output || ''}</pre>
      <h2>Result</h2><p>${entry.result || ''}</p>
      <h2>Viva Questions</h2>
      <ol class="viva">${viva.map(q => `<li>${q}</li>`).join('')}</ol>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (loading) return <Spinner className="py-20" />;
  if (!profile) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Practical Notebook</h2>
          <p className="mt-1 text-gray-500">Auto-generated notebook entries from your completed programs.</p>
        </div>
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
        Notebook entries are auto-created when your teacher verifies a program as completed. Your submitted code remains unchanged. You can edit the theory, algorithm, and viva questions.
      </div>

      {entries.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-6 w-6" />}
          title="No notebook entries yet"
          description="Complete programs and get them verified by your teacher to auto-generate notebook entries."
        />
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <Card key={entry.id} className="overflow-hidden">
              <div className="border-b border-gray-100 p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge className="text-primary-700 bg-primary-50 border-primary-200">Experiment #{entry.experiment_number}</Badge>
                      <Badge className={entry.status === 'completed' ? 'text-success-700 bg-success-50 border-success-200' : 'text-warning-700 bg-warning-50 border-warning-200'}>
                        {entry.status === 'completed' ? 'Completed' : 'Draft'}
                      </Badge>
                    </div>
                    <h3 className="mt-2 font-semibold text-gray-900">{entry.title || entry.program?.title}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(entry)} className="btn-ghost text-sm">
                      <Pencil className="h-4 w-4" /> Edit
                    </button>
                    <button onClick={() => printEntry(entry)} className="btn-ghost text-sm">
                      <Printer className="h-4 w-4" /> Print
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-5 space-y-3 text-sm">
                <div><span className="font-semibold text-gray-700">Aim: </span><span className="text-gray-600">{entry.aim}</span></div>
                <div>
                  <span className="font-semibold text-gray-700">Code:</span>
                  <pre className="mt-1 rounded-md bg-gray-900 p-3 text-xs text-green-400 overflow-x-auto max-h-48">{entry.code}</pre>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Output:</span>
                  <pre className="mt-1 rounded-md bg-gray-100 p-3 text-xs text-gray-700 overflow-x-auto">{entry.output}</pre>
                </div>
                {Array.isArray(entry.viva_questions) && entry.viva_questions.length > 0 && (
                  <div>
                    <span className="font-semibold text-gray-700">Viva Questions:</span>
                    <ol className="mt-1 ml-5 list-decimal text-gray-600">
                      {entry.viva_questions.map((q, i) => <li key={i}>{q}</li>)}
                    </ol>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Edit modal */}
      <Modal open={!!editingEntry} onClose={() => setEditingEntry(null)} title="Edit Notebook Entry" size="lg">
        {editingEntry && (
          <div className="space-y-4">
            <div className="rounded-md bg-gray-50 p-3">
              <p className="text-sm font-semibold text-gray-700">Experiment #{editingEntry.experiment_number}: {editingEntry.title}</p>
              <p className="text-xs text-gray-500">Your code is locked and cannot be modified.</p>
            </div>
            <div>
              <label className="label">Aim</label>
              <textarea className="input" rows={2} value={editForm.aim} onChange={(e) => setEditForm({ ...editForm, aim: e.target.value })} />
            </div>
            <div>
              <label className="label">Theory</label>
              <textarea className="input" rows={5} value={editForm.theory} onChange={(e) => setEditForm({ ...editForm, theory: e.target.value })} />
            </div>
            <div>
              <label className="label">Algorithm</label>
              <textarea className="input font-mono text-sm" rows={6} value={editForm.algorithm} onChange={(e) => setEditForm({ ...editForm, algorithm: e.target.value })} />
            </div>
            <div>
              <label className="label">Result</label>
              <textarea className="input" rows={2} value={editForm.result} onChange={(e) => setEditForm({ ...editForm, result: e.target.value })} />
            </div>
            <div>
              <label className="label">Viva Questions (one per line)</label>
              <textarea className="input" rows={4} value={editForm.viva_questions} onChange={(e) => setEditForm({ ...editForm, viva_questions: e.target.value })} />
            </div>
            <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
              <button onClick={() => setEditingEntry(null)} className="btn-secondary">Cancel</button>
              <button onClick={saveEntry} disabled={saving} className="btn-primary">
                <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save Entry'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
