-- Create thumbnails and previews buckets for multi-size image storage
-- These buckets store optimized versions of uploaded images to reduce bandwidth

-- Create thumbnails bucket (for grid display)
INSERT INTO storage.buckets (id, name, public)
VALUES ('thumbnails', 'thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- Create previews bucket (for modal display)
INSERT INTO storage.buckets (id, name, public)
VALUES ('previews', 'previews', true)
ON CONFLICT (id) DO NOTHING;

-- Note: Policies for these buckets are already created in 20250630_add_thumbnails_previews_policies.sql