-- Migration: Add RLS policies for thumbnails and previews buckets
-- This ensures the new buckets have the same permissions as the files bucket

-- THUMBNAILS BUCKET POLICIES

-- SELECT: Give users access to own folder in thumbnails
CREATE POLICY "Give users access to own folder thumbnails select" ON storage.objects 
FOR SELECT USING (
  bucket_id = 'thumbnails' AND 
  (auth.uid())::text = (storage.foldername(name))[1]
);

-- INSERT: Give users access to own folder in thumbnails  
CREATE POLICY "Give users access to own folder thumbnails insert" ON storage.objects 
FOR INSERT WITH CHECK (
  bucket_id = 'thumbnails' AND 
  (auth.uid())::text = (storage.foldername(name))[1]
);

-- UPDATE: Give users access to own folder in thumbnails
CREATE POLICY "Give users access to own folder thumbnails update" ON storage.objects 
FOR UPDATE USING (
  bucket_id = 'thumbnails' AND 
  (auth.uid())::text = (storage.foldername(name))[1]
) WITH CHECK (
  bucket_id = 'thumbnails' AND 
  (auth.uid())::text = (storage.foldername(name))[1]
);

-- DELETE: Give users access to own folder in thumbnails
CREATE POLICY "Give users access to own folder thumbnails delete" ON storage.objects 
FOR DELETE USING (
  bucket_id = 'thumbnails' AND 
  (auth.uid())::text = (storage.foldername(name))[1]
);

-- SELECT: Public read access for thumbnails bucket
CREATE POLICY "Public read access for thumbnails bucket" ON storage.objects 
FOR SELECT USING (bucket_id = 'thumbnails');

-- PREVIEWS BUCKET POLICIES

-- SELECT: Give users access to own folder in previews
CREATE POLICY "Give users access to own folder previews select" ON storage.objects 
FOR SELECT USING (
  bucket_id = 'previews' AND 
  (auth.uid())::text = (storage.foldername(name))[1]
);

-- INSERT: Give users access to own folder in previews
CREATE POLICY "Give users access to own folder previews insert" ON storage.objects 
FOR INSERT WITH CHECK (
  bucket_id = 'previews' AND 
  (auth.uid())::text = (storage.foldername(name))[1]
);

-- UPDATE: Give users access to own folder in previews  
CREATE POLICY "Give users access to own folder previews update" ON storage.objects 
FOR UPDATE USING (
  bucket_id = 'previews' AND 
  (auth.uid())::text = (storage.foldername(name))[1]
) WITH CHECK (
  bucket_id = 'previews' AND 
  (auth.uid())::text = (storage.foldername(name))[1]
);

-- DELETE: Give users access to own folder in previews
CREATE POLICY "Give users access to own folder previews delete" ON storage.objects 
FOR DELETE USING (
  bucket_id = 'previews' AND 
  (auth.uid())::text = (storage.foldername(name))[1]
);

-- SELECT: Public read access for previews bucket
CREATE POLICY "Public read access for previews bucket" ON storage.objects 
FOR SELECT USING (bucket_id = 'previews');

-- Note: These policies ensure:
-- 1. Users can only access files in their own folder (based on auth.uid())
-- 2. Public read access allows signed URLs to work properly
-- 3. Full CRUD operations for users on their own files
-- 4. Same security model as the existing files bucket