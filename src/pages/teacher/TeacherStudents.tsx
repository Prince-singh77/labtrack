import { useEffect, useState } from 'react';
import {
  Users,
  AlertTriangle,
  TrendingUp,
  MessageSquare,
  X,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';

interface StudentPerformance {
  id: string;
  name: string;
  email: string;
  submissions: number;
  average: number;
  passed: number;
}

export function TeacherStudents() {
  const { profile } = useAuth();

  const [students, setStudents] = useState<StudentPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedStudent, setSelectedStudent] =
    useState<StudentPerformance | null>(null);

  const [interventionNote, setInterventionNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      loadStudents();
    }
  }, [profile]);

  const loadStudents = async () => {
    if (!profile) return;

    setLoading(true);

    try {
      // 1. Get teacher's labs
      const { data: labs, error: labsError } = await supabase
        .from('labs')
        .select('id')
        .or(`teacher_id.eq.${profile.id},teacher_id.is.null`);

      if (labsError) throw labsError;

      const labIds = (labs || []).map((lab) => lab.id);

      if (labIds.length === 0) {
        setStudents([]);
        return;
      }

      // 2. Get topics
      const { data: topics, error: topicsError } = await supabase
        .from('topics')
        .select('id, lab_id')
        .in('lab_id', labIds);

      if (topicsError) throw topicsError;

      const topicIds = (topics || []).map((topic) => topic.id);

      if (topicIds.length === 0) {
        setStudents([]);
        return;
      }

      // 3. Get programs
      const { data: programs, error: programsError } = await supabase
        .from('programs')
        .select('id, marks')
        .in('topic_id', topicIds);

      if (programsError) throw programsError;

      const programIds = (programs || []).map((program) => program.id);

      if (programIds.length === 0) {
        setStudents([]);
        return;
      }

      // 4. Get submissions
      const { data: submissions, error: submissionsError } =
        await supabase
          .from('submissions')
          .select(
            'student_id, program_id, score, status'
          )
          .in('program_id', programIds);

      if (submissionsError) throw submissionsError;

      // 5. Get student profiles
      const studentIds = [
        ...new Set(
          (submissions || []).map(
            (submission) => submission.student_id
          )
        ),
      ];

      if (studentIds.length === 0) {
        setStudents([]);
        return;
      }

      const { data: profiles, error: profilesError } =
        await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', studentIds);

      if (profilesError) throw profilesError;

      // 6. Create performance map
      const performanceMap = new Map<
        string,
        {
          submissions: number;
          totalPercentage: number;
          passed: number;
        }
      >();

      (submissions || []).forEach((submission) => {
        const program = (programs || []).find(
          (p) => p.id === submission.program_id
        );

        if (!program) return;

        const marks = Number(program.marks || 0);
        const score = Number(submission.score || 0);

        const percentage =
          marks > 0 ? (score / marks) * 100 : 0;

        const existing = performanceMap.get(
          submission.student_id
        ) || {
          submissions: 0,
          totalPercentage: 0,
          passed: 0,
        };

        existing.submissions += 1;
        existing.totalPercentage += percentage;

        if (
          submission.status === 'passed' ||
          percentage >= 50
        ) {
          existing.passed += 1;
        }

        performanceMap.set(
          submission.student_id,
          existing
        );
      });

      // 7. Build student list
      const result: StudentPerformance[] = (
        profiles || []
      ).map((student) => {
        const performance = performanceMap.get(student.id);

        const submissionsCount =
          performance?.submissions || 0;

        return {
          id: student.id,
          name: student.full_name || 'Unknown Student',
          email: student.email || '',
          submissions: submissionsCount,
          average:
            submissionsCount > 0
              ? Math.round(
                  performance!.totalPercentage /
                    submissionsCount
                )
              : 0,
          passed: performance?.passed || 0,
        };
      });

      // Lowest-performing students first
      result.sort((a, b) => a.average - b.average);

      setStudents(result);
    } catch (error) {
      console.error('Failed to load students:', error);
    } finally {
      setLoading(false);
    }
  };

  const openIntervention = (
    student: StudentPerformance
  ) => {
    setSelectedStudent(student);

    setInterventionNote(
      `Hi ${student.name},\n\nI noticed that you may need some additional help with your lab work. Please review your recent submissions and reach out if you need assistance.\n\nKeep practicing!`
    );
  };

  const sendIntervention = async () => {
    if (!profile || !selectedStudent) return;

    if (!interventionNote.trim()) {
      alert('Please enter an intervention message.');
      return;
    }

    setSaving(true);

    try {
      // Store the intervention as a help request/activity.
      const { error } = await supabase
        .from('activity_log')
        .insert({
          user_id: selectedStudent.id,
          activity_type: 'teacher_intervention',
          description: interventionNote.trim(),
          metadata: {
            teacher_id: profile.id,
            teacher_name: profile.full_name,
            student_id: selectedStudent.id,
            student_name: selectedStudent.name,
            average_score: selectedStudent.average,
          },
        });

      if (error) throw error;

      alert(
        `Intervention sent to ${selectedStudent.name}.`
      );

      setSelectedStudent(null);
      setInterventionNote('');
    } catch (error) {
      console.error(
        'Failed to save intervention:',
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : 'Failed to send intervention.'
      );
    } finally {
      setSaving(false);
    }
  };

  const totalStudents = students.length;

  const atRisk = students.filter(
    (student) => student.average < 50
  ).length;

  const performingWell = students.filter(
    (student) => student.average >= 75
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Students
        </h1>

        <p className="mt-1 text-gray-500">
          Monitor student performance and intervene when
          students need help.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-blue-100 p-3">
              <Users className="h-6 w-6 text-blue-600" />
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Students
              </p>

              <p className="text-2xl font-bold text-gray-900">
                {totalStudents}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-red-100 p-3">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>

            <div>
              <p className="text-sm text-gray-500">
                At Risk
              </p>

              <p className="text-2xl font-bold text-gray-900">
                {atRisk}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-green-100 p-3">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Performing Well
              </p>

              <p className="text-2xl font-bold text-gray-900">
                {performingWell}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Student list */}
      <Card>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Student Performance
          </h2>

          <p className="text-sm text-gray-500">
            Students with lower scores appear first.
          </p>
        </div>

        {loading ? (
          <div className="py-10 text-center text-gray-500">
            Loading students...
          </div>
        ) : students.length === 0 ? (
          <div className="py-10 text-center text-gray-500">
            No student submission data available yet.
          </div>
        ) : (
          <div className="space-y-3">
            {students.map((student) => {
              const needsAttention =
                student.average < 50;

              return (
                <div
                  key={student.id}
                  className="flex flex-col gap-4 rounded-xl border border-gray-200 p-4 transition hover:bg-gray-50 md:flex-row md:items-center md:justify-between"
                >
                  {/* Student info */}
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-700">
                      {student.name
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div>
                      <p className="font-semibold text-gray-900">
                        {student.name}
                      </p>

                      <p className="text-sm text-gray-500">
                        {student.email}
                      </p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex flex-wrap items-center gap-6">
                    <div>
                      <p className="text-xs text-gray-500">
                        Submissions
                      </p>

                      <p className="font-semibold">
                        {student.submissions}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">
                        Average
                      </p>

                      <p
                        className={`font-semibold ${
                          student.average < 50
                            ? 'text-red-600'
                            : student.average >= 75
                            ? 'text-green-600'
                            : 'text-yellow-600'
                        }`}
                      >
                        {student.average}%
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">
                        Passed
                      </p>

                      <p className="font-semibold">
                        {student.passed}
                      </p>
                    </div>

                    {/* Status */}
                    <div>
                      {needsAttention ? (
                        <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
                          Needs Attention
                        </span>
                      ) : (
                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                          On Track
                        </span>
                      )}
                    </div>

                    {/* Intervene */}
                    <button
                      onClick={() =>
                        openIntervention(student)
                      }
                      className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
                    >
                      <MessageSquare className="h-4 w-4" />
                      Intervene
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Intervention modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            {/* Modal header */}
            <div className="flex items-center justify-between border-b p-5">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Intervene with Student
                </h2>

                <p className="text-sm text-gray-500">
                  {selectedStudent.name}
                </p>
              </div>

              <button
                onClick={() =>
                  setSelectedStudent(null)
                }
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Student summary */}
            <div className="grid grid-cols-2 gap-3 p-5">
              <div className="rounded-xl bg-gray-50 p-3">
                <p className="text-xs text-gray-500">
                  Average Score
                </p>

                <p className="text-xl font-bold text-gray-900">
                  {selectedStudent.average}%
                </p>
              </div>

              <div className="rounded-xl bg-gray-50 p-3">
                <p className="text-xs text-gray-500">
                  Submissions
                </p>

                <p className="text-xl font-bold text-gray-900">
                  {selectedStudent.submissions}
                </p>
              </div>
            </div>

            {/* Message */}
            <div className="px-5 pb-5">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Intervention Message
              </label>

              <textarea
                value={interventionNote}
                onChange={(e) =>
                  setInterventionNote(e.target.value)
                }
                rows={7}
                className="w-full rounded-xl border border-gray-300 p-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                placeholder="Write a message for the student..."
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 border-t p-5">
              <button
                onClick={() => {
                  setSelectedStudent(null);
                  setInterventionNote('');
                }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                onClick={sendIntervention}
                disabled={saving}
                className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? 'Sending...'
                  : 'Send Intervention'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}