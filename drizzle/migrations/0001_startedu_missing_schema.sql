-- ============ SUBJECT ENUM ============
CREATE TYPE public.subject_key AS ENUM ('matematika','fizika','kimyo','biologiya','tarix');

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subject public.subject_key NOT NULL DEFAULT 'matematika';

-- ============ USER DEVICES ============
CREATE TABLE public.user_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_key text NOT NULL,
  device_name text NOT NULL DEFAULT 'Qurilma',
  browser text,
  os text,
  is_mobile boolean NOT NULL DEFAULT false,
  user_agent text,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, device_key)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_devices TO authenticated;
GRANT ALL ON public.user_devices TO service_role;
ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own devices" ON public.user_devices FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============ AUDIT LOGS ============
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  action text NOT NULL,
  entity text NOT NULL,
  entity_id text,
  summary text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read audit logs" ON public.audit_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX audit_logs_entity_idx ON public.audit_logs(entity, created_at DESC);

CREATE OR REPLACE FUNCTION public.tg_audit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _action text;
  _row jsonb;
  _summary text;
BEGIN
  IF TG_OP = 'INSERT' THEN _action := 'create'; _row := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN _action := 'update'; _row := to_jsonb(NEW);
  ELSE _action := 'delete'; _row := to_jsonb(OLD);
  END IF;

  _summary := COALESCE(_row->>'title', _row->>'name', _row->>'body', _row->>'role', '');
  IF length(_summary) > 160 THEN _summary := left(_summary, 160) || '…'; END IF;

  INSERT INTO public.audit_logs (actor_id, action, entity, entity_id, summary)
  VALUES (auth.uid(), _action, TG_TABLE_NAME, _row->>'id', _summary);

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END; $$;

REVOKE ALL ON FUNCTION public.tg_audit() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.tg_audit() TO service_role;

CREATE TRIGGER trg_audit_topics AFTER INSERT OR UPDATE OR DELETE ON public.topics
  FOR EACH ROW EXECUTE FUNCTION public.tg_audit();
CREATE TRIGGER trg_audit_questions AFTER INSERT OR UPDATE OR DELETE ON public.questions
  FOR EACH ROW EXECUTE FUNCTION public.tg_audit();
CREATE TRIGGER trg_audit_video_lessons AFTER INSERT OR UPDATE OR DELETE ON public.video_lessons
  FOR EACH ROW EXECUTE FUNCTION public.tg_audit();
CREATE TRIGGER trg_audit_user_roles AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.tg_audit();
CREATE TRIGGER trg_audit_modules AFTER INSERT OR UPDATE OR DELETE ON public.modules
  FOR EACH ROW EXECUTE FUNCTION public.tg_audit();

