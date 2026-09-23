-- Roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'teacher', 'student');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  streak_days INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;

GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;

GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- has_role helper (security definer to avoid recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- Admin-only policies on user_roles
CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Auto-create profile + student role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student');

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Lock down SECURITY DEFINER functions: only server-side / triggers should execute
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

REVOKE ALL ON FUNCTION public.tg_set_updated_at() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.tg_set_updated_at() TO service_role;

-- Ensure search_path pinned (already set but reassert)
ALTER FUNCTION public.tg_set_updated_at() SET search_path = public;

CREATE TYPE public.topic_category AS ENUM ('algebra', 'geometriya', 'milliy-sertifikat', 'dtm', 'attestatsiya', 'boshqa');

CREATE TYPE public.question_difficulty AS ENUM ('easy', 'medium', 'hard');

-- TOPICS
CREATE TABLE public.topics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  category public.topic_category NOT NULL DEFAULT 'boshqa',
  sort_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.topics TO authenticated;

GRANT SELECT ON public.topics TO anon;

GRANT ALL ON public.topics TO service_role;

ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published topics" ON public.topics FOR SELECT USING (is_published = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage topics" ON public.topics FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_topics_updated_at BEFORE UPDATE ON public.topics FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- QUESTIONS
CREATE TABLE public.questions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id uuid NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  body text NOT NULL,
  explanation text,
  difficulty public.question_difficulty NOT NULL DEFAULT 'medium',
  image_url text,
  video_url text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.questions TO authenticated;

GRANT SELECT ON public.questions TO anon;

GRANT ALL ON public.questions TO service_role;

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view questions" ON public.questions FOR SELECT USING (true);

CREATE POLICY "Admins can manage questions" ON public.questions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_questions_updated_at BEFORE UPDATE ON public.questions FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE INDEX questions_topic_idx ON public.questions(topic_id);

-- QUESTION OPTIONS
CREATE TABLE public.question_options (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  body text NOT NULL,
  is_correct boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.question_options TO authenticated;

GRANT SELECT ON public.question_options TO anon;

GRANT ALL ON public.question_options TO service_role;

ALTER TABLE public.question_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view options" ON public.question_options FOR SELECT USING (true);

CREATE POLICY "Admins can manage options" ON public.question_options FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX question_options_question_idx ON public.question_options(question_id);

-- TEST ATTEMPTS
CREATE TABLE public.test_attempts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id uuid NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  total_questions integer NOT NULL DEFAULT 0,
  correct_count integer NOT NULL DEFAULT 0,
  score integer NOT NULL DEFAULT 0,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.test_attempts TO authenticated;

GRANT ALL ON public.test_attempts TO service_role;

ALTER TABLE public.test_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own attempts" ON public.test_attempts FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users create own attempts" ON public.test_attempts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own attempts" ON public.test_attempts FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX test_attempts_user_idx ON public.test_attempts(user_id);

-- TEST ANSWERS
CREATE TABLE public.test_answers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  attempt_id uuid NOT NULL REFERENCES public.test_attempts(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  selected_option_id uuid REFERENCES public.question_options(id) ON DELETE SET NULL,
  is_correct boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(attempt_id, question_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.test_answers TO authenticated;

GRANT ALL ON public.test_answers TO service_role;

ALTER TABLE public.test_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own answers" ON public.test_answers FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.test_attempts a WHERE a.id = attempt_id AND a.user_id = auth.uid()));

CREATE POLICY "Users insert own answers" ON public.test_answers FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.test_attempts a WHERE a.id = attempt_id AND a.user_id = auth.uid()));

CREATE POLICY "Users update own answers" ON public.test_answers FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.test_attempts a WHERE a.id = attempt_id AND a.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.test_attempts a WHERE a.id = attempt_id AND a.user_id = auth.uid()));

CREATE INDEX test_answers_attempt_idx ON public.test_answers(attempt_id);

-- Mock exams
CREATE TABLE public.mock_exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'milliy-sertifikat',
  duration_minutes INT NOT NULL DEFAULT 60,
  is_published BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.mock_exams TO anon, authenticated;

GRANT ALL ON public.mock_exams TO service_role;

