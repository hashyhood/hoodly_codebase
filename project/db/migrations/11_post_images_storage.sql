-- Migration: Post Images Storage Setup
-- Description: Creates storage bucket and policies for post images

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

-- Add function to clean up orphaned images when posts are deleted
CREATE OR REPLACE FUNCTION cleanup_post_images()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete associated images from storage when post is deleted
  DELETE FROM storage.objects 
  WHERE bucket_id = 'post-images' 
    AND name LIKE 'posts/' || OLD.user_id || '/%';
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically clean up images when posts are deleted
DROP TRIGGER IF EXISTS trigger_cleanup_post_images ON posts;
CREATE TRIGGER trigger_cleanup_post_images
  BEFORE DELETE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_post_images();

-- Add function to validate image URLs
CREATE OR REPLACE FUNCTION validate_image_urls(image_urls TEXT[])
RETURNS BOOLEAN AS $$
DECLARE
  url TEXT;
BEGIN
  -- Check if all URLs are valid Supabase storage URLs
  FOREACH url IN ARRAY image_urls
  LOOP
    IF url IS NOT NULL AND url != '' THEN
      -- Basic validation - should be a valid URL
      IF url !~ '^https?://' THEN
        RETURN FALSE;
      END IF;
    END IF;
  END LOOP;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Add constraint to ensure images array contains valid URLs
ALTER TABLE posts 
ADD CONSTRAINT check_valid_image_urls 
CHECK (validate_image_urls(images));

-- Create function to get post with images
CREATE OR REPLACE FUNCTION get_post_with_images(post_id UUID)
RETURNS TABLE (
  id UUID,
  content TEXT,
  images TEXT[],
  user_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  like_count INTEGER,
  comment_count INTEGER,
  user_name TEXT,
  user_avatar TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.content,
    p.images,
    p.user_id,
    p.created_at,
    p.updated_at,
    COALESCE(p.like_count, 0) as like_count,
    COALESCE(p.comment_count, 0) as comment_count,
    pr.full_name as user_name,
    pr.avatar_url as user_avatar
  FROM posts p
  LEFT JOIN profiles pr ON p.user_id = pr.id
  WHERE p.id = post_id;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT SELECT ON storage.objects TO authenticated;
GRANT INSERT ON storage.objects TO authenticated;
GRANT UPDATE ON storage.objects TO authenticated;
GRANT DELETE ON storage.objects TO authenticated;

-- Create a view for posts with image metadata
CREATE OR REPLACE VIEW posts_with_images AS
SELECT 
  p.*,
  pr.full_name as author_name,
  pr.avatar_url as author_avatar,
  array_length(p.images, 1) as image_count
FROM posts p
LEFT JOIN profiles pr ON p.user_id = pr.id
WHERE p.images IS NOT NULL AND array_length(p.images, 1) > 0;

-- Add RLS policy for the view
CREATE POLICY "Users can view posts with images" ON posts_with_images
  FOR SELECT USING (true);

COMMENT ON TABLE posts IS 'Posts table with support for multiple images per post';
COMMENT ON COLUMN posts.images IS 'Array of image URLs stored in Supabase storage'; 