-- ============ WRITTEN TASKS ============
CREATE TABLE public.written_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  body text NOT NULL,
  mode text NOT NULL DEFAULT 'short',
  expected_answer text,
  solution text,
  image_url text,
  max_score integer NOT NULL DEFAULT 1,
  difficulty public.question_difficulty NOT NULL DEFAULT 'medium',
  sort_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT written_tasks_mode_check CHECK (mode IN ('short','long'))
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.written_tasks TO authenticated;
GRANT SELECT ON public.written_tasks TO anon;
GRANT ALL ON public.written_tasks TO service_role;
ALTER TABLE public.written_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone views published written tasks" ON public.written_tasks FOR SELECT
  USING (is_published = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage written tasks" ON public.written_tasks FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_written_tasks_updated BEFORE UPDATE ON public.written_tasks
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE INDEX written_tasks_topic_idx ON public.written_tasks(topic_id);

-- ============ GLOBAL TESTS ============
CREATE TABLE public.global_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code text NOT NULL,
  title text NOT NULL,
  description text,
  duration_minutes integer NOT NULL DEFAULT 30,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX global_tests_code_key ON public.global_tests(code);

CREATE TABLE public.global_test_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid NOT NULL REFERENCES public.global_tests(id) ON DELETE CASCADE,
  body text NOT NULL,
  explanation text,
  image_url text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.global_test_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.global_test_questions(id) ON DELETE CASCADE,
  body text NOT NULL,
  is_correct boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.global_test_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid NOT NULL REFERENCES public.global_tests(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score integer NOT NULL DEFAULT 0,
  correct_count integer NOT NULL DEFAULT 0,
  total_questions integer NOT NULL DEFAULT 0,
  time_spent_seconds integer,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.global_test_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL REFERENCES public.global_test_attempts(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.global_test_questions(id) ON DELETE CASCADE,
  selected_option_id uuid REFERENCES public.global_test_options(id) ON DELETE SET NULL,
  is_correct boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (attempt_id, question_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.global_tests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.global_test_questions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.global_test_options TO authenticated;
GRANT SELECT, INSERT ON public.global_test_attempts TO authenticated;
GRANT SELECT, INSERT ON public.global_test_answers TO authenticated;
GRANT ALL ON public.global_tests TO service_role;
GRANT ALL ON public.global_test_questions TO service_role;
GRANT ALL ON public.global_test_options TO service_role;
GRANT ALL ON public.global_test_attempts TO service_role;
GRANT ALL ON public.global_test_answers TO service_role;

ALTER TABLE public.global_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_test_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_test_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_test_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_test_answers ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_global_test_owner(_test_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.global_tests t WHERE t.id = _test_id AND t.owner_id = _user_id);
$$;

CREATE OR REPLACE FUNCTION public.has_global_attempt(_test_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.global_test_attempts a WHERE a.test_id = _test_id AND a.user_id = _user_id);
$$;

REVOKE ALL ON FUNCTION public.is_global_test_owner(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_global_test_owner(uuid, uuid) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.has_global_attempt(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_global_attempt(uuid, uuid) TO authenticated, service_role;

CREATE POLICY "Owners manage global tests" ON public.global_tests FOR ALL TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Takers view attempted tests" ON public.global_tests FOR SELECT TO authenticated
  USING (public.has_global_attempt(id, auth.uid()));

CREATE POLICY "Owners manage global questions" ON public.global_test_questions FOR ALL TO authenticated
  USING (public.is_global_test_owner(test_id, auth.uid()) OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.is_global_test_owner(test_id, auth.uid()) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owners manage global options" ON public.global_test_options FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.global_test_questions q
                 WHERE q.id = question_id AND (public.is_global_test_owner(q.test_id, auth.uid()) OR public.has_role(auth.uid(), 'admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.global_test_questions q
                 WHERE q.id = question_id AND (public.is_global_test_owner(q.test_id, auth.uid()) OR public.has_role(auth.uid(), 'admin'))));

CREATE POLICY "Users view own global attempts" ON public.global_test_attempts FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_global_test_owner(test_id, auth.uid()) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users create own global attempts" ON public.global_test_attempts FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users view own global answers" ON public.global_test_answers FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.global_test_attempts a WHERE a.id = attempt_id AND a.user_id = auth.uid()));

CREATE POLICY "Users insert own global answers" ON public.global_test_answers FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.global_test_attempts a WHERE a.id = attempt_id AND a.user_id = auth.uid()));

CREATE INDEX global_test_questions_test_idx ON public.global_test_questions(test_id);
CREATE INDEX global_test_options_question_idx ON public.global_test_options(question_id);
CREATE INDEX global_test_attempts_test_idx ON public.global_test_attempts(test_id);
CREATE INDEX global_test_attempts_user_idx ON public.global_test_attempts(user_id);

CREATE TRIGGER trg_global_tests_updated BEFORE UPDATE ON public.global_tests
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- auto 6-char code
CREATE OR REPLACE FUNCTION public.tg_global_test_code()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  _code text;
  _i int;
BEGIN
  IF NEW.code IS NOT NULL AND length(trim(NEW.code)) = 6 THEN
    NEW.code := upper(trim(NEW.code));
    RETURN NEW;
  END IF;
  LOOP
    _code := '';
    FOR _i IN 1..6 LOOP
      _code := _code || substr(_alphabet, 1 + floor(random() * length(_alphabet))::int, 1);
    END LOOP;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.global_tests t WHERE t.code = _code);
  END LOOP;
  NEW.code := _code;
  RETURN NEW;
END; $$;

REVOKE ALL ON FUNCTION public.tg_global_test_code() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.tg_global_test_code() TO service_role;

CREATE TRIGGER trg_global_tests_code BEFORE INSERT ON public.global_tests
  FOR EACH ROW EXECUTE FUNCTION public.tg_global_test_code();

-- ============ PROFILE / LEADERBOARD RPCs ============
CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS public.profiles
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.* FROM public.profiles p WHERE p.id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.get_my_profile() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.leaderboard_rows()
RETURNS TABLE (
  id uuid,
  full_name text,
  username text,
  xp integer,
  level integer,
  streak_days integer,
  same_country boolean,
  same_region boolean,
  same_school boolean
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH me AS (SELECT country, region, school FROM public.profiles WHERE id = auth.uid())
  SELECT
    p.id,
    p.full_name,
    p.username,
    p.xp,
    p.level,
    p.streak_days,
    (me.country IS NOT NULL AND p.country IS NOT DISTINCT FROM me.country) AS same_country,
    (me.region IS NOT NULL AND p.region IS NOT DISTINCT FROM me.region) AS same_region,
    (me.school IS NOT NULL AND p.school IS NOT DISTINCT FROM me.school) AS same_school
  FROM public.profiles p LEFT JOIN me ON true
  WHERE COALESCE(p.is_banned, false) = false
  ORDER BY p.xp DESC, p.level DESC, p.created_at ASC
  LIMIT 200;
$$;

REVOKE ALL ON FUNCTION public.leaderboard_rows() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.leaderboard_rows() TO authenticated, service_role;

-- ============ TEST SUBMISSION ============
CREATE OR REPLACE FUNCTION public.submit_test_attempt(
  _topic_id uuid,
  _mock_exam_id uuid,
  _answers jsonb,
  _time_spent_seconds integer
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _attempt_id uuid;
  _total int := 0;
  _correct int := 0;
  _score int := 0;
  _item jsonb;
  _qid uuid;
  _oid uuid;
  _ok boolean;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Avval tizimga kiring'; END IF;
  IF _topic_id IS NULL AND _mock_exam_id IS NULL THEN RAISE EXCEPTION 'Test topilmadi'; END IF;

  INSERT INTO public.test_attempts (user_id, topic_id, mock_exam_id, time_spent_seconds, started_at)
  VALUES (_uid, _topic_id, _mock_exam_id, _time_spent_seconds, now())
  RETURNING id INTO _attempt_id;

  FOR _item IN SELECT * FROM jsonb_array_elements(COALESCE(_answers, '[]'::jsonb))
  LOOP
    _qid := NULLIF(_item->>'question_id','')::uuid;
    _oid := NULLIF(_item->>'selected_option_id','')::uuid;
    IF _qid IS NULL THEN CONTINUE; END IF;
    _total := _total + 1;
    _ok := false;
    IF _oid IS NOT NULL THEN
      SELECT o.is_correct INTO _ok FROM public.question_options o
        WHERE o.id = _oid AND o.question_id = _qid;
      _ok := COALESCE(_ok, false);
    END IF;
    IF _ok THEN _correct := _correct + 1; END IF;

    INSERT INTO public.test_answers (attempt_id, question_id, selected_option_id, is_correct)
    VALUES (_attempt_id, _qid, _oid, _ok)
    ON CONFLICT (attempt_id, question_id) DO UPDATE
      SET selected_option_id = EXCLUDED.selected_option_id, is_correct = EXCLUDED.is_correct;
  END LOOP;

  IF _total > 0 THEN _score := round(_correct::numeric * 100 / _total); END IF;

  UPDATE public.test_attempts
    SET total_questions = _total, correct_count = _correct, score = _score, completed_at = now()
    WHERE id = _attempt_id;

  UPDATE public.profiles
    SET xp = xp + (_correct * 10),
        level = GREATEST(1, ((xp + (_correct * 10)) / 500) + 1),
        last_active_at = now()
    WHERE id = _uid;

  RETURN _attempt_id;
END; $$;

REVOKE ALL ON FUNCTION public.submit_test_attempt(uuid, uuid, jsonb, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_test_attempt(uuid, uuid, jsonb, integer) TO authenticated, service_role;

-- ============ GLOBAL TEST RPCs ============
CREATE OR REPLACE FUNCTION public.global_test_by_code(_code text)
RETURNS TABLE (id uuid, title text, description text, duration_minutes integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT t.id, t.title, t.description, t.duration_minutes
  FROM public.global_tests t
  WHERE upper(t.code) = upper(trim(_code)) AND t.is_active = true
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.global_test_by_code(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.global_test_by_code(text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.global_test_items_by_code(_code text)
RETURNS TABLE (question_id uuid, body text, image_url text, sort_order integer, options jsonb)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT q.id, q.body, q.image_url, q.sort_order,
    COALESCE((
      SELECT jsonb_agg(jsonb_build_object('id', o.id, 'body', o.body) ORDER BY o.sort_order)
      FROM public.global_test_options o WHERE o.question_id = q.id
    ), '[]'::jsonb)
  FROM public.global_test_questions q
  JOIN public.global_tests t ON t.id = q.test_id
  WHERE upper(t.code) = upper(trim(_code)) AND t.is_active = true
  ORDER BY q.sort_order;
$$;

REVOKE ALL ON FUNCTION public.global_test_items_by_code(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.global_test_items_by_code(text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.submit_global_test(
  _code text,
  _answers jsonb,
  _time_spent_seconds integer
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _test_id uuid;
  _attempt_id uuid;
  _total int := 0;
  _correct int := 0;
  _score int := 0;
  _item jsonb;
  _qid uuid;
  _oid uuid;
  _ok boolean;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Avval tizimga kiring'; END IF;

  SELECT t.id INTO _test_id FROM public.global_tests t
    WHERE upper(t.code) = upper(trim(_code)) AND t.is_active = true LIMIT 1;
  IF _test_id IS NULL THEN RAISE EXCEPTION 'Bunday kodli faol test topilmadi'; END IF;

  INSERT INTO public.global_test_attempts (test_id, user_id, time_spent_seconds, started_at)
  VALUES (_test_id, _uid, _time_spent_seconds, now())
  RETURNING id INTO _attempt_id;

  FOR _item IN SELECT * FROM jsonb_array_elements(COALESCE(_answers, '[]'::jsonb))
  LOOP
    _qid := NULLIF(_item->>'question_id','')::uuid;
    _oid := NULLIF(_item->>'selected_option_id','')::uuid;
    IF _qid IS NULL THEN CONTINUE; END IF;
    _total := _total + 1;
    _ok := false;
    IF _oid IS NOT NULL THEN
      SELECT o.is_correct INTO _ok FROM public.global_test_options o
        WHERE o.id = _oid AND o.question_id = _qid;
      _ok := COALESCE(_ok, false);
    END IF;
    IF _ok THEN _correct := _correct + 1; END IF;

    INSERT INTO public.global_test_answers (attempt_id, question_id, selected_option_id, is_correct)
    VALUES (_attempt_id, _qid, _oid, _ok)
    ON CONFLICT (attempt_id, question_id) DO UPDATE
      SET selected_option_id = EXCLUDED.selected_option_id, is_correct = EXCLUDED.is_correct;
  END LOOP;

  IF _total > 0 THEN _score := round(_correct::numeric * 100 / _total); END IF;

  UPDATE public.global_test_attempts
    SET total_questions = _total, correct_count = _correct, score = _score, completed_at = now()
    WHERE id = _attempt_id;

  UPDATE public.profiles
    SET xp = xp + (_correct * 10),
        level = GREATEST(1, ((xp + (_correct * 10)) / 500) + 1),
        last_active_at = now()
    WHERE id = _uid;

  RETURN _attempt_id;
END; $$;

REVOKE ALL ON FUNCTION public.submit_global_test(text, jsonb, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_global_test(text, jsonb, integer) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.global_test_results(_test_id uuid)
RETURNS TABLE (
  attempt_id uuid,
  user_id uuid,
  full_name text,
  score integer,
  correct_count integer,
  total_questions integer,
  time_spent_seconds integer,
  completed_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT a.id, a.user_id, p.full_name, a.score, a.correct_count, a.total_questions,
         a.time_spent_seconds, a.completed_at
  FROM public.global_test_attempts a
  LEFT JOIN public.profiles p ON p.id = a.user_id
  WHERE a.test_id = _test_id
    AND (public.is_global_test_owner(_test_id, auth.uid()) OR public.has_role(auth.uid(), 'admin'))
  ORDER BY a.score DESC, a.completed_at ASC;
$$;

REVOKE ALL ON FUNCTION public.global_test_results(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.global_test_results(uuid) TO authenticated, service_role;

-- ============ ADMIN RPCs ============
CREATE OR REPLACE FUNCTION public.admin_list_profiles()
RETURNS SETOF public.profiles
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.* FROM public.profiles p
  WHERE public.has_role(auth.uid(), 'admin')
  ORDER BY p.created_at DESC;
$$;

REVOKE ALL ON FUNCTION public.admin_list_profiles() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_profiles() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.admin_set_banned(_user_id uuid, _banned boolean)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Ruxsat yo''q';
  END IF;
  UPDATE public.profiles SET is_banned = _banned WHERE id = _user_id;
END; $$;

REVOKE ALL ON FUNCTION public.admin_set_banned(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_banned(uuid, boolean) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.admin_test_overview()
RETURNS TABLE (
  id uuid,
  kind text,
  title text,
  attempts bigint,
  avg_score numeric,
  best_score integer,
  last_attempt timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT t.id, 'topic'::text, t.title, count(a.id), COALESCE(avg(a.score), 0),
         COALESCE(max(a.score), 0), max(a.completed_at)
  FROM public.topics t
  JOIN public.test_attempts a ON a.topic_id = t.id AND a.completed_at IS NOT NULL
  WHERE public.has_role(auth.uid(), 'admin')
  GROUP BY t.id, t.title
  ORDER BY max(a.completed_at) DESC;
$$;

REVOKE ALL ON FUNCTION public.admin_test_overview() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_test_overview() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.admin_test_results(_topic_id uuid)
RETURNS TABLE (
  attempt_id uuid,
  user_id uuid,
  full_name text,
  username text,
  score integer,
  correct_count integer,
  total_questions integer,
  time_spent_seconds integer,
  completed_at timestamptz,
  created_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT a.id, a.user_id, p.full_name, p.username, a.score, a.correct_count,
         a.total_questions, a.time_spent_seconds, a.completed_at, a.created_at
  FROM public.test_attempts a
  LEFT JOIN public.profiles p ON p.id = a.user_id
  WHERE a.topic_id = _topic_id
    AND a.completed_at IS NOT NULL
    AND public.has_role(auth.uid(), 'admin')
  ORDER BY a.score DESC, a.completed_at ASC;
$$;

REVOKE ALL ON FUNCTION public.admin_test_results(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_test_results(uuid) TO authenticated, service_role;

-- ============ CERTIFICATE VERIFY (public) ============
CREATE OR REPLACE FUNCTION public.verify_certificate(_code text)
RETURNS TABLE (
  code text,
  title text,
  subtitle text,
  full_name text,
  score integer,
  total_questions integer,
  percent integer,
  issued_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.code, c.title, c.subtitle, c.full_name, c.score, c.total_questions, c.percent, c.issued_at
  FROM public.certificates c
  WHERE upper(c.code) = upper(trim(_code))
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.verify_certificate(text) TO anon, authenticated, service_role;