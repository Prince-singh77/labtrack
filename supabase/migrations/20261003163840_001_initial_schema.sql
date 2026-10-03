/*
# LabTrack AI - Initial Database Schema

## Overview
Full schema for a college programming-lab management and student progress tracking platform.

## Tables Created
1. profiles - User profile with role (student/teacher/admin)
2. batches - Student batches/sections
3. subjects - Academic subjects
4. labs - Labs within a subject, assigned to batch and teacher
5. topics - Topics within a lab
6. programs - Programming questions within a topic
7. submissions - Student submissions with status tracking
8. quizzes - Quizzes attached to topics
9. quiz_questions - Questions within quizzes
10. quiz_attempts - Student quiz attempts with scores
11. notebook_templates - Teacher-defined notebook templates
12. notebook_entries - Student notebook entries
13. achievements - Defined achievements/badges
14. user_achievements - Earned achievements per user
15. notices - System notices
16. help_requests - Student help requests
17. activity_log - Student activity for streak calculation
18. ai_note_templates - Predefined AI Notes content

## Security
- RLS enabled on all tables
- Role-based write access: students write own data, teachers write course content, admins manage everything
*/

-- ===================== PROFILES (must come first, referenced by others) =====================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'student' CHECK (role IN ('student','teacher','admin')),
  email text NOT NULL,
  batch_id uuid,
  roll_number text,
  phone text,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_profiles" ON profiles;
CREATE POLICY "read_profiles" ON profiles FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "admin_update_profiles" ON profiles;
CREATE POLICY "admin_update_profiles" ON profiles FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
) WITH CHECK (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

-- ===================== BATCHES =====================
CREATE TABLE IF NOT EXISTS batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  year text NOT NULL,
  department text NOT NULL,
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_batches" ON batches;
CREATE POLICY "read_batches" ON batches FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "write_batches" ON batches;
CREATE POLICY "write_batches" ON batches FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher','admin'))
);
DROP POLICY IF EXISTS "update_batches" ON batches;
CREATE POLICY "update_batches" ON batches FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher','admin'))
) WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher','admin'))
);
DROP POLICY IF EXISTS "delete_batches_admin" ON batches;
CREATE POLICY "delete_batches_admin" ON batches FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Now add FK from profiles to batches
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'profiles_batch_id_fkey' AND table_name = 'profiles') THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ===================== SUBJECTS =====================
CREATE TABLE IF NOT EXISTS subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL,
  description text,
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_subjects" ON subjects;
CREATE POLICY "read_subjects" ON subjects FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "write_subjects" ON subjects;
CREATE POLICY "write_subjects" ON subjects FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher','admin'))
);
DROP POLICY IF EXISTS "update_subjects" ON subjects;
CREATE POLICY "update_subjects" ON subjects FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher','admin'))
) WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher','admin'))
);
DROP POLICY IF EXISTS "delete_subjects_admin" ON subjects;
CREATE POLICY "delete_subjects_admin" ON subjects FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ===================== LABS =====================
CREATE TABLE IF NOT EXISTS labs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  batch_id uuid REFERENCES batches(id) ON DELETE SET NULL,
  teacher_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE labs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_labs" ON labs;
CREATE POLICY "read_labs" ON labs FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "write_labs" ON labs;
CREATE POLICY "write_labs" ON labs FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher','admin'))
);
DROP POLICY IF EXISTS "update_labs" ON labs;
CREATE POLICY "update_labs" ON labs FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher','admin'))
) WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher','admin'))
);
DROP POLICY IF EXISTS "delete_labs" ON labs;
CREATE POLICY "delete_labs" ON labs FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher','admin'))
);

-- ===================== TOPICS =====================
CREATE TABLE IF NOT EXISTS topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id uuid NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_topics" ON topics;
CREATE POLICY "read_topics" ON topics FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "write_topics" ON topics;
CREATE POLICY "write_topics" ON topics FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher','admin'))
);
DROP POLICY IF EXISTS "update_topics" ON topics;
CREATE POLICY "update_topics" ON topics FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher','admin'))
) WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher','admin'))
);
DROP POLICY IF EXISTS "delete_topics" ON topics;
CREATE POLICY "delete_topics" ON topics FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher','admin'))
);

-- ===================== PROGRAMS =====================
CREATE TABLE IF NOT EXISTS programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  difficulty text NOT NULL DEFAULT 'easy' CHECK (difficulty IN ('easy','medium','hard')),
  language text NOT NULL DEFAULT 'C',
  expected_output text,
  test_cases jsonb DEFAULT '[]'::jsonb,
  marks int DEFAULT 10,
  deadline timestamptz,
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_programs" ON programs;
CREATE POLICY "read_programs" ON programs FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "write_programs" ON programs;
CREATE POLICY "write_programs" ON programs FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher','admin'))
);
DROP POLICY IF EXISTS "update_programs" ON programs;
CREATE POLICY "update_programs" ON programs FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher','admin'))
) WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher','admin'))
);
DROP POLICY IF EXISTS "delete_programs" ON programs;
CREATE POLICY "delete_programs" ON programs FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher','admin'))
);

