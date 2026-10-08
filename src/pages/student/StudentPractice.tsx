import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Card, Badge } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { EmptyState, Spinner } from '@/components/ui/EmptyState';
import {
  difficultyColor,
  statusColor,
  statusLabel,
  formatDate,
} from '@/lib/utils';
import {
  Code2,
  Search,
  Send,
  Clock,
  Lightbulb,
  Brain,
} from 'lucide-react';
import type { Program, Submission } from '@/types';

export function StudentPractice() {
  const { profile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [programs, setPrograms] = useState<
    (Program & { topic?: any })[]
  >([]);
  const [submissions, setSubmissions] = useState<
    Map<string, Submission>
  >(new Map());

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] =
    useState<string>('all');
  const [filterDifficulty, setFilterDifficulty] =
    useState<string>('all');

  const [selectedProgram, setSelectedProgram] =
    useState<Program | null>(null);

  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [explanation, setExplanation] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [testing, setTesting] = useState(false);

  const [testResult, setTestResult] = useState('');
  const [testScore, setTestScore] = useState(0);
  const [testsPassed, setTestsPassed] = useState(0);

  // AI Hint
  const [showHint, setShowHint] = useState(false);
  const [hint, setHint] = useState('');
  const [isGeneratingHint, setIsGeneratingHint] = useState(false);

  useEffect(() => {
    if (!profile) return;

    (async () => {
      const { data: labs, error: labError } =
        await supabase
          .from('labs')
          .select('*')
          .eq('batch_id', profile.batch_id);

      if (labError) {
        console.error('LAB LOAD ERROR:', labError);
        alert(
          `Could not load labs:\n${labError.message}`
        );
        setLoading(false);
        return;
      }

      const labIds = (labs || []).map(
        (lab) => lab.id
      );

      if (labIds.length === 0) {
        setPrograms([]);
        setLoading(false);
        return;
      }

      const { data: topics, error: topicError } =
        await supabase
          .from('topics')
          .select('*')
          .in('lab_id', labIds);

      if (topicError) {
        console.error('TOPIC LOAD ERROR:', topicError);
        alert(
          `Could not load topics:\n${topicError.message}`
        );
        setLoading(false);
        return;
      }

      const topicIds = (topics || []).map(
        (topic) => topic.id
      );

      if (topicIds.length === 0) {
        setPrograms([]);
        setLoading(false);
        return;
      }

      const { data: programData, error: programError } =
        await supabase
          .from('programs')
          .select('*')
          .in('topic_id', topicIds)
          .order('created_at', {
            ascending: false,
          });

      if (programError) {
        console.error(
          'PROGRAM LOAD ERROR:',
          programError
        );
        alert(
          `Could not load programs:\n${programError.message}`
        );
        setLoading(false);
        return;
      }

      const allPrograms = (programData || []).map(
        (program) => ({
          ...program,
          topic: topics?.find(
            (topic) =>
              topic.id === program.topic_id
          ),
        })
      );

      setPrograms(allPrograms);

      const { data: subs } = await supabase
        .from('submissions')
        .select('*')
        .eq('student_id', profile.id);

      const map = new Map<string, Submission>();

      (subs || []).forEach((s: Submission) =>
        map.set(s.program_id, s)
      );

      setSubmissions(map);
      setLoading(false);
    })();
  }, [profile]);

  /*
   * -----------------------------
   * AI HINT
   * -----------------------------
   */

 
  const generateHint = async () => {
    if (!selectedProgram || isGeneratingHint) return;

    setIsGeneratingHint(true);
    setShowHint(true);
    setHint('LabTrack AI is thinking...');

    try {
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'qwen2.5:3b',
          stream: false,
          prompt: `You are LabTrack AI, a friendly programming lab tutor.

Problem title: ${selectedProgram.title}
Problem description: ${selectedProgram.description}
Programming language: ${selectedProgram.language}

Give the student one or two useful, specific hints to help solve this problem.
Explain the next logical step in simple language.
Do NOT provide the complete code or full solution.
Do NOT assume details that are not given.
Keep the response concise and beginner-friendly.`,
          options: {
            temperature: 0.4,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama returned status ${response.status}`);
      }

      const result = await response.json();

      if (!result.response?.trim()) {
        throw new Error('The AI returned an empty hint.');
      }

      setHint(result.response.trim());
    } catch (error) {
      console.error('AI hint error:', error);
      setHint(
        'Could not connect to the local AI. Make sure Ollama is running and the qwen2.5:3b model is installed, then try again.'
      );
    } finally {
      setIsGeneratingHint(false);
    }
  };

  /*
   * -----------------------------
   * RUN TEST CASES
   * -----------------------------
   */

  const handleRunTests = async () => {
    if (!selectedProgram || !code.trim()) return;

    setTesting(true);
    setTestResult('');

    try {
      const testCases =
        selectedProgram.test_cases || [];

      if (testCases.length === 0) {
        setTestResult(
          'No test cases found.'
        );
        return;
      }

      const functionUrl =
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/rapid-handler`;

      let passed = 0;

      const results: string[] = [];
      const actualOutputs: string[] = [];

      for (
        let i = 0;
        i < testCases.length;
        i++
      ) {
        const testCase = testCases[i];

        const response = await fetch(
          functionUrl,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              apikey:
                import.meta.env
                  .VITE_SUPABASE_ANON_KEY,
              Authorization:
                `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
              code,
              input: testCase.input,
            }),
          }
        );

        const result =
          await response.json();

        if (!response.ok) {
          results.push(
            `❌ Test Case ${
              i + 1
            } — Server Error\n${JSON.stringify(
              result,
              null,
              2
            )}`
          );

          continue;
        }

        const actual =
          (result.stdout || '').trim();

        const expected =
          String(
            testCase.expected_output || ''
          ).trim();

        actualOutputs.push(actual);

        if (actual === expected) {
          passed++;

          results.push(
            `✅ Test Case ${
              i + 1
            } Passed\nExpected: ${expected}\nGot: ${actual}`
          );
        } else {
          results.push(
            `❌ Test Case ${
              i + 1
            } Failed\nExpected: ${expected}\nGot: ${actual}`
          );
        }

        if (result.compile_output) {
          results.push(
            `⚠️ Compile Output:\n${result.compile_output}`
          );
        }

        if (result.stderr) {
          results.push(
            `⚠️ Runtime Error:\n${result.stderr}`
          );
        }
      }

      const score = Math.round(
        (passed / testCases.length) * 100
      );

      setOutput(
        actualOutputs.join(
          '\n\n--- Test Case ---\n\n'
        )
      );

      setTestScore(score);
      setTestsPassed(passed);

      setTestResult(
        `${passed}/${testCases.length} Test Cases Passed\n\n` +
          `Score: ${score}%\n\n` +
          results.join(
            '\n\n--------------------\n\n'
          )
      );
    } catch (error) {
      setTestResult(
        `❌ Connection Error\n\n${
          error instanceof Error
            ? error.message
            : 'Unknown error'
        }`
      );
    } finally {
      setTesting(false);
    }
  };

  /*
   * -----------------------------
   * SUBMIT
   * -----------------------------
   */

  const handleSubmit = async () => {
    if (!profile || !selectedProgram) return;

    setSubmitting(true);

    const existing =
      submissions.get(selectedProgram.id);

    const status =
      testScore === 100
        ? 'passed'
        : 'attempted';

    const score = Math.round(
      (testScore / 100) *
        selectedProgram.marks
    );

    const submissionData = {
      code,
      output,
      explanation,
      status,
      score,
      submitted_at:
        new Date().toISOString(),
    };

    if (existing) {
      const { error } = await supabase
        .from('submissions')
        .update(submissionData)
        .eq('id', existing.id);

      if (error) {
        alert(error.message);
        setSubmitting(false);
        return;
      }
    } else {
      const { error } = await supabase
        .from('submissions')
        .insert({
          program_id:
            selectedProgram.id,
          student_id: profile.id,
          ...submissionData,
        });

      if (error) {
        alert(error.message);
        setSubmitting(false);
        return;
      }
    }

    await supabase
      .from('activity_log')
      .insert({
        user_id: profile.id,
        activity_type: 'submission',
        description:
          `Submitted "${selectedProgram.title}"`,
        metadata: {
          program_id:
            selectedProgram.id,
          score,
          test_score: testScore,
          tests_passed: testsPassed,
        },
      });

    const { data: subs } =
      await supabase
        .from('submissions')
        .select('*')
        .eq('student_id', profile.id);

    const map =
      new Map<string, Submission>();

    (subs || []).forEach(
      (s: Submission) => {
        map.set(
          s.program_id,
          s
        );
      }
    );

    setSubmissions(map);

    setSubmitting(false);
    setSelectedProgram(null);
    setCode('');
    setOutput('');
    setExplanation('');
    setTestResult('');
    setTestScore(0);
    setTestsPassed(0);
    setShowHint(false);
    setHint('');

    alert(
      status === 'passed'
        ? `🎉 Passed! You scored ${score}/${selectedProgram.marks}.`
        : `Solution submitted. You scored ${score}/${selectedProgram.marks}.`
    );
  };

  /*
   * -----------------------------
   * OPEN PROGRAM
   * -----------------------------
   */

  const openProgram = (
    program: Program
  ) => {
    const existing =
      submissions.get(program.id);

    setSelectedProgram(program);
    setCode(existing?.code || '');
    setOutput(existing?.output || '');
    setExplanation(
      existing?.explanation || ''
    );

    setTestResult('');
    setTestScore(0);
    setTestsPassed(0);
    setShowHint(false);
    setHint('');
  };

  if (loading) {
    return (
      <Spinner className="py-20" />
    );
  }

  if (!profile) return null;

  const filtered = programs.filter(
    (p) => {
      if (
        search &&
        !p.title
          .toLowerCase()
          .includes(
            search.toLowerCase()
          )
      ) {
        return false;
      }

      const sub =
        submissions.get(p.id);

      const status =
        sub?.status ||
        'not_started';

      if (
        filterStatus !== 'all' &&
        status !== filterStatus
      ) {
        return false;
      }

      if (
        filterDifficulty !== 'all' &&
        p.difficulty !==
          filterDifficulty
      ) {
        return false;
      }

      return true;
    }
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Practice
        </h2>

        <p className="mt-1 text-gray-500">
          Start working on your assigned
          programming questions.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

          <input
            className="input pl-10"
            placeholder="Search programs..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />
        </div>

        <select
          className="input sm:w-40"
          value={filterStatus}
          onChange={(e) =>
            setFilterStatus(
              e.target.value
            )
          }
        >
          <option value="all">
            All Status
          </option>
          <option value="not_started">
            Not Started
          </option>
          <option value="attempted">
            Attempted
          </option>
          <option value="passed">
            Passed
          </option>
          <option value="completed">
            Completed
          </option>
        </select>

        <select
          className="input sm:w-36"
          value={filterDifficulty}
          onChange={(e) =>
            setFilterDifficulty(
              e.target.value
            )
          }
        >
          <option value="all">
            All Levels
          </option>
          <option value="easy">
            Easy
          </option>
          <option value="medium">
            Medium
          </option>
          <option value="hard">
            Hard
          </option>
        </select>
      </div>

      {/* Program Cards */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={
            <Code2 className="h-6 w-6" />
          }
          title="No programs found"
          description="Try adjusting your filters or search."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map(
            (program) => {
              const sub =
                submissions.get(
                  program.id
                );

              const status =
                sub?.status ||
                'not_started';

              return (
                <Card
                  key={program.id}
                  className="p-5"
                  hover
                  onClick={() =>
                    openProgram(
                      program
                    )
                  }
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                        <Code2 className="h-5 w-5" />
                      </div>

                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {program.title}
                        </h3>

                        <p className="text-xs text-gray-500">
                          {program.topic?.name}{' '}
                          ·{' '}
                          {program.language}
                        </p>
                      </div>
                    </div>

                    <Badge
                      className={statusColor(
                        status
                      )}
                    >
                      {statusLabel(
                        status
                      )}
                    </Badge>
                  </div>

                  <p className="mt-3 line-clamp-2 text-sm text-gray-600">
                    {program.description}
                  </p>

                  <div className="mt-3 flex items-center gap-2">
                    <Badge
                      className={difficultyColor(
                        program.difficulty
                      )}
                    >
                      {program.difficulty}
                    </Badge>

                    <Badge className="border-gray-200 bg-gray-50 text-gray-600">
                      {program.marks} marks
                    </Badge>

                    {program.deadline && (
                      <span className="ml-auto flex items-center gap-1 text-xs text-gray-400">
                        <Clock className="h-3 w-3" />
                        {formatDate(
                          program.deadline
                        )}
                      </span>
                    )}
                  </div>
                </Card>
              );
            }
          )}
        </div>
      )}

      {/* Submission Modal */}
      <Modal
        open={!!selectedProgram}
        onClose={() =>
          setSelectedProgram(null)
        }
        title="Submit Program"
        size="lg"
      >
        {selectedProgram && (
          <div className="space-y-4">
            {/* Problem */}
            <div className="rounded-lg bg-gray-50 p-4">
              <h4 className="font-semibold text-gray-900">
                {selectedProgram.title}
              </h4>

              <p className="mt-1 text-sm text-gray-600">
                {selectedProgram.description}
              </p>

              <div className="mt-2 flex flex-wrap gap-2">
                <Badge
                  className={difficultyColor(
                    selectedProgram.difficulty
                  )}
                >
                  {selectedProgram.difficulty}
                </Badge>

                <Badge className="border-gray-200 bg-white text-gray-600">
                  {selectedProgram.language}
                </Badge>

                <Badge className="border-gray-200 bg-white text-gray-600">
                  {selectedProgram.marks} marks
                </Badge>
              </div>

              {/* AI Hint */}
<div className="mt-4">
  <button
    type="button"
    onClick={generateHint}
    disabled={isGeneratingHint}
    className="btn-secondary disabled:cursor-not-allowed disabled:opacity-60"
  >
    <Lightbulb className="h-4 w-4" />
    {isGeneratingHint ? 'Generating Hint...' : 'Get AI Hint'}
  </button>
</div>

              {showHint && (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-amber-600" />

                    <h3 className="font-semibold text-amber-900">
                      LabTrack AI Hint
                    </h3>
                  </div>

                  <p className="mt-2 text-sm leading-6 text-amber-800">
                    {hint}
                  </p>

                  <p className="mt-3 text-xs text-amber-700">
                    💡 Hint only — the solution is not revealed.
                  </p>
                </div>
              )}

              {/* Test Cases */}
              {selectedProgram.test_cases &&
                selectedProgram.test_cases.length >
                  0 && (
                  <div className="mt-4">
                    <p className="mb-2 text-sm font-semibold text-gray-700">
                      Test Cases
                    </p>

                    <div className="space-y-3">
                      {selectedProgram.test_cases.map(
                        (
                          testCase: any,
                          index: number
                        ) => (
                          <div
                            key={index}
                            className="rounded-lg border border-gray-200 bg-white p-3"
                          >
                            <p className="mb-1 text-xs font-semibold text-gray-500">
                              Test Case{' '}
                              {index + 1}
                            </p>

                            <div className="grid gap-3 md:grid-cols-2">
                              <div>
                                <p className="mb-1 text-xs text-gray-500">
                                  Input
                                </p>

                                <pre className="overflow-x-auto rounded-md bg-gray-900 p-3 text-xs text-white">
                                  {
                                    testCase.input
                                  }
                                </pre>
                              </div>

                              <div>
                                <p className="mb-1 text-xs text-gray-500">
                                  Expected Output
                                </p>

                                <pre className="overflow-x-auto rounded-md bg-gray-900 p-3 text-xs text-green-400">
                                  {
                                    testCase.expected_output
                                  }
                                </pre>
                              </div>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
            </div>

            {/* Code */}
            <div>
              <label className="label">
                Your Code
              </label>

              <textarea
                className="input font-mono text-sm"
                rows={10}
                value={code}
                onChange={(e) =>
                  setCode(
                    e.target.value
                  )
                }
                placeholder="// Write or paste your code here..."
              />
            </div>

            {/* Run Tests */}
            <div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={
                    handleRunTests
                  }
                  disabled={
                    testing ||
                    !code.trim()
                  }
                  className="btn-secondary"
                >
                  {testing
                    ? 'Testing...'
                    : 'Run Tests'}
                </button>

                {testScore > 0 && (
                  <span className="text-sm font-semibold text-gray-700">
                    Score:{' '}
                    {testScore}%
                  </span>
                )}
              </div>

              {testResult && (
                <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap rounded-lg bg-gray-900 p-4 text-sm text-gray-100">
                  {testResult}
                </pre>
              )}
            </div>

            {/* Output */}
            <div>
              <label className="label">
                Output
              </label>

              <textarea
                className="input font-mono text-sm"
                rows={4}
                value={output}
                onChange={(e) =>
                  setOutput(
                    e.target.value
                  )
                }
                placeholder="Program output will appear here after running tests..."
              />
            </div>

            {/* Explanation */}
            <div>
              <label className="label">
                Short Explanation
              </label>

              <textarea
                className="input"
                rows={3}
                value={explanation}
                onChange={(e) =>
                  setExplanation(
                    e.target.value
                  )
                }
                placeholder="Briefly explain how your program works..."
              />
            </div>

            {/* Submit */}
            <div className="flex items-center justify-between border-t border-gray-100 pt-4">
              <p className="max-w-md text-xs text-gray-500">
                Run your code against the test cases
                before submitting. Your score is calculated
                automatically.
              </p>

              <button
                onClick={
                  handleSubmit
                }
                disabled={
                  submitting ||
                  !code.trim()
                }
                className="btn-primary"
              >
                <Send className="h-4 w-4" />

                {submitting
                  ? 'Submitting...'
                  : 'Submit'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}