-- Migration: Post Images Storage Setup (Simplified)
-- Description: Creates storage bucket and adds images column to posts

-- Create storage bucket for post images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'post-images',
  'post-images',
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for post-images bucket
CREATE POLICY "Users can upload their own post images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'post-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view all post images" ON storage.objects
  FOR SELECT USING (bucket_id = 'post-images');

CREATE POLICY "Users can update their own post images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'post-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own post images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'post-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Update posts table to include images array
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';

-- Add index for better performance when querying posts with images
CREATE INDEX IF NOT EXISTS idx_posts_images ON posts USING GIN (images);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT SELECT ON storage.objects TO authenticated;
GRANT INSERT ON storage.objects TO authenticated;
GRANT UPDATE ON storage.objects TO authenticated;
GRANT DELETE ON storage.objects TO authenticated;

COMMENT ON TABLE posts IS 'Posts table with support for multiple images per post';
COMMENT ON COLUMN posts.images IS 'Array of image URLs stored in Supabase storage'; 