-- ===================== SUBMISSIONS =====================
CREATE TABLE IF NOT EXISTS submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  student_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  code text NOT NULL DEFAULT '',
  output text DEFAULT '',
  explanation text DEFAULT '',
  status text NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started','attempted','passed','completed')),
  feedback text,
  verified_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  verified_at timestamptz,
  submitted_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_submissions" ON submissions;
CREATE POLICY "read_submissions" ON submissions FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_submissions" ON submissions;
CREATE POLICY "insert_submissions" ON submissions FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);
DROP POLICY IF EXISTS "update_submissions_student" ON submissions;
CREATE POLICY "update_submissions_student" ON submissions FOR UPDATE TO authenticated
USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);
DROP POLICY IF EXISTS "verify_submissions_teacher" ON submissions;
CREATE POLICY "verify_submissions_teacher" ON submissions FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher','admin')))
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher','admin')));
DROP POLICY IF EXISTS "delete_submissions" ON submissions;
CREATE POLICY "delete_submissions" ON submissions FOR DELETE TO authenticated USING (
  auth.uid() = student_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher','admin'))
);

-- ===================== QUIZZES =====================
CREATE TABLE IF NOT EXISTS quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  passing_score int DEFAULT 50,
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_quizzes" ON quizzes;
CREATE POLICY "read_quizzes" ON quizzes FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "write_quizzes" ON quizzes;
CREATE POLICY "write_quizzes" ON quizzes FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher','admin'))
);
DROP POLICY IF EXISTS "update_quizzes" ON quizzes;
CREATE POLICY "update_quizzes" ON quizzes FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher','admin'))
) WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher','admin'))
);
DROP POLICY IF EXISTS "delete_quizzes" ON quizzes;
CREATE POLICY "delete_quizzes" ON quizzes FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher','admin'))
);

-- ===================== QUIZ QUESTIONS =====================
CREATE TABLE IF NOT EXISTS quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question_type text NOT NULL DEFAULT 'mcq' CHECK (question_type IN ('mcq','output','debug','concept')),
  question text NOT NULL,
  options jsonb DEFAULT '[]'::jsonb,
  correct_answer text NOT NULL,
  explanation text,
  marks int DEFAULT 1,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_quiz_questions" ON quiz_questions;
CREATE POLICY "read_quiz_questions" ON quiz_questions FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "write_quiz_questions" ON quiz_questions;
CREATE POLICY "write_quiz_questions" ON quiz_questions FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher','admin'))
);
DROP POLICY IF EXISTS "update_quiz_questions" ON quiz_questions;
CREATE POLICY "update_quiz_questions" ON quiz_questions FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher','admin'))
) WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher','admin'))
);
DROP POLICY IF EXISTS "delete_quiz_questions" ON quiz_questions;
CREATE POLICY "delete_quiz_questions" ON quiz_questions FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher','admin'))
);

-- ===================== QUIZ ATTEMPTS =====================
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  student_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  score int NOT NULL DEFAULT 0,
  total int NOT NULL DEFAULT 0,
  percentage numeric DEFAULT 0,
  answers jsonb DEFAULT '[]'::jsonb,
  attempted_at timestamptz DEFAULT now()
);
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_quiz_attempts" ON quiz_attempts;
CREATE POLICY "read_quiz_attempts" ON quiz_attempts FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_quiz_attempts" ON quiz_attempts;
CREATE POLICY "insert_quiz_attempts" ON quiz_attempts FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);

-- ===================== NOTEBOOK TEMPLATES =====================
CREATE TABLE IF NOT EXISTS notebook_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id uuid REFERENCES labs(id) ON DELETE SET NULL,
  title text NOT NULL,
  sections jsonb NOT NULL DEFAULT '["experiment_number","title","aim","theory","algorithm","code","output","result","viva_questions"]'::jsonb,
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE notebook_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_notebook_templates" ON notebook_templates;
CREATE POLICY "read_notebook_templates" ON notebook_templates FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "write_notebook_templates" ON notebook_templates;
CREATE POLICY "write_notebook_templates" ON notebook_templates FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher','admin'))
);
DROP POLICY IF EXISTS "update_notebook_templates" ON notebook_templates;
CREATE POLICY "update_notebook_templates" ON notebook_templates FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher','admin'))
) WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher','admin'))
);
DROP POLICY IF EXISTS "delete_notebook_templates" ON notebook_templates;
CREATE POLICY "delete_notebook_templates" ON notebook_templates FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher','admin'))
);

-- ===================== NOTEBOOK ENTRIES =====================
CREATE TABLE IF NOT EXISTS notebook_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  student_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id uuid REFERENCES notebook_templates(id) ON DELETE SET NULL,
  experiment_number int,
  title text,
  aim text,
  theory text,
  algorithm text,
  code text,
  output text,
  result text,
  viva_questions jsonb DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','completed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE notebook_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_notebook_entries" ON notebook_entries;
