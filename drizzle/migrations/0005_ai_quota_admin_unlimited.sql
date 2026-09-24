CREATE OR REPLACE FUNCTION public.ai_quota_limit(_uid uuid)
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE WHEN public.has_role(_uid,'admin') THEN 1000000
              WHEN public.has_role(_uid,'premium') THEN 10 ELSE 5 END
$$;

CREATE OR REPLACE FUNCTION public.consume_ai_quota()
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _lim int; _used int; _d date := (now() AT TIME ZONE 'Asia/Tashkent')::date;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF public.has_role(_uid,'admin') THEN RETURN json_build_object('used',0,'limit',1000000); END IF;
  _lim := public.ai_quota_limit(_uid);
  INSERT INTO public.ai_usage(user_id, day, count) VALUES (_uid, _d, 0) ON CONFLICT DO NOTHING;
  UPDATE public.ai_usage SET count = count + 1 WHERE user_id = _uid AND day = _d AND count < _lim RETURNING count INTO _used;
  IF _used IS NULL THEN RAISE EXCEPTION 'AI_QUOTA_EXCEEDED'; END IF;
  RETURN json_build_object('used', _used, 'limit', _lim);
END $$;