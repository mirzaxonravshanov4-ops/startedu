CREATE OR REPLACE FUNCTION public.shares_class(_a uuid, _b uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH ca AS (
    SELECT class_id FROM public.class_members WHERE student_id = _a
    UNION SELECT id FROM public.classes WHERE teacher_id = _a
  ), cb AS (
    SELECT class_id FROM public.class_members WHERE student_id = _b
    UNION SELECT id FROM public.classes WHERE teacher_id = _b
  )
  SELECT EXISTS (SELECT 1 FROM ca JOIN cb USING (class_id));
$$;
REVOKE EXECUTE ON FUNCTION public.shares_class(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.shares_class(uuid, uuid) TO authenticated;

DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
CREATE POLICY "Users view own or classmates profiles" ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.shares_class(auth.uid(), id));

DROP POLICY IF EXISTS "Anyone can view questions" ON public.questions;
CREATE POLICY "Signed-in users view questions" ON public.questions FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Anyone can view options" ON public.question_options;
CREATE POLICY "Signed-in users view options" ON public.question_options FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS meq_read_all ON public.mock_exam_questions;
CREATE POLICY meq_read_signed_in ON public.mock_exam_questions FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Settings are readable" ON public.site_settings;

DROP POLICY IF EXISTS "Anyone can verify certificates" ON public.certificates;
CREATE POLICY "Users view own certificates" ON public.certificates FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));