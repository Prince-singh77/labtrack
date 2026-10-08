import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Card, Badge } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { EmptyState, Spinner } from '@/components/ui/EmptyState';
import {
  statusColor,
  statusLabel,
  formatDateTime,
  difficultyColor,
} from '@/lib/utils';
import {
  FileText,
  Search,
  CheckCircle2,
  MessageSquare,
} from 'lucide-react';
import type { Submission } from '@/types';

type SubmissionRow = Submission & {
  student?: {
    full_name: string;
    email: string;
    roll_number: string | null;
  };
  program?: {
    title: string;
    difficulty: string;
    language: string;
    marks: number;
    topic_id: string;
  };
};

export function TeacherSubmissions() {
  const { profile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const [reviewing, setReviewing] = useState<SubmissionRow | null>(null);
  const [feedback, setFeedback] = useState('');
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (!profile) return;

    const load = async () => {
      await refresh();
      setLoading(false);
    };

    load();
  }, [profile]);

  const refresh = async () => {
    if (!profile) return;

    try {
      /*
       * STEP 1:
       * Get labs belonging to this teacher.
       */
      const { data: labs, error: labsError } = await supabase
        .from('labs')
        .select('id')
        .or(`teacher_id.eq.${profile.id},teacher_id.is.null`);

      if (labsError) {
        console.error('Labs error:', labsError);
        setSubmissions([]);
        return;
      }

      const labIds = (labs || []).map((lab: any) => lab.id);

      if (labIds.length === 0) {
        setSubmissions([]);
        return;
      }

      /*
       * STEP 2:
       * Get topics belonging to those labs.
       */
      const { data: topics, error: topicsError } = await supabase
        .from('topics')
        .select('id, lab_id')
        .in('lab_id', labIds);

      if (topicsError) {
        console.error('Topics error:', topicsError);
        setSubmissions([]);
        return;
      }

      const topicIds = (topics || []).map((topic: any) => topic.id);

      if (topicIds.length === 0) {
        setSubmissions([]);
        return;
      }

      /*
       * STEP 3:
       * Get programs belonging to those topics.
       */
      const { data: programs, error: programsError } = await supabase
        .from('programs')
        .select(
          'id, title, difficulty, language, marks, topic_id'
        )
        .in('topic_id', topicIds);

      if (programsError) {
        console.error('Programs error:', programsError);
        setSubmissions([]);
        return;
      }

      const programIds = (programs || []).map(
        (program: any) => program.id
      );

      if (programIds.length === 0) {
        setSubmissions([]);
        return;
      }

      /*
       * STEP 4:
       * Get submissions.
       *
       * IMPORTANT:
       * No nested Supabase relationships are used here.
       */
      const { data: submissionData, error: submissionsError } =
        await supabase
          .from('submissions')
          .select('*')
          .in('program_id', programIds)
          .order('submitted_at', { ascending: false });

      if (submissionsError) {
        console.error('Submissions error:', submissionsError);
        setSubmissions([]);
        return;
      }

      const rows = submissionData || [];

      /*
       * STEP 5:
       * Get unique student IDs.
       */
      const studentIds = [
        ...new Set(rows.map((row: any) => row.student_id)),
      ];

      /*
       * STEP 6:
       * Fetch students separately.
       */
      let students: any[] = [];

      if (studentIds.length > 0) {
        const { data: studentData, error: studentError } =
          await supabase
            .from('profiles')
            .select('id, full_name, email, roll_number')
            .in('id', studentIds);

        if (studentError) {
          console.error('Students error:', studentError);
        } else {
          students = studentData || [];
        }
      }

      /*
       * STEP 7:
       * Create lookup maps.
       */
      const studentMap = new Map(
        students.map((student) => [student.id, student])
      );

      const programMap = new Map(
        (programs || []).map((program: any) => [
          program.id,
          program,
        ])
      );

      /*
       * STEP 8:
       * Combine everything in the frontend.
       */
      const combined: SubmissionRow[] = rows.map((submission: any) => ({
        ...submission,
        student: studentMap.get(submission.student_id),
        program: programMap.get(submission.program_id),
      }));

      setSubmissions(combined);
    } catch (error) {
      console.error('Teacher submissions error:', error);
      setSubmissions([]);
    }
  };

  const openReview = (submission: SubmissionRow) => {
    setReviewing(submission);
    setFeedback(submission.feedback || '');
  };

  const verifySubmission = async (
    status: 'completed' | 'passed'
  ) => {
    if (!reviewing || !profile) return;

    setVerifying(true);

    try {
      const { error } = await supabase
        .from('submissions')
        .update({
          status,
          feedback,
          verified_by: profile.id,
          verified_at: new Date().toISOString(),
        })
        .eq('id', reviewing.id);

      if (error) {
        console.error('Verification error:', error);
        alert('Failed to update submission.');
        return;
      }

      /*
       * Log completion activity.
       */
      if (status === 'completed') {
        await supabase.from('activity_log').insert({
          user_id: reviewing.student_id,
          activity_type: 'program_completed',
          description: `Program verified as completed: ${
            reviewing.program?.title || 'Program'
          }`,
          metadata: {
            program_id: reviewing.program_id,
            score: reviewing.score || 0,
          },
        });
      }

      setReviewing(null);
      setFeedback('');

      await refresh();

      alert(
        status === 'completed'
          ? '✅ Submission verified and completed.'
          : '✅ Submission marked as passed.'
      );
    } catch (error) {
      console.error(error);
      alert('Something went wrong.');
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return <Spinner className="py-20" />;
  }

  if (!profile) {
    return null;
  }

  /*
   * Search + status filter.
   */
  const filtered = submissions.filter((submission) => {
    if (search) {
      const query = search.toLowerCase();

      const studentName =
        submission.student?.full_name?.toLowerCase() || '';

      const programTitle =
        submission.program?.title?.toLowerCase() || '';

      const rollNumber =
        submission.student?.roll_number?.toLowerCase() || '';

      if (
        !studentName.includes(query) &&
        !programTitle.includes(query) &&
        !rollNumber.includes(query)
      ) {
        return false;
      }
    }

    if (
      filterStatus !== 'all' &&
      submission.status !== filterStatus
    ) {
      return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Submissions
        </h2>

        <p className="mt-1 text-gray-500">
          Review student code, scores and test results.
        </p>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

          <input
            className="input pl-10"
            placeholder="Search by student, roll number or program..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="input sm:w-44"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="attempted">Attempted</option>
          <option value="passed">Passed</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Submission list */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-6 w-6" />}
          title="No submissions"
          description="Student submissions will appear here for review."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((submission) => {
            const marks = submission.program?.marks || 0;
            const score = submission.score || 0;

            return (
              <Card key={submission.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-medium text-gray-900">
                        {submission.program?.title ||
                          'Unknown Program'}
                      </h3>

                      <Badge
                        className={statusColor(
                          submission.status
                        )}
                      >
                        {statusLabel(submission.status)}
                      </Badge>

                      {submission.program && (
                        <Badge
                          className={difficultyColor(
                            submission.program.difficulty
                          )}
                        >
                          {submission.program.difficulty}
                        </Badge>
                      )}
                    </div>

                    <p className="mt-1 text-sm text-gray-500">
                      {submission.student?.full_name ||
                        'Unknown Student'}{' '}
                      (
                      {submission.student?.roll_number ||
                        'no roll'}
                      ){' '}
                      ·{' '}
                      {formatDateTime(
                        submission.submitted_at
                      )}
                    </p>

                    {/* Score */}
                    <div className="mt-3 flex flex-wrap gap-4 text-sm">
                      <span className="font-semibold text-gray-900">
                        Score: {score}/{marks}
                      </span>

                      <span className="text-gray-500">
                        {submission.program?.language || 'Code'}
                      </span>
                    </div>

                    {submission.feedback && (
                      <p className="mt-2 text-xs text-blue-600">
                        Feedback: {submission.feedback}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => openReview(submission)}
                    className="btn-secondary text-sm"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Review
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Review Modal */}
      <Modal
        open={!!reviewing}
        onClose={() => setReviewing(null)}
        title="Review Submission"
        size="lg"
      >
        {reviewing && (
          <div className="space-y-4">
            {/* Program information */}
            <div className="rounded-lg bg-gray-50 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-gray-900">
                    {reviewing.program?.title ||
                      'Unknown Program'}
                  </p>

                  <p className="text-sm text-gray-500">
                    {reviewing.student?.full_name ||
                      'Unknown Student'}{' '}
                    ·{' '}
                    {reviewing.program?.language || 'Code'}
                  </p>
                </div>

                <Badge
                  className={statusColor(
                    reviewing.status
                  )}
                >
                  {statusLabel(reviewing.status)}
                </Badge>
              </div>

              {/* Score */}
              <div className="mt-4 flex gap-6">
                <div>
                  <p className="text-xs text-gray-500">
                    Score
                  </p>

                  <p className="text-xl font-bold text-gray-900">
                    {reviewing.score || 0}/
                    {reviewing.program?.marks || 0}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">
                    Submitted
                  </p>

                  <p className="text-sm font-medium text-gray-900">
                    {formatDateTime(
                      reviewing.submitted_at
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Student Code */}
            <div>
              <label className="label">
                Student Code
              </label>

              <pre className="max-h-72 overflow-x-auto rounded-md bg-gray-900 p-4 text-xs text-green-400">
                {reviewing.code}
              </pre>
            </div>

            {/* Output */}
            <div>
              <label className="label">
                Output
              </label>

              <pre className="max-h-48 overflow-x-auto rounded-md bg-gray-100 p-3 text-xs text-gray-700">
                {reviewing.output || 'No output provided.'}
              </pre>
            </div>

            {/* Explanation */}
            <div>
              <label className="label">
                Explanation
              </label>

              <p className="rounded-md bg-gray-50 p-3 text-sm text-gray-600">
                {reviewing.explanation ||
                  'No explanation provided.'}
              </p>
            </div>

            {/* Feedback */}
            <div>
              <label className="label">
                Feedback (optional)
              </label>

              <textarea
                className="input"
                rows={3}
                value={feedback}
                onChange={(e) =>
                  setFeedback(e.target.value)
                }
                placeholder="Provide feedback to the student..."
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
              <button
                onClick={() =>
                  verifySubmission('passed')
                }
                disabled={verifying}
                className="btn-secondary"
              >
                <CheckCircle2 className="h-4 w-4 text-blue-600" />
                Mark Passed
              </button>

              <button
                onClick={() =>
                  verifySubmission('completed')
                }
                disabled={verifying}
                className="btn-primary"
              >
                <CheckCircle2 className="h-4 w-4" />
                Verify & Complete
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}