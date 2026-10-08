export type Role = 'student' | 'teacher' | 'admin';

export type ProgramStatus =
  | 'not_started'
  | 'attempted'
  | 'passed'
  | 'completed';

export type QuestionType =
  | 'mcq'
  | 'output'
  | 'debug'
  | 'concept';

export interface Profile {
  id: string;
  full_name: string;
  role: Role;
  email: string;
  batch_id: string | null;
  roll_number: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Batch {
  id: string;
  name: string;
  year: string;
  department: string;
  created_by: string;
  created_at: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  description: string | null;
  created_by: string;
  created_at: string;
}

export interface Lab {
  id: string;
  subject_id: string;
  name: string;
  description: string | null;
  batch_id: string | null;
  teacher_id: string | null;
  created_at: string;
  subject?: Subject;
  batch?: Batch;
}

export interface Topic {
  id: string;
  lab_id: string;
  name: string;
  description: string | null;
  sort_order: number;
  created_at: string;
}

export interface Program {
  id: string;
  topic_id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  language: string;
  expected_output: string | null;
  test_cases: any[];
  marks: number;
  deadline: string | null;
  created_by: string;
  created_at: string;
  topic?: Topic;
}

export interface Submission {
  id: string;
  program_id: string;
  student_id: string;
  code: string;
  output: string;
  explanation: string;
  status: ProgramStatus;

  // Automatic score calculated from test cases
  score?: number;

  feedback: string | null;
  verified_by: string | null;
  verified_at: string | null;
  submitted_at: string;
  created_at: string;

  program?: Program;
  student?: Profile;
}

export interface Quiz {
  id: string;
  topic_id: string;
  title: string;
  description: string | null;
  passing_score: number;
  created_by: string;
  created_at: string;
  topic?: Topic;
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question_type: QuestionType;
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string | null;
  marks: number;
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  student_id: string;
  score: number;
  total: number;
  percentage: number;
  answers: any[];
  attempted_at: string;
  quiz?: Quiz;
}

export interface NotebookTemplate {
  id: string;
  lab_id: string | null;
  title: string;
  sections: string[];
  created_by: string;
  created_at: string;
  lab?: Lab;
}

export interface NotebookEntry {
  id: string;
  program_id: string;
  student_id: string;
  template_id: string | null;
  experiment_number: number | null;
  title: string | null;
  aim: string | null;
  theory: string | null;
  algorithm: string | null;
  code: string | null;
  output: string | null;
  result: string | null;
  viva_questions: any[];
  status: 'draft' | 'completed';
  created_at: string;
  updated_at: string;
  program?: Program;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  criteria: any;
  points: number;
  created_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_at: string;
  achievement?: Achievement;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  audience: 'all' | 'students' | 'teachers';
  created_by: string;
  created_at: string;
}

export interface HelpRequest {
  id: string;
  student_id: string;
  program_id: string | null;
  question: string;
  status: 'open' | 'answered' | 'closed';
  response: string | null;
  responded_by: string | null;
  responded_at: string | null;
  created_at: string;
  program?: Program;
  student?: Profile;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  activity_type: string;
  description: string | null;
  metadata: any;
  activity_date: string;
  created_at: string;
}

export interface AiNoteTemplate {
  id: string;
  topic: string;
  language: string;
  aim: string | null;
  theory: string | null;
  algorithm: string | null;
  explanation: string | null;
  viva_questions: string[];
}