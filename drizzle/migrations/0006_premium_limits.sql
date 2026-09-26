CREATE OR REPLACE FUNCTION public.ai_quota_limit(_uid uuid)
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE WHEN public.has_role(_uid,'admin') THEN 1000000
              WHEN public.has_role(_uid,'premium') THEN 20 ELSE 5 END
$$;

CREATE OR REPLACE FUNCTION public.tg_class_limit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.has_role(NEW.teacher_id,'admin') OR public.has_role(NEW.teacher_id,'teacher') THEN
    RETURN NEW;
  END IF;
  IF public.has_role(NEW.teacher_id,'premium') THEN
    IF (SELECT count(*) FROM public.classes WHERE teacher_id = NEW.teacher_id) >= 5 THEN
      RAISE EXCEPTION 'Premium obunada ko''pi bilan 5 ta sinf yaratish mumkin';
    END IF;
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'Sinf yaratish uchun Premium kerak';
END $$;

DROP TRIGGER IF EXISTS class_limit ON public.classes;
CREATE TRIGGER class_limit BEFORE INSERT ON public.classes
  FOR EACH ROW EXECUTE FUNCTION public.tg_class_limit();