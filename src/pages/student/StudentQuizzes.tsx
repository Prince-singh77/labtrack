import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Card, Badge } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { EmptyState, Spinner } from '@/components/ui/EmptyState';
import { Brain, Lock, CheckCircle2, Trophy, ChevronRight } from 'lucide-react';
import type { Quiz, QuizQuestion, Submission, Program } from '@/types';

export function StudentQuizzes() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [quizzes, setQuizzes] = useState<(Quiz & { topic?: any; programs?: Program[] })[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ score: number; total: number; pct: number } | null>(null);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const { data: labs } = await supabase
        .from('labs')
        .select('topics(id, programs(*), quizzes(*, topic(*)))')
        .eq('batch_id', profile.batch_id);

      const allQuizzes: any[] = [];
      const allPrograms: Program[] = [];
      (labs || []).forEach((lab: any) => {
        (lab.topics || []).forEach((t: any) => {
          (t.programs || []).forEach((p: Program) => allPrograms.push(p));
          (t.quizzes || []).forEach((q: any) => {
            allQuizzes.push({ ...q, programs: t.programs || [] });
          });
        });
      });
      setQuizzes(allQuizzes);

      const { data: subs } = await supabase.from('submissions').select('*').eq('student_id', profile.id);
      setSubmissions(subs as Submission[] || []);

      const { data: atts } = await supabase.from('quiz_attempts').select('*, quiz(*)').eq('student_id', profile.id).order('attempted_at', { ascending: false });
      setAttempts(atts || []);

      setLoading(false);
    })();
  }, [profile]);

  const isQuizUnlocked = (quiz: any) => {
    if (!quiz.programs || quiz.programs.length === 0) return true;
    const completedProgramIds = submissions.filter(s => s.status === 'completed').map(s => s.program_id);
    return quiz.programs.every((p: Program) => completedProgramIds.includes(p.id));
  };

  const openQuiz = async (quiz: Quiz) => {
    if (!isQuizUnlocked(quiz as any)) return;
    const { data } = await supabase.from('quiz_questions').select('*').eq('quiz_id', quiz.id);
    setQuestions(data as QuizQuestion[] || []);
    setAnswers({});
    setResult(null);
    setActiveQuiz(quiz);
  };

  const submitQuiz = async () => {
    if (!profile || !activeQuiz) return;
    setSubmitting(true);

    let score = 0;
    let total = 0;
    questions.forEach(q => {
      total += q.marks;
      if (answers[q.id] === q.correct_answer) score += q.marks;
    });
    const pct = total > 0 ? Math.round((score / total) * 100) : 0;

    await supabase.from('quiz_attempts').insert({
      quiz_id: activeQuiz.id,
      student_id: profile.id,
      score,
      total,
      percentage: pct,
      answers: questions.map(q => ({ question_id: q.id, answer: answers[q.id] || '', correct: answers[q.id] === q.correct_answer })),
    });

    await supabase.from('activity_log').insert({
      user_id: profile.id,
      activity_type: 'quiz',
      description: `Attempted quiz "${activeQuiz.title}" — ${pct}%`,
      metadata: { quiz_id: activeQuiz.id, score: pct },
    });

    setResult({ score, total, pct });
    setSubmitting(false);

    // Refresh attempts
    const { data: atts } = await supabase.from('quiz_attempts').select('*, quiz(*)').eq('student_id', profile.id).order('attempted_at', { ascending: false });
    setAttempts(atts || []);
  };

  if (loading) return <Spinner className="py-20" />;
  if (!profile) return null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Quizzes</h2>
        <p className="mt-1 text-gray-500">Quizzes unlock after you complete the required programs for each topic.</p>
      </div>

      {quizzes.length === 0 ? (
        <EmptyState icon={<Brain className="h-6 w-6" />} title="No quizzes available" description="Quizzes will appear here once your teacher creates them." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {quizzes.map((quiz) => {
            const unlocked = isQuizUnlocked(quiz);
            const quizAttempts = attempts.filter(a => a.quiz_id === quiz.id);
            const bestScore = quizAttempts.length > 0 ? Math.max(...quizAttempts.map(a => Number(a.percentage))) : null;
            return (
              <Card key={quiz.id} className={`p-5 ${unlocked ? 'cursor-pointer hover:shadow-md' : 'opacity-60'}`} onClick={() => unlocked && openQuiz(quiz)}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${unlocked ? 'bg-accent-50 text-accent-600' : 'bg-gray-100 text-gray-400'}`}>
                      {unlocked ? <Brain className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{quiz.title}</h3>
                      <p className="text-xs text-gray-500">{quiz.topic?.name}</p>
                    </div>
                  </div>
                  {bestScore !== null && (
                    <Badge className={bestScore >= quiz.passing_score ? 'text-success-700 bg-success-50 border-success-200' : 'text-warning-700 bg-warning-50 border-warning-200'}>
                      Best: {bestScore}%
                    </Badge>
                  )}
                </div>

                {quiz.description && <p className="mt-3 text-sm text-gray-600">{quiz.description}</p>}

                <div className="mt-3 flex items-center gap-2">
                  <Badge className="text-gray-600 bg-gray-50 border-gray-200">Pass: {quiz.passing_score}%</Badge>
                  <Badge className="text-gray-600 bg-gray-50 border-gray-200">{quizAttempts.length} attempts</Badge>
                  {!unlocked && (
                    <span className="text-xs text-warning-600">Complete {quiz.programs?.filter(p => !submissions.find(s => s.program_id === p.id && s.status === 'completed')).length || 0} more program(s) to unlock</span>
                  )}
                  {unlocked && (
                    <span className="ml-auto flex items-center gap-1 text-sm font-medium text-accent-600">
                      Start Quiz <ChevronRight className="h-4 w-4" />
                    </span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Attempt history */}
      {attempts.length > 0 && (
        <Card className="p-5">
          <h3 className="font-semibold text-gray-900">Attempt History</h3>
          <div className="mt-3 space-y-2">
            {attempts.slice(0, 10).map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{a.quiz?.title || 'Quiz'}</p>
                  <p className="text-xs text-gray-500">{new Date(a.attempted_at).toLocaleDateString()}</p>
                </div>
                <Badge className={Number(a.percentage) >= 50 ? 'text-success-700 bg-success-50 border-success-200' : 'text-error-700 bg-error-50 border-error-200'}>
                  {a.score}/{a.total} ({a.percentage}%)
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Quiz modal */}
      <Modal open={!!activeQuiz} onClose={() => { setActiveQuiz(null); setResult(null); }} title={result ? 'Quiz Result' : activeQuiz?.title || 'Quiz'} size="lg">
        {result ? (
          <div className="text-center py-8">
            <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${result.pct >= 50 ? 'bg-success-50 text-success-600' : 'bg-warning-50 text-warning-600'}`}>
              <Trophy className="h-10 w-10" />
            </div>
            <p className="mt-4 text-3xl font-bold text-gray-900">{result.pct}%</p>
            <p className="mt-1 text-gray-500">You scored {result.score} out of {result.total}</p>
            <p className="mt-2 text-sm text-gray-600">{result.pct >= 50 ? 'Congratulations, you passed!' : 'Keep practicing and try again!'}</p>
            <button onClick={() => { setActiveQuiz(null); setResult(null); }} className="mt-6 btn-primary">Close</button>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No questions in this quiz yet.</p>
            ) : (
              questions.map((q, i) => (
                <div key={q.id} className="rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center gap-2">
                    <Badge className="text-accent-700 bg-accent-50 border-accent-200 capitalize">{q.question_type}</Badge>
                    <span className="text-xs text-gray-400">{q.marks} marks</span>
                  </div>
                  <p className="mt-2 font-medium text-gray-900">{i + 1}. {q.question}</p>
                  <div className="mt-3 space-y-2">
                    {q.options.map((opt, j) => (
                      <label key={j} className="flex items-center gap-2 rounded-lg border border-gray-100 p-2.5 cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name={`q-${q.id}`}
                          value={opt}
                          checked={answers[q.id] === opt}
                          onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                          className="text-primary-600"
                        />
                        <span className="text-sm text-gray-700">{opt}</span>
                      </label>
                    ))}
                    {q.question_type === 'concept' && q.options.length === 0 && (
                      <textarea
                        className="input"
                        rows={2}
                        placeholder="Type your answer..."
                        value={answers[q.id] || ''}
                        onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                      />
                    )}
                  </div>
                </div>
              ))
            )}
            {questions.length > 0 && (
              <div className="flex justify-end border-t border-gray-100 pt-4">
                <button onClick={submitQuiz} disabled={submitting} className="btn-primary">
                  {submitting ? 'Submitting...' : 'Submit Quiz'}
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
