import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Card, Badge } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { EmptyState, Spinner } from '@/components/ui/EmptyState';
import { Brain, Plus, Trash2, Pencil, HelpCircle, ListChecks } from 'lucide-react';
import type { Quiz, QuizQuestion, Topic, Lab } from '@/types';

export function TeacherQuizzes() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [quizzes, setQuizzes] = useState<(Quiz & { topic?: any; quiz_questions?: QuizQuestion[] })[]>([]);
  const [topics, setTopics] = useState<{ id: string; label: string }[]>([]);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [quizForm, setQuizForm] = useState({ title: '', description: '', topic_id: '', passing_score: 50 });
  const [showQuestionModal, setShowQuestionModal] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [questionForm, setQuestionForm] = useState({
    question_type: 'mcq' as const, question: '', options: ['', '', '', ''],
    correct_answer: '', explanation: '', marks: 1,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      await refresh();
      const { data: labs } = await supabase.from('labs').select('id, name').or(`teacher_id.eq.${profile.id},teacher_id.is.null`);
      const labIds = (labs || []).map((l: any) => l.id);
      const { data: tops } = await supabase.from('topics').select('id, name, lab(name)').in('lab_id', labIds);
      setTopics((tops || []).map((t: any) => ({ id: t.id, label: `${t.lab?.name} → ${t.name}` })));
      setLoading(false);
    })();
  }, [profile]);

  const refresh = async () => {
    if (!profile) return;
    const { data: labs } = await supabase.from('labs').select('id').or(`teacher_id.eq.${profile.id},teacher_id.is.null`);
    const labIds = (labs || []).map((l: any) => l.id);
    const { data: tops } = await supabase.from('topics').select('id').in('lab_id', labIds);
    const topicIds = (tops || []).map((t: any) => t.id);
    const { data } = await supabase
      .from('quizzes')
      .select('*, topic(name, lab(name)), quiz_questions(*)')
      .in('topic_id', topicIds)
      .order('created_at', { ascending: false });
    setQuizzes(data as any || []);
  };

  const saveQuiz = async () => {
    if (!profile) return;
    setSaving(true);
    if (editingQuiz) {
      await supabase.from('quizzes').update({
        title: quizForm.title, description: quizForm.description,
        topic_id: quizForm.topic_id, passing_score: Number(quizForm.passing_score),
      }).eq('id', editingQuiz.id);
    } else {
      await supabase.from('quizzes').insert({
        title: quizForm.title, description: quizForm.description,
        topic_id: quizForm.topic_id, passing_score: Number(quizForm.passing_score),
        created_by: profile.id,
      });
    }
    setSaving(false);
    setShowQuizModal(false);
    setEditingQuiz(null);
    setQuizForm({ title: '', description: '', topic_id: '', passing_score: 50 });
    await refresh();
  };

  const deleteQuiz = async (id: string) => {
    if (!confirm('Delete this quiz and all its questions?')) return;
    await supabase.from('quizzes').delete().eq('id', id);
    await refresh();
  };

  const openQuestions = async (quiz: Quiz) => {
    setShowQuestionModal(quiz);
    const { data } = await supabase.from('quiz_questions').select('*').eq('quiz_id', quiz.id).order('created_at');
    setQuestions(data as QuizQuestion[] || []);
  };

  const addQuestion = async () => {
    if (!showQuestionModal) return;
    setSaving(true);
    const opts = questionForm.question_type === 'mcq' || questionForm.question_type === 'output'
      ? questionForm.options.filter(o => o.trim())
      : [];
    await supabase.from('quiz_questions').insert({
      quiz_id: showQuestionModal.id,
      question_type: questionForm.question_type,
      question: questionForm.question,
      options: opts,
      correct_answer: questionForm.correct_answer,
      explanation: questionForm.explanation || null,
      marks: Number(questionForm.marks),
    });
    setSaving(false);
    setQuestionForm({ question_type: 'mcq', question: '', options: ['', '', '', ''], correct_answer: '', explanation: '', marks: 1 });
    await openQuestions(showQuestionModal);
  };

  const deleteQuestion = async (id: string) => {
    await supabase.from('quiz_questions').delete().eq('id', id);
    if (showQuestionModal) await openQuestions(showQuestionModal);
  };

  if (loading) return <Spinner className="py-20" />;
  if (!profile) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Quizzes</h2>
          <p className="mt-1 text-gray-500">Create quizzes with MCQ, output, debug, and concept questions.</p>
        </div>
        <button onClick={() => { setEditingQuiz(null); setQuizForm({ title: '', description: '', topic_id: '', passing_score: 50 }); setShowQuizModal(true); }} className="btn-primary">
          <Plus className="h-4 w-4" /> New Quiz
        </button>
      </div>

      {quizzes.length === 0 ? (
        <EmptyState icon={<Brain className="h-6 w-6" />} title="No quizzes yet" description="Create quizzes and assign them to topics." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {quizzes.map((quiz) => (
            <Card key={quiz.id} className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-50 text-accent-600">
                    <Brain className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{quiz.title}</h3>
                    <p className="text-xs text-gray-500">{quiz.topic?.name}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openQuestions(quiz)} className="btn-ghost text-xs"><ListChecks className="h-4 w-4" /></button>
                  <button onClick={() => { setEditingQuiz(quiz); setQuizForm({ title: quiz.title, description: quiz.description || '', topic_id: quiz.topic_id, passing_score: quiz.passing_score }); setShowQuizModal(true); }} className="btn-ghost text-xs"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => deleteQuiz(quiz.id)} className="btn-ghost text-xs text-error-600"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              {quiz.description && <p className="mt-3 text-sm text-gray-600">{quiz.description}</p>}
              <div className="mt-3 flex items-center gap-2">
                <Badge className="text-gray-600 bg-gray-50 border-gray-200">Pass: {quiz.passing_score}%</Badge>
                <Badge className="text-gray-600 bg-gray-50 border-gray-200">{quiz.quiz_questions?.length || 0} questions</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Quiz modal */}
      <Modal open={showQuizModal} onClose={() => setShowQuizModal(false)} title={editingQuiz ? 'Edit Quiz' : 'Create Quiz'}>
        <div className="space-y-4">
          <div>
            <label className="label">Quiz Title</label>
            <input className="input" value={quizForm.title} onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })} placeholder="e.g. Arrays Quiz" />
          </div>
          <div>
            <label className="label">Topic</label>
            <select className="input" value={quizForm.topic_id} onChange={(e) => setQuizForm({ ...quizForm, topic_id: e.target.value })}>
              <option value="">Select topic</option>
              {topics.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows={2} value={quizForm.description} onChange={(e) => setQuizForm({ ...quizForm, description: e.target.value })} />
          </div>
          <div>
            <label className="label">Passing Score (%)</label>
            <input type="number" className="input" value={quizForm.passing_score} onChange={(e) => setQuizForm({ ...quizForm, passing_score: Number(e.target.value) })} />
          </div>
          <button onClick={saveQuiz} disabled={saving || !quizForm.title || !quizForm.topic_id} className="btn-primary w-full">
            {saving ? 'Saving...' : editingQuiz ? 'Update Quiz' : 'Create Quiz'}
          </button>
        </div>
      </Modal>

      {/* Questions modal */}
      <Modal open={!!showQuestionModal} onClose={() => setShowQuestionModal(null)} title={`Questions — ${showQuestionModal?.title || ''}`} size="lg">
        <div className="space-y-4">
          <div className="rounded-lg border border-gray-100 p-4">
            <p className="text-sm text-gray-600 mb-3">Quiz unlocks when all programs in the topic are completed by the student.</p>
            <h4 className="text-sm font-semibold text-gray-900">Existing Questions</h4>
            {questions.length === 0 ? (
              <p className="mt-2 text-sm text-gray-400">No questions yet.</p>
            ) : (
              <div className="mt-2 space-y-2">
                {questions.map((q, i) => (
                  <div key={q.id} className="flex items-start justify-between rounded-lg border border-gray-100 p-3">
                    <div className="flex-1">
                      <Badge className="text-accent-700 bg-accent-50 border-accent-200 capitalize mr-2">{q.question_type}</Badge>
                      <span className="text-sm text-gray-700">{i + 1}. {q.question}</span>
                    </div>
                    <button onClick={() => deleteQuestion(q.id)} className="btn-ghost text-xs text-error-600"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            <h4 className="text-sm font-semibold text-gray-900">Add Question</h4>
            <div className="mt-3 space-y-3">
              <div>
                <label className="label">Type</label>
                <select className="input" value={questionForm.question_type} onChange={(e) => setQuestionForm({ ...questionForm, question_type: e.target.value as any })}>
                  <option value="mcq">MCQ</option>
                  <option value="output">Output-based</option>
                  <option value="debug">Debugging</option>
                  <option value="concept">Concept</option>
                </select>
              </div>
              <div>
                <label className="label">Question</label>
                <textarea className="input" rows={2} value={questionForm.question} onChange={(e) => setQuestionForm({ ...questionForm, question: e.target.value })} />
              </div>
              {(questionForm.question_type === 'mcq' || questionForm.question_type === 'output') && (
                <div>
                  <label className="label">Options (2-4)</label>
                  <div className="space-y-2">
                    {questionForm.options.map((opt, i) => (
                      <input key={i} className="input" value={opt} onChange={(e) => {
                        const newOpts = [...questionForm.options];
                        newOpts[i] = e.target.value;
                        setQuestionForm({ ...questionForm, options: newOpts });
                      }} placeholder={`Option ${i + 1}`} />
                    ))}
                  </div>
                </div>
              )}
              <div>
                <label className="label">Correct Answer</label>
                <input className="input" value={questionForm.correct_answer} onChange={(e) => setQuestionForm({ ...questionForm, correct_answer: e.target.value })} placeholder="Exact correct answer or option text" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Explanation (optional)</label>
                  <input className="input" value={questionForm.explanation} onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })} />
                </div>
                <div>
                  <label className="label">Marks</label>
                  <input type="number" className="input" value={questionForm.marks} onChange={(e) => setQuestionForm({ ...questionForm, marks: Number(e.target.value) })} />
                </div>
              </div>
              <button onClick={addQuestion} disabled={saving || !questionForm.question || !questionForm.correct_answer} className="btn-primary w-full">
                <Plus className="h-4 w-4" /> {saving ? 'Adding...' : 'Add Question'}
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
