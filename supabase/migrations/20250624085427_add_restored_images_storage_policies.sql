-- Create restored-images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('restored-images', 'restored-images', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for restored-images bucket (similar to files bucket)
CREATE POLICY "Users can view own restored images"
ON storage.objects
AS PERMISSIVE
FOR SELECT
TO PUBLIC
USING ((bucket_id = 'restored-images'::text) AND authenticative.is_user_authenticated() AND (name ~ (('^'::text || (auth.uid())::text) || '/'::text)));

CREATE POLICY "Users can insert own restored images"
ON storage.objects
AS PERMISSIVE
FOR INSERT
TO PUBLIC
WITH CHECK ((bucket_id = 'restored-images'::text) AND authenticative.is_user_authenticated() AND (name ~ (('^'::text || (auth.uid())::text) || '/'::text)));

CREATE POLICY "Users can update own restored images"
ON storage.objects
AS PERMISSIVE
FOR UPDATE
TO PUBLIC
USING ((bucket_id = 'restored-images'::text) AND authenticative.is_user_authenticated() AND (name ~ (('^'::text || (auth.uid())::text) || '/'::text)));

CREATE POLICY "Users can delete own restored images"
ON storage.objects
AS PERMISSIVE
FOR DELETE
TO PUBLIC
USING ((bucket_id = 'restored-images'::text) AND authenticative.is_user_authenticated() AND (name ~ (('^'::text || (auth.uid())::text) || '/'::text)));