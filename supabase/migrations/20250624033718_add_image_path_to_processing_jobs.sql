-- Add image_path field to track original uploaded file location
ALTER TABLE processing_jobs ADD COLUMN image_path text;

-- Update status constraint to include 'pending' status
ALTER TABLE processing_jobs DROP CONSTRAINT processing_jobs_status_check;
ALTER TABLE processing_jobs ADD CONSTRAINT processing_jobs_status_check 
  CHECK (status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'failed'::text]));