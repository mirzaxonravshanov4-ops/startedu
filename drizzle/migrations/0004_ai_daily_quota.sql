CREATE TABLE public.ai_usage (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day date NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Tashkent')::date,
  count integer NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, day)
);
GRANT SELECT ON public.ai_usage TO authenticated;
GRANT ALL ON public.ai_usage TO service_role;
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own usage readable" ON public.ai_usage FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.ai_quota_limit(_uid uuid)
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE WHEN public.has_role(_uid,'premium') OR public.has_role(_uid,'admin') THEN 10 ELSE 5 END
$$;

CREATE OR REPLACE FUNCTION public.ai_quota_status()
RETURNS json LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT json_build_object(
    'used', COALESCE((SELECT count FROM public.ai_usage WHERE user_id = auth.uid() AND day = (now() AT TIME ZONE 'Asia/Tashkent')::date),0),
    'limit', public.ai_quota_limit(auth.uid()))
$$;

CREATE OR REPLACE FUNCTION public.consume_ai_quota()
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _lim int; _used int; _d date := (now() AT TIME ZONE 'Asia/Tashkent')::date;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  _lim := public.ai_quota_limit(_uid);
  INSERT INTO public.ai_usage(user_id, day, count) VALUES (_uid, _d, 0) ON CONFLICT DO NOTHING;
  UPDATE public.ai_usage SET count = count + 1 WHERE user_id = _uid AND day = _d AND count < _lim RETURNING count INTO _used;
  IF _used IS NULL THEN RAISE EXCEPTION 'AI_QUOTA_EXCEEDED'; END IF;
  RETURN json_build_object('used', _used, 'limit', _lim);
END $$;

CREATE OR REPLACE FUNCTION public.refund_ai_quota()
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.ai_usage SET count = GREATEST(count - 1, 0)
  WHERE user_id = auth.uid() AND day = (now() AT TIME ZONE 'Asia/Tashkent')::date
$$;

REVOKE EXECUTE ON FUNCTION public.ai_quota_status(), public.consume_ai_quota(), public.refund_ai_quota(), public.ai_quota_limit(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ai_quota_status(), public.consume_ai_quota(), public.refund_ai_quota() TO authenticated;