CREATE POLICY "read_notebook_entries" ON notebook_entries FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_notebook_entries" ON notebook_entries;
CREATE POLICY "insert_notebook_entries" ON notebook_entries FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);
DROP POLICY IF EXISTS "update_notebook_entries" ON notebook_entries;
CREATE POLICY "update_notebook_entries" ON notebook_entries FOR UPDATE TO authenticated USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);
DROP POLICY IF EXISTS "delete_notebook_entries" ON notebook_entries;
CREATE POLICY "delete_notebook_entries" ON notebook_entries FOR DELETE TO authenticated USING (auth.uid() = student_id);

-- ===================== ACHIEVEMENTS =====================
CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL DEFAULT 'award',
  criteria jsonb DEFAULT '{}'::jsonb,
  points int DEFAULT 10,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_achievements" ON achievements;
CREATE POLICY "read_achievements" ON achievements FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "write_achievements" ON achievements;
CREATE POLICY "write_achievements" ON achievements FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
DROP POLICY IF EXISTS "update_achievements" ON achievements;
CREATE POLICY "update_achievements" ON achievements FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
) WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ===================== USER ACHIEVEMENTS =====================
CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id uuid NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at timestamptz DEFAULT now()
);
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_user_achievements" ON user_achievements;
CREATE POLICY "read_user_achievements" ON user_achievements FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_user_achievements" ON user_achievements;
CREATE POLICY "insert_user_achievements" ON user_achievements FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ===================== NOTICES =====================
CREATE TABLE IF NOT EXISTS notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  audience text NOT NULL DEFAULT 'all' CHECK (audience IN ('all','students','teachers')),
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_notices" ON notices;
CREATE POLICY "read_notices" ON notices FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "write_notices" ON notices;
CREATE POLICY "write_notices" ON notices FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher','admin'))
);
DROP POLICY IF EXISTS "update_notices" ON notices;
CREATE POLICY "update_notices" ON notices FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher','admin'))
) WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher','admin'))
);
DROP POLICY IF EXISTS "delete_notices" ON notices;
CREATE POLICY "delete_notices" ON notices FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher','admin'))
);

-- ===================== HELP REQUESTS =====================
CREATE TABLE IF NOT EXISTS help_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id uuid REFERENCES programs(id) ON DELETE CASCADE,
  question text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','answered','closed')),
  response text,
  responded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  responded_at timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE help_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_help_requests" ON help_requests;
CREATE POLICY "read_help_requests" ON help_requests FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_help_requests" ON help_requests;
CREATE POLICY "insert_help_requests" ON help_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);
DROP POLICY IF EXISTS "update_help_requests_student" ON help_requests;
CREATE POLICY "update_help_requests_student" ON help_requests FOR UPDATE TO authenticated
USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);
DROP POLICY IF EXISTS "respond_help_requests_teacher" ON help_requests;
CREATE POLICY "respond_help_requests_teacher" ON help_requests FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher','admin')))
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher','admin')));

-- ===================== ACTIVITY LOG =====================
CREATE TABLE IF NOT EXISTS activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type text NOT NULL,
  description text,
  metadata jsonb DEFAULT '{}'::jsonb,
  activity_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_activity_log" ON activity_log;
CREATE POLICY "read_activity_log" ON activity_log FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_activity_log" ON activity_log;
CREATE POLICY "insert_activity_log" ON activity_log FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ===================== AI NOTE TEMPLATES =====================
CREATE TABLE IF NOT EXISTS ai_note_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic text NOT NULL,
  language text DEFAULT 'C',
  aim text,
  theory text,
  algorithm text,
  explanation text,
  viva_questions jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE ai_note_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_ai_note_templates" ON ai_note_templates;
CREATE POLICY "read_ai_note_templates" ON ai_note_templates FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "write_ai_note_templates" ON ai_note_templates;
CREATE POLICY "write_ai_note_templates" ON ai_note_templates FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher','admin'))
);
DROP POLICY IF EXISTS "update_ai_note_templates" ON ai_note_templates;
CREATE POLICY "update_ai_note_templates" ON ai_note_templates FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher','admin'))
) WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher','admin'))
);
DROP POLICY IF EXISTS "delete_ai_note_templates" ON ai_note_templates;
CREATE POLICY "delete_ai_note_templates" ON ai_note_templates FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher','admin'))
);

-- ===================== INDEXES =====================
CREATE INDEX IF NOT EXISTS idx_submissions_program_student ON submissions(program_id, student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student ON submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_programs_topic ON programs(topic_id);
CREATE INDEX IF NOT EXISTS idx_topics_lab ON topics(lab_id);
CREATE INDEX IF NOT EXISTS idx_labs_subject ON labs(subject_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_student ON quiz_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_user_date ON activity_log(user_id, activity_date);
CREATE INDEX IF NOT EXISTS idx_notebook_entries_student ON notebook_entries(student_id);
CREATE INDEX IF NOT EXISTS idx_help_requests_student ON help_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_profiles_batch ON profiles(batch_id);