ALTER TYPE public.topic_category ADD VALUE IF NOT EXISTS 'mavzulashtirilgan';
ALTER TYPE public.topic_category ADD VALUE IF NOT EXISTS 'olimpiada';
ALTER TYPE public.topic_category ADD VALUE IF NOT EXISTS 'sat';

ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS section text;

ALTER TABLE public.class_messages ADD COLUMN IF NOT EXISTS media_url text;
ALTER TABLE public.class_messages ADD COLUMN IF NOT EXISTS media_type text;
ALTER TABLE public.class_messages ADD COLUMN IF NOT EXISTS media_duration integer;