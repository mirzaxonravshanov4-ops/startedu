CREATE POLICY "Class media upload own folder"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'class-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND (
      public.is_class_member(((storage.foldername(name))[2])::uuid, auth.uid())
      OR public.is_class_teacher(((storage.foldername(name))[2])::uuid, auth.uid())
    )
  );

CREATE POLICY "Class media readable by class"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'class-media'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.is_class_member(((storage.foldername(name))[2])::uuid, auth.uid())
      OR public.is_class_teacher(((storage.foldername(name))[2])::uuid, auth.uid())
    )
  );

CREATE POLICY "Class media delete own"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'class-media' AND (storage.foldername(name))[1] = auth.uid()::text);