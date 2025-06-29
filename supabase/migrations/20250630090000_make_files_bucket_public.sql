-- Migration: make files storage bucket public

-- 1. Ensure the bucket exists and mark it public
insert into storage.buckets (id, name, public)
values ('files', 'files', true)
on conflict (id) do update set public = true;

-- 2. Allow anyone (including unauthenticated) to read objects from the bucket
-- Drop existing policy if present to avoid duplicates
DROP POLICY IF EXISTS "Public read access for files bucket" ON storage.objects;

CREATE POLICY "Public read access for files bucket"
ON storage.objects
FOR SELECT
USING (bucket_id = 'files'); 