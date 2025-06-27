-- Add timeout_at column to processing_jobs table
ALTER TABLE processing_jobs 
ADD COLUMN timeout_at timestamptz DEFAULT NULL;

-- Add cancelled status to the check constraint
ALTER TABLE processing_jobs 
DROP CONSTRAINT IF EXISTS processing_jobs_status_check;

ALTER TABLE processing_jobs 
ADD CONSTRAINT processing_jobs_status_check 
CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled'));

-- Create index on timeout_at for efficient cleanup queries
CREATE INDEX IF NOT EXISTS idx_processing_jobs_timeout_at 
ON processing_jobs(timeout_at) 
WHERE status IN ('pending', 'processing');

-- Create index on status and started_at for cleanup queries
CREATE INDEX IF NOT EXISTS idx_processing_jobs_status_started_at 
ON processing_jobs(status, started_at) 
WHERE status IN ('pending', 'processing');