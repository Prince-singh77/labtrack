import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Card, Badge } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { EmptyState, Spinner } from '@/components/ui/EmptyState';
import { difficultyColor, statusColor, statusLabel, formatDate } from '@/lib/utils';
import { Code2, Search, Send, FileText, Clock, BookOpen } from 'lucide-react';
import type { Program, Submission } from '@/types';

export function StudentPractice() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [programs, setPrograms] = useState<(Program & { topic?: any })[]>([]);
  const [submissions, setSubmissions] = useState<Map<string, Submission>>(new Map());
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [explanation, setExplanation] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const { data: labs } = await supabase
        .from('labs')
        .select('topics(id, programs(*, topic(*)))')
        .eq('batch_id', profile.batch_id);

      const allPrograms: (Program & { topic?: any })[] = [];
      (labs || []).forEach((lab: any) => {
        (lab.topics || []).forEach((topic: any) => {
          (topic.programs || []).forEach((prog: any) => allPrograms.push(prog));
        });
      });
      setPrograms(allPrograms);

      const { data: subs } = await supabase
        .from('submissions')
        .select('*')
        .eq('student_id', profile.id);
      const map = new Map<string, Submission>();
      (subs || []).forEach((s: Submission) => map.set(s.program_id, s));
      setSubmissions(map);

      setLoading(false);
    })();
  }, [profile]);

  const handleSubmit = async () => {
    if (!profile || !selectedProgram) return;
    setSubmitting(true);

    const existing = submissions.get(selectedProgram.id);
    const status = 'attempted';

    if (existing) {
      const { error } = await supabase
        .from('submissions')
        .update({ code, output, explanation, status, submitted_at: new Date().toISOString() })
        .eq('id', existing.id);
      if (error) { alert(error.message); setSubmitting(false); return; }
    } else {
      const { error } = await supabase
        .from('submissions')
        .insert({ program_id: selectedProgram.id, student_id: profile.id, code, output, explanation, status });
      if (error) { alert(error.message); setSubmitting(false); return; }
    }

    // Log activity
    await supabase.from('activity_log').insert({
      user_id: profile.id,
      activity_type: 'submission',
      description: `Submitted "${selectedProgram.title}"`,
      metadata: { program_id: selectedProgram.id },
    });

    // Refresh submissions
    const { data: subs } = await supabase
      .from('submissions')
      .select('*')
      .eq('student_id', profile.id);
    const map = new Map<string, Submission>();
    (subs || []).forEach((s: Submission) => map.set(s.program_id, s));
    setSubmissions(map);

    setSubmitting(false);
    setSelectedProgram(null);
    setCode('');
    setOutput('');
    setExplanation('');
  };

  const openProgram = (program: Program) => {
    const existing = submissions.get(program.id);
    setSelectedProgram(program);
    setCode(existing?.code || '');
    setOutput(existing?.output || '');
    setExplanation(existing?.explanation || '');
  };

  if (loading) return <Spinner className="py-20" />;
  if (!profile) return null;

  const filtered = programs.filter(p => {
    if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
    const sub = submissions.get(p.id);
    const status = sub?.status || 'not_started';
    if (filterStatus !== 'all' && status !== filterStatus) return false;
    if (filterDifficulty !== 'all' && p.difficulty !== filterDifficulty) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Practice</h2>
        <p className="mt-1 text-gray-500">Start working on your assigned programming questions.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input className="input pl-10" placeholder="Search programs..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input sm:w-40" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="all">All Status</option>
          <option value="not_started">Not Started</option>
          <option value="attempted">Attempted</option>
          <option value="passed">Passed</option>
          <option value="completed">Completed</option>
        </select>
        <select className="input sm:w-36" value={filterDifficulty} onChange={(e) => setFilterDifficulty(e.target.value)}>
          <option value="all">All Levels</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Code2 className="h-6 w-6" />} title="No programs found" description="Try adjusting your filters or search." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((program) => {
            const sub = submissions.get(program.id);
            const status = sub?.status || 'not_started';
            return (
              <Card key={program.id} className="p-5" hover onClick={() => openProgram(program)}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                      <Code2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{program.title}</h3>
                      <p className="text-xs text-gray-500">{program.topic?.name} · {program.language}</p>
                    </div>
                  </div>
                  <Badge className={statusColor(status)}>{statusLabel(status)}</Badge>
                </div>
                <p className="mt-3 line-clamp-2 text-sm text-gray-600">{program.description}</p>
                <div className="mt-3 flex items-center gap-2">
                  <Badge className={difficultyColor(program.difficulty)}>{program.difficulty}</Badge>
                  <Badge className="text-gray-600 bg-gray-50 border-gray-200">{program.marks} marks</Badge>
                  {program.deadline && (
                    <span className="ml-auto flex items-center gap-1 text-xs text-gray-400">
                      <Clock className="h-3 w-3" /> {formatDate(program.deadline)}
                    </span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Submission modal */}
      <Modal open={!!selectedProgram} onClose={() => setSelectedProgram(null)} title="Submit Program" size="lg">
        {selectedProgram && (
          <div className="space-y-4">
            <div className="rounded-lg bg-gray-50 p-4">
              <h4 className="font-semibold text-gray-900">{selectedProgram.title}</h4>
              <p className="mt-1 text-sm text-gray-600">{selectedProgram.description}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge className={difficultyColor(selectedProgram.difficulty)}>{selectedProgram.difficulty}</Badge>
                <Badge className="text-gray-600 bg-white border-gray-200">{selectedProgram.language}</Badge>
                <Badge className="text-gray-600 bg-white border-gray-200">{selectedProgram.marks} marks</Badge>
              </div>
              {selectedProgram.expected_output && (
                <div className="mt-3">
                  <p className="text-xs font-semibold text-gray-500">Expected Output:</p>
                  <pre className="mt-1 rounded-md bg-gray-900 p-3 text-xs text-green-400 overflow-x-auto">{selectedProgram.expected_output}</pre>
                </div>
              )}
            </div>

            <div>
              <label className="label">Your Code <span className="text-gray-400 font-normal">(paste from VS Code)</span></label>
              <textarea
                className="input font-mono text-sm"
                rows={10}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="// Paste your code here..."
              />
            </div>
            <div>
              <label className="label">Output</label>
              <textarea
                className="input font-mono text-sm"
                rows={4}
                value={output}
                onChange={(e) => setOutput(e.target.value)}
                placeholder="Paste your program output here..."
              />
            </div>
            <div>
              <label className="label">Short Explanation</label>
              <textarea
                className="input"
                rows={3}
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="Briefly explain how your program works..."
              />
            </div>

            <div className="flex items-center justify-between border-t border-gray-100 pt-4">
              <p className="text-xs text-gray-500">You write and run code in VS Code on your computer. Submit your code, output, and explanation here for teacher verification.</p>
              <button onClick={handleSubmit} disabled={submitting || !code.trim()} className="btn-primary">
                <Send className="h-4 w-4" /> {submitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
