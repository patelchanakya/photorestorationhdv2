-- Add streak milestone tracking to user_credits table
ALTER TABLE "public"."user_credits" 
ADD COLUMN IF NOT EXISTS "last_activity_date" date,
ADD COLUMN IF NOT EXISTS "current_streak_days" integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS "checkpoint_level" integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS "milestone_7_claimed" boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS "milestone_30_claimed" boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS "milestone_60_claimed" boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS "milestone_100_claimed" boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS "milestone_365_claimed" boolean DEFAULT false;

-- Add comments for clarity
COMMENT ON COLUMN "public"."user_credits"."last_activity_date" IS 'Date of last photo restoration activity for streak tracking';
COMMENT ON COLUMN "public"."user_credits"."current_streak_days" IS 'Current consecutive days of photo restoration activity';
COMMENT ON COLUMN "public"."user_credits"."checkpoint_level" IS 'Highest milestone achieved (0, 7, 30, 60, 100, 365) - used for streak break reset';
COMMENT ON COLUMN "public"."user_credits"."milestone_7_claimed" IS 'Whether 7-day milestone reward has been claimed';
COMMENT ON COLUMN "public"."user_credits"."milestone_30_claimed" IS 'Whether 30-day milestone reward has been claimed';
COMMENT ON COLUMN "public"."user_credits"."milestone_60_claimed" IS 'Whether 60-day milestone reward has been claimed';
COMMENT ON COLUMN "public"."user_credits"."milestone_100_claimed" IS 'Whether 100-day milestone reward has been claimed';
COMMENT ON COLUMN "public"."user_credits"."milestone_365_claimed" IS 'Whether 365-day milestone reward has been claimed';