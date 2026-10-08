import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Card, Badge } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { EmptyState, Spinner } from '@/components/ui/EmptyState';
import { difficultyColor, formatDate } from '@/lib/utils';
import { Code2, Plus, Pencil, Trash2, Clock, X } from 'lucide-react';
import type { Program, Topic, Lab } from '@/types';

interface TestCase {
  input: string;
  expected_output: string;
}

export function TeacherPrograms() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [topics, setTopics] = useState<(Topic & { lab?: Lab; programs?: Program[] })[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [form, setForm] = useState({
    title: '',
    description: '',
    difficulty: 'easy',
    language: 'C',
    expected_output: '',
    marks: 10,
    deadline: '',
  });

  const [testCases, setTestCases] = useState<TestCase[]>([]);

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

  // Get labs owned by this teacher
  const { data: labs, error: labError } = await supabase
    .from('labs')
    .select('*')
    .eq('teacher_id', profile.id);

  if (labError) {
    console.error('LAB LOAD ERROR:', labError);
    alert(`Could not load labs:\n${labError.message}`);
    return;
  }

  if (!labs || labs.length === 0) {
    setTopics([]);
    return;
  }

  const labIds = labs.map((lab) => lab.id);

  // Get topics belonging to those labs
  const { data: topicData, error: topicError } = await supabase
    .from('topics')
    .select('*')
    .in('lab_id', labIds)
    .order('name');

  if (topicError) {
    console.error('TOPIC LOAD ERROR:', topicError);
    alert(`Could not load topics:\n${topicError.message}`);
    return;
  }

  if (!topicData || topicData.length === 0) {
    setTopics([]);
    return;
  }

  // Get programs belonging to those topics
  const topicIds = topicData.map((topic) => topic.id);

  const { data: programData, error: programError } = await supabase
    .from('programs')
    .select('*')
    .in('topic_id', topicIds)
    .order('created_at', { ascending: false });

  if (programError) {
    console.error('PROGRAM LOAD ERROR:', programError);
    alert(`Could not load programs:\n${programError.message}`);
    return;
  }

  // Combine the data manually
  const combinedTopics = topicData.map((topic) => ({
    ...topic,

    lab: labs.find((lab) => lab.id === topic.lab_id),

    programs:
      programData?.filter(
        (program) => program.topic_id === topic.id
      ) || [],
  }));

  console.log('TOPICS LOADED:', combinedTopics);

  setTopics(combinedTopics as any);
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
      test_cases: testCases,
      marks: Number(form.marks),
      deadline: form.deadline
        ? new Date(form.deadline).toISOString()
        : null,
    };

    let error = null;

    if (editingProgram) {
      const result = await supabase
        .from('programs')
        .update(payload)
        .eq('id', editingProgram.id);

      error = result.error;
    } else {
      const result = await supabase
        .from('programs')
        .insert({
          ...payload,
          created_by: profile.id,
        });

      error = result.error;
    }

    if (error) {
      alert(error.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    setShowModal(false);
    setEditingProgram(null);
    resetForm();
    await refresh();
  };

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      difficulty: 'easy',
      language: 'C',
      expected_output: '',
      marks: 10,
      deadline: '',
    });

    setTestCases([]);
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
      deadline: program.deadline
        ? new Date(program.deadline).toISOString().slice(0, 16)
        : '',
    });

    const existingTestCases = Array.isArray(program.test_cases)
      ? program.test_cases
          .filter((tc: any) => tc && typeof tc === 'object')
          .map((tc: any) => ({
            input: tc.input || '',
            expected_output: tc.expected_output || '',
          }))
      : [];

    setTestCases(existingTestCases);

    setShowModal(true);
  };

  const deleteProgram = async (id: string) => {
    if (!confirm('Delete this program and all its submissions?')) return;

    const { error } = await supabase
      .from('programs')
      .delete()
      .eq('id', id);

    if (error) {
      alert(error.message);
      return;
    }

    await refresh();
  };

  const addTestCase = () => {
    setTestCases([
      ...testCases,
      {
        input: '',
        expected_output: '',
      },
    ]);
  };

  const updateTestCase = (
    index: number,
    field: keyof TestCase,
    value: string
  ) => {
    setTestCases((current) =>
      current.map((testCase, i) =>
        i === index
          ? {
              ...testCase,
              [field]: value,
            }
          : testCase
      )
    );
  };

  const removeTestCase = (index: number) => {
    setTestCases((current) =>
      current.filter((_, i) => i !== index)
    );
  };

  if (loading) return <Spinner className="py-20" />;
  if (!profile) return null;

  const allTopics = topics.flatMap((t) => [
    {
      id: t.id,
      label: `${t.lab?.name} → ${t.name}`,
    },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Programs
          </h2>

          <p className="mt-1 text-gray-500">
            Create programming questions for your lab topics.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingProgram(null);
            resetForm();
            setSelectedTopic('');
            setShowModal(true);
          }}
          className="btn-primary"
        >
          <Plus className="h-4 w-4" />
          New Program
        </button>
      </div>

      {topics.length === 0 ? (
        <EmptyState
          icon={<Code2 className="h-6 w-6" />}
          title="No topics available"
          description="Create labs and topics first before adding programs."
        />
      ) : (
        <div className="space-y-4">
          {topics.map((topic) => (
            <Card key={topic.id} className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {topic.name}
                  </h3>

                  <p className="text-xs text-gray-500">
                    {topic.lab?.name}
                  </p>
                </div>

                <Badge className="text-gray-600 bg-gray-50 border-gray-200">
                  {topic.programs?.length || 0} programs
                </Badge>
              </div>

              {topic.programs &&
              topic.programs.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {topic.programs.map((prog) => (
                    <div
                      key={prog.id}
                      className="rounded-lg border border-gray-100 p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {prog.title}
                          </h4>

                          <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                            {prog.description}
                          </p>
                        </div>

                        <div className="flex gap-1 ml-2">
                          <button
                            onClick={() =>
                              openEdit(prog, topic.id)
                            }
                            className="btn-ghost text-xs"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>

                          <button
                            onClick={() =>
                              deleteProgram(prog.id)
                            }
                            className="btn-ghost text-xs text-error-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        <Badge
                          className={difficultyColor(
                            prog.difficulty
                          )}
                        >
                          {prog.difficulty}
                        </Badge>

                        <Badge className="text-gray-600 bg-gray-50 border-gray-200">
                          {prog.language}
                        </Badge>

                        <Badge className="text-gray-600 bg-gray-50 border-gray-200">
                          {prog.marks} marks
                        </Badge>

                        {prog.test_cases &&
                          prog.test_cases.length > 0 && (
                            <Badge className="text-gray-600 bg-gray-50 border-gray-200">
                              {prog.test_cases.length} tests
                            </Badge>
                          )}

                        {prog.deadline && (
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <Clock className="h-3 w-3" />
                            {formatDate(prog.deadline)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">
                  No programs yet.
                </p>
              )}
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={
          editingProgram
            ? 'Edit Program'
            : 'Create Program'
        }
        size="lg"
      >
        <div className="space-y-5">

          {/* Topic */}
          <div>
            <label className="label">Topic</label>

            <select
              className="input"
              value={selectedTopic}
              onChange={(e) =>
                setSelectedTopic(e.target.value)
              }
              disabled={!!editingProgram}
            >
              <option value="">
                Select a topic
              </option>

              {allTopics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="label">Title</label>

            <input
              className="input"
              value={form.title}
              onChange={(e) =>
                setForm({
                  ...form,
                  title: e.target.value,
                })
              }
              placeholder="e.g. Reverse an Array"
            />
          </div>

          {/* Description */}
          <div>
            <label className="label">
              Description
            </label>

            <textarea
              className="input"
              rows={4}
              value={form.description}
              onChange={(e) =>
                setForm({
                  ...form,
                  description: e.target.value,
                })
              }
              placeholder="Describe the problem..."
            />
          </div>

          {/* Difficulty / Language / Marks */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label">
                Difficulty
              </label>

              <select
                className="input"
                value={form.difficulty}
                onChange={(e) =>
                  setForm({
                    ...form,
                    difficulty: e.target.value,
                  })
                }
              >
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

            <div>
              <label className="label">
                Language
              </label>

              <select
                className="input"
                value={form.language}
                onChange={(e) =>
                  setForm({
                    ...form,
                    language: e.target.value,
                  })
                }
              >
                <option value="C">C</option>
                <option value="C++">C++</option>
                <option value="Java">
                  Java
                </option>
                <option value="Python">
                  Python
                </option>
              </select>
            </div>

            <div>
              <label className="label">
                Marks
              </label>

              <input
                type="number"
                className="input"
                value={form.marks}
                onChange={(e) =>
                  setForm({
                    ...form,
                    marks: Number(e.target.value),
                  })
                }
              />
            </div>
          </div>

          {/* Expected output */}
          <div>
            <label className="label">
              Expected Output (optional)
            </label>

            <textarea
              className="input font-mono text-sm"
              rows={3}
              value={form.expected_output}
              onChange={(e) =>
                setForm({
                  ...form,
                  expected_output: e.target.value,
                })
              }
              placeholder="Expected program output..."
            />
          </div>

          {/* Test Cases */}
          <div className="rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">
                  Test Cases
                </h3>

                <p className="text-xs text-gray-500 mt-1">
                  Add inputs and the outputs your program
                  should produce.
                </p>
              </div>

              <button
                type="button"
                onClick={addTestCase}
                className="btn-ghost text-sm"
              >
                <Plus className="h-4 w-4" />
                Add Test
              </button>
            </div>

            {testCases.length === 0 ? (
              <div className="mt-4 rounded-lg bg-gray-50 p-4 text-center">
                <p className="text-sm text-gray-500">
                  No test cases added yet.
                </p>

                <button
                  type="button"
                  onClick={addTestCase}
                  className="mt-2 text-sm font-medium text-primary-600 hover:underline"
                >
                  + Add your first test case
                </button>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                {testCases.map((testCase, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-gray-200 bg-gray-50 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-700">
                        Test Case {index + 1}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          removeTestCase(index)
                        }
                        className="text-gray-400 hover:text-error-600"
                        title="Remove test case"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="label">
                          Input
                        </label>

                        <textarea
                          className="input font-mono text-sm"
                          rows={3}
                          value={testCase.input}
                          onChange={(e) =>
                            updateTestCase(
                              index,
                              'input',
                              e.target.value
                            )
                          }
                          placeholder="Example: 1 2 3 4 5"
                        />
                      </div>

                      <div>
                        <label className="label">
                          Expected Output
                        </label>

                        <textarea
                          className="input font-mono text-sm"
                          rows={3}
                          value={
                            testCase.expected_output
                          }
                          onChange={(e) =>
                            updateTestCase(
                              index,
                              'expected_output',
                              e.target.value
                            )
                          }
                          placeholder="Example: 5 4 3 2 1"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Deadline */}
          <div>
            <label className="label">
              Deadline (optional)
            </label>

            <input
              type="datetime-local"
              className="input"
              value={form.deadline}
              onChange={(e) =>
                setForm({
                  ...form,
                  deadline: e.target.value,
                })
              }
            />
          </div>

          {/* Save */}
          <button
            onClick={saveProgram}
            disabled={
              saving ||
              !form.title ||
              !form.description ||
              !selectedTopic
            }
            className="btn-primary w-full"
          >
            {saving
              ? 'Saving...'
              : editingProgram
              ? 'Update Program'
              : 'Create Program'}
          </button>
        </div>
      </Modal>
    </div>
  );
}