-- Enable Row Level Security for processing_jobs
ALTER TABLE "public"."processing_jobs" ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for users to access their own processing jobs
CREATE POLICY "Users can view own processing jobs"
ON "public"."processing_jobs"
AS PERMISSIVE
FOR SELECT
TO PUBLIC
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own processing jobs"
ON "public"."processing_jobs"  
AS PERMISSIVE
FOR INSERT
TO PUBLIC
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own processing jobs"
ON "public"."processing_jobs"
AS PERMISSIVE
FOR UPDATE
TO PUBLIC
USING (auth.uid() = user_id);

-- Grant necessary permissions for realtime
GRANT SELECT ON "public"."processing_jobs" TO "anon";
GRANT SELECT ON "public"."processing_jobs" TO "authenticated";
GRANT INSERT ON "public"."processing_jobs" TO "authenticated";
GRANT UPDATE ON "public"."processing_jobs" TO "authenticated";

-- Enable realtime for processing_jobs table
ALTER PUBLICATION supabase_realtime ADD TABLE "public"."processing_jobs";