ALTER TABLE public.mock_exams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mock_exams_read_published" ON public.mock_exams FOR SELECT USING (is_published = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "mock_exams_admin_write" ON public.mock_exams FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_mock_exams_updated BEFORE UPDATE ON public.mock_exams FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Junction: mock exam questions
CREATE TABLE public.mock_exam_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mock_exam_id UUID NOT NULL REFERENCES public.mock_exams(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (mock_exam_id, question_id)
);

GRANT SELECT ON public.mock_exam_questions TO anon, authenticated;

GRANT ALL ON public.mock_exam_questions TO service_role;

ALTER TABLE public.mock_exam_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "meq_read_all" ON public.mock_exam_questions FOR SELECT USING (true);

CREATE POLICY "meq_admin_write" ON public.mock_exam_questions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Extend test_attempts to support mock exams
ALTER TABLE public.test_attempts
  ALTER COLUMN topic_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS mock_exam_id UUID REFERENCES public.mock_exams(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS time_spent_seconds INT;

CREATE OR REPLACE FUNCTION public.claim_admin_if_none()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
  admin_count INT;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  SELECT COUNT(*) INTO admin_count FROM public.user_roles WHERE role = 'admin';
  IF admin_count > 0 THEN
    RETURN false;
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (uid, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_admin_if_none() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.claim_admin_if_none() TO authenticated;

-- ============ CLASSES ============
CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  subject TEXT NOT NULL DEFAULT 'Matematika',
  join_code TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.classes TO authenticated;

GRANT ALL ON public.classes TO service_role;

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.class_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (class_id, student_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.class_members TO authenticated;

GRANT ALL ON public.class_members TO service_role;

ALTER TABLE public.class_members ENABLE ROW LEVEL SECURITY;

-- helper functions (security definer, avoid recursive RLS)
CREATE OR REPLACE FUNCTION public.is_class_teacher(_class_id UUID, _user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.classes c WHERE c.id = _class_id AND c.teacher_id = _user_id);
$$;

CREATE OR REPLACE FUNCTION public.is_class_member(_class_id UUID, _user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.class_members m
    WHERE m.class_id = _class_id AND m.student_id = _user_id AND m.status = 'active'
  );
$$;

CREATE POLICY "Teachers manage own classes" ON public.classes FOR ALL TO authenticated
  USING (teacher_id = auth.uid() OR has_role(auth.uid(), 'admin'))
  WITH CHECK (teacher_id = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Members view their classes" ON public.classes FOR SELECT TO authenticated
  USING (public.is_class_member(id, auth.uid()));

CREATE POLICY "Teacher manages members" ON public.class_members FOR ALL TO authenticated
  USING (public.is_class_teacher(class_id, auth.uid()) OR has_role(auth.uid(), 'admin'))
  WITH CHECK (public.is_class_teacher(class_id, auth.uid()) OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Student views own membership" ON public.class_members FOR SELECT TO authenticated
  USING (student_id = auth.uid() OR public.is_class_member(class_id, auth.uid()));

CREATE POLICY "Student joins class" ON public.class_members FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Student leaves class" ON public.class_members FOR DELETE TO authenticated
  USING (student_id = auth.uid());

-- ============ VIDEO LESSONS ============
CREATE TABLE public.video_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  subject TEXT NOT NULL DEFAULT 'Matematika',
  topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  pdf_url TEXT,
  duration_seconds INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.video_lessons TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.video_lessons TO authenticated;

GRANT ALL ON public.video_lessons TO service_role;

ALTER TABLE public.video_lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone views published videos" ON public.video_lessons FOR SELECT
  USING (is_published = true OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage videos" ON public.video_lessons FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE TABLE public.video_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES public.video_lessons(id) ON DELETE CASCADE,
  seconds_watched INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, video_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.video_progress TO authenticated;

GRANT ALL ON public.video_progress TO service_role;

ALTER TABLE public.video_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own video progress" ON public.video_progress FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============ ASSIGNMENTS ============
CREATE TABLE public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  kind TEXT NOT NULL DEFAULT 'test',
  topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL,
  mock_exam_id UUID REFERENCES public.mock_exams(id) ON DELETE SET NULL,
  video_id UUID REFERENCES public.video_lessons(id) ON DELETE SET NULL,
  attachment_url TEXT,
  max_score INTEGER NOT NULL DEFAULT 100,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  due_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.assignments TO authenticated;

GRANT ALL ON public.assignments TO service_role;

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teacher manages assignments" ON public.assignments FOR ALL TO authenticated
  USING (public.is_class_teacher(class_id, auth.uid()) OR has_role(auth.uid(), 'admin'))
  WITH CHECK (public.is_class_teacher(class_id, auth.uid()) OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Members view assignments" ON public.assignments FOR SELECT TO authenticated
  USING (public.is_class_member(class_id, auth.uid()));

CREATE TABLE public.assignment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  attempt_id UUID REFERENCES public.test_attempts(id) ON DELETE SET NULL,
  content TEXT,
  file_url TEXT,
  score INTEGER,
  grade INTEGER,
  feedback TEXT,
  is_late BOOLEAN NOT NULL DEFAULT false,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (assignment_id, student_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.assignment_submissions TO authenticated;

GRANT ALL ON public.assignment_submissions TO service_role;

ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_assignment_teacher(_assignment_id UUID, _user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.assignments a JOIN public.classes c ON c.id = a.class_id
    WHERE a.id = _assignment_id AND c.teacher_id = _user_id
  );
$$;

CREATE POLICY "Student manages own submission" ON public.assignment_submissions FOR ALL TO authenticated
  USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());

CREATE POLICY "Teacher views class submissions" ON public.assignment_submissions FOR SELECT TO authenticated
  USING (public.is_assignment_teacher(assignment_id, auth.uid()) OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Teacher grades submissions" ON public.assignment_submissions FOR UPDATE TO authenticated
  USING (public.is_assignment_teacher(assignment_id, auth.uid()) OR has_role(auth.uid(), 'admin'))
  WITH CHECK (public.is_assignment_teacher(assignment_id, auth.uid()) OR has_role(auth.uid(), 'admin'));

-- ============ CLASS MESSAGES ============
CREATE TABLE public.class_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  is_announcement BOOLEAN NOT NULL DEFAULT false,
  file_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.class_messages TO authenticated;

GRANT ALL ON public.class_messages TO service_role;

ALTER TABLE public.class_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Class participants read messages" ON public.class_messages FOR SELECT TO authenticated
  USING (public.is_class_member(class_id, auth.uid()) OR public.is_class_teacher(class_id, auth.uid()));

CREATE POLICY "Class participants post messages" ON public.class_messages FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND (public.is_class_member(class_id, auth.uid()) OR public.is_class_teacher(class_id, auth.uid())));

CREATE POLICY "Author or teacher deletes message" ON public.class_messages FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_class_teacher(class_id, auth.uid()));

-- ============ ROLE SELECTION AT SIGNUP ============
CREATE OR REPLACE FUNCTION public.set_initial_role(_role app_role)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid UUID := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _role NOT IN ('teacher', 'student') THEN RAISE EXCEPTION 'Invalid role'; END IF;
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = uid AND role IN ('admin','teacher')) THEN
    RETURN false;
  END IF;
  DELETE FROM public.user_roles WHERE user_id = uid AND role = 'student';
  INSERT INTO public.user_roles (user_id, role) VALUES (uid, _role)
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN true;
END;
$$;

-- ============ TRIGGERS ============
CREATE TRIGGER set_classes_updated_at BEFORE UPDATE ON public.classes FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TRIGGER set_videos_updated_at BEFORE UPDATE ON public.video_lessons FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TRIGGER set_video_progress_updated_at BEFORE UPDATE ON public.video_progress FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TRIGGER set_assignments_updated_at BEFORE UPDATE ON public.assignments FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TRIGGER set_submissions_updated_at BEFORE UPDATE ON public.assignment_submissions FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE INDEX idx_class_members_student ON public.class_members(student_id);

CREATE INDEX idx_assignments_class ON public.assignments(class_id);

CREATE INDEX idx_submissions_assignment ON public.assignment_submissions(assignment_id);

CREATE INDEX idx_class_messages_class ON public.class_messages(class_id, created_at DESC);

CREATE INDEX idx_video_lessons_topic ON public.video_lessons(topic_id);

ALTER TABLE public.class_members
  ADD CONSTRAINT class_members_student_id_profiles_fkey
  FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.class_messages
  ADD CONSTRAINT class_messages_user_id_profiles_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.assignment_submissions
  ADD CONSTRAINT assignment_submissions_assignment_student_key
  UNIQUE (assignment_id, student_id);

ALTER TABLE public.assignment_submissions
  ADD CONSTRAINT assignment_submissions_student_id_profiles_fkey
  FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

CREATE TABLE public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  subtitle TEXT,
  full_name TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 0,
  percent INTEGER NOT NULL DEFAULT 0,
  attempt_id UUID REFERENCES public.test_attempts(id) ON DELETE SET NULL,
  issued_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.certificates TO authenticated;

GRANT SELECT ON public.certificates TO anon;

GRANT ALL ON public.certificates TO service_role;

ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can verify certificates"
  ON public.certificates FOR SELECT USING (true);

CREATE POLICY "Users create own certificates"
  ON public.certificates FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER certificates_set_updated_at
  BEFORE UPDATE ON public.certificates
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'premium';

-- 1. Modules
CREATE TABLE IF NOT EXISTS public.modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  direction text NOT NULL,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.modules TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.modules TO authenticated;

GRANT ALL ON public.modules TO service_role;

ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Published modules are viewable" ON public.modules;

CREATE POLICY "Published modules are viewable" ON public.modules FOR SELECT USING (is_published OR public.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "Admins manage modules" ON public.modules;

CREATE POLICY "Admins manage modules" ON public.modules FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

ALTER TABLE public.topics ADD COLUMN IF NOT EXISTS module_id uuid REFERENCES public.modules(id) ON DELETE SET NULL;

ALTER TABLE public.video_lessons ADD COLUMN IF NOT EXISTS module_id uuid REFERENCES public.modules(id) ON DELETE SET NULL;

ALTER TABLE public.video_lessons ADD COLUMN IF NOT EXISTS author text;

-- 2. Profiles extras
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_banned boolean NOT NULL DEFAULT false;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_active_at timestamptz;

DROP POLICY IF EXISTS "Admins manage profiles" ON public.profiles;

CREATE POLICY "Admins manage profiles" ON public.profiles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.touch_last_active()
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.profiles SET last_active_at = now() WHERE id = auth.uid();
$$;

REVOKE EXECUTE ON FUNCTION public.touch_last_active() FROM anon;

-- 3. Site settings
CREATE TABLE IF NOT EXISTS public.site_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.site_settings TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;

GRANT ALL ON public.site_settings TO service_role;

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Settings are readable" ON public.site_settings;

CREATE POLICY "Settings are readable" ON public.site_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins manage settings" ON public.site_settings;

CREATE POLICY "Admins manage settings" ON public.site_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- 4. Join class by code (fixes classes join flow blocked by RLS)
CREATE OR REPLACE FUNCTION public.join_class_by_code(_code text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _class_id uuid; _active boolean; _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Avval tizimga kiring'; END IF;
  SELECT id, is_active INTO _class_id, _active FROM public.classes
    WHERE upper(join_code) = upper(trim(_code)) LIMIT 1;
  IF _class_id IS NULL THEN RAISE EXCEPTION 'Bunday kodli sinf topilmadi'; END IF;
  IF NOT _active THEN RAISE EXCEPTION 'Sinf yopilgan'; END IF;
  IF EXISTS (SELECT 1 FROM public.classes WHERE id = _class_id AND teacher_id = _uid) THEN
    RAISE EXCEPTION 'Bu sinfning o''qituvchisisiz';
  END IF;
  INSERT INTO public.class_members(class_id, student_id, status)
    VALUES (_class_id, _uid, 'active')
    ON CONFLICT (class_id, student_id) DO NOTHING;
  RETURN _class_id;
END; $$;

REVOKE EXECUTE ON FUNCTION public.join_class_by_code(text) FROM anon;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS country text DEFAULT 'O''zbekiston',
  ADD COLUMN IF NOT EXISTS region text,
  ADD COLUMN IF NOT EXISTS district text,
  ADD COLUMN IF NOT EXISTS school text;