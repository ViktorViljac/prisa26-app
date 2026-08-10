-- Migration 024: Add admin RLS policy for storage objects in avatars bucket

DROP POLICY IF EXISTS "avatar_admin_all" ON storage.objects;
CREATE POLICY "avatar_admin_all" ON storage.objects FOR ALL TO authenticated
  USING (
    bucket_id = 'avatars' 
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
