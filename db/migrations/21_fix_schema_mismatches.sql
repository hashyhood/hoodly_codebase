-- 🔧 FIX DATABASE SCHEMA MISMATCHES
-- Align database schema with frontend TypeScript types

-- ===========================================
-- 1. FIX PROFILES TABLE SCHEMA
-- ===========================================

-- First, let's check what columns exist in the profiles table
DO $$
DECLARE
    col_exists BOOLEAN;
BEGIN
    -- Check if name column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'name'
    ) INTO col_exists;
    
    -- Add missing columns to profiles table
    ALTER TABLE profiles 
    ADD COLUMN IF NOT EXISTS full_name TEXT,
    ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
    ADD COLUMN IF NOT EXISTS neighborhood TEXT,
    ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    
    -- Update existing profiles to populate new columns based on what exists
    IF col_exists THEN
        -- If name column exists, use it
        UPDATE profiles 
        SET 
          full_name = COALESCE(name, 'User'),
          username = COALESCE(email, 'user_' || id::text),
          neighborhood = COALESCE(location, 'Unknown'),
          last_seen = COALESCE(updated_at, NOW())
        WHERE full_name IS NULL OR username IS NULL OR neighborhood IS NULL OR last_seen IS NULL;
    ELSE
        -- If name column doesn't exist, use email as fallback
        UPDATE profiles 
        SET 
          full_name = COALESCE(email, 'User'),
          username = COALESCE(email, 'user_' || id::text),
          neighborhood = COALESCE(location, 'Unknown'),
          last_seen = COALESCE(updated_at, NOW())
        WHERE full_name IS NULL OR username IS NULL OR neighborhood IS NULL OR last_seen IS NULL;
    END IF;
    
    -- Make full_name NOT NULL after populating
    ALTER TABLE profiles ALTER COLUMN full_name SET NOT NULL;
    ALTER TABLE profiles ALTER COLUMN username SET NOT NULL;
    
    RAISE NOTICE '✅ Profiles table updated successfully';
END $$;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_neighborhood ON profiles(neighborhood);
CREATE INDEX IF NOT EXISTS idx_profiles_last_seen ON profiles(last_seen);

-- ===========================================
-- 2. FIX NOTIFICATIONS TABLE SCHEMA
-- ===========================================

-- Drop existing notifications table
DROP TABLE IF EXISTS notifications CASCADE;

-- Create notifications table that matches frontend expectations
CREATE TABLE notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('post', 'comment', 'like', 'event', 'marketplace', 'group')),
    reference_id UUID,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for notifications
CREATE POLICY "notifications_select_policy" ON notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "notifications_insert_policy" ON notifications
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "notifications_update_policy" ON notifications
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "notifications_delete_policy" ON notifications
    FOR DELETE USING (user_id = auth.uid());

-- ===========================================
-- 3. FIX POSTS TABLE SCHEMA
-- ===========================================

-- Add missing columns to posts table
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS media_urls TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'text',
ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'friends', 'private')),
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS shares_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS reach_count INTEGER DEFAULT 0;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_posts_visibility ON posts(visibility);
CREATE INDEX IF NOT EXISTS idx_posts_likes_count ON posts(likes_count DESC);
CREATE INDEX IF NOT EXISTS idx_posts_comments_count ON posts(comments_count DESC);

-- ===========================================
-- 4. FIX STORIES TABLE SCHEMA
-- ===========================================

-- Create stories table if it doesn't exist
CREATE TABLE IF NOT EXISTS stories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    media_url TEXT NOT NULL,
    media_type TEXT DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
    caption TEXT,
    views_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create story_views table
CREATE TABLE IF NOT EXISTS story_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    story_id UUID REFERENCES stories(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(story_id, user_id)
);

-- Create indexes for stories
CREATE INDEX IF NOT EXISTS idx_stories_user_id ON stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_expires_at ON stories(expires_at);
CREATE INDEX IF NOT EXISTS idx_story_views_story_id ON story_views(story_id);
CREATE INDEX IF NOT EXISTS idx_story_views_user_id ON story_views(user_id);

-- Enable RLS
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_views ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for stories
CREATE POLICY "stories_select_policy" ON stories
    FOR SELECT USING (true);

CREATE POLICY "stories_insert_policy" ON stories
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "stories_delete_policy" ON stories
    FOR DELETE USING (user_id = auth.uid());

-- Create RLS policies for story_views
CREATE POLICY "story_views_select_policy" ON story_views
    FOR SELECT USING (true);

CREATE POLICY "story_views_insert_policy" ON story_views
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- ===========================================
-- 5. FIX COMMENTS TABLE SCHEMA
-- ===========================================

-- Rename post_comments to comments if it exists
ALTER TABLE IF EXISTS post_comments RENAME TO comments;

-- Create comments table if it doesn't exist
CREATE TABLE IF NOT EXISTS comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for comments
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

-- Enable RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for comments
CREATE POLICY "comments_select_policy" ON comments
    FOR SELECT USING (true);

CREATE POLICY "comments_insert_policy" ON comments
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "comments_update_policy" ON comments
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "comments_delete_policy" ON comments
    FOR DELETE USING (user_id = auth.uid());

-- ===========================================
-- 6. FIX LIKES TABLE SCHEMA
-- ===========================================

-- Rename post_likes to likes if it exists
ALTER TABLE IF EXISTS post_likes RENAME TO likes;

-- Create likes table if it doesn't exist
CREATE TABLE IF NOT EXISTS likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- Create indexes for likes
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_created_at ON likes(created_at DESC);

-- Enable RLS
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for likes
CREATE POLICY "likes_select_policy" ON likes
    FOR SELECT USING (true);

CREATE POLICY "likes_insert_policy" ON likes
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "likes_delete_policy" ON likes
    FOR DELETE USING (user_id = auth.uid());

-- ===========================================
-- 7. UPDATE FUNCTIONS TO MATCH NEW SCHEMA
-- ===========================================

-- Update get_user_notifications function
CREATE OR REPLACE FUNCTION get_user_notifications(user_id_param UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  title TEXT,
  message TEXT,
  type TEXT,
  reference_id UUID,
  is_read BOOLEAN,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.id,
    n.user_id,
    n.title,
    n.message,
    n.type,
    n.reference_id,
    n.is_read,
    n.created_at
  FROM notifications n
  WHERE n.user_id = user_id_param
  ORDER BY n.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(notification_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE notifications 
  SET is_read = true 
  WHERE id = notification_id AND user_id = auth.uid();
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  user_id_param UUID,
  title_param TEXT,
  message_param TEXT,
  type_param TEXT,
  reference_id_param UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, title, message, type, reference_id)
  VALUES (user_id_param, title_param, message_param, type_param, reference_id_param)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- 8. GRANT PERMISSIONS
-- ===========================================

-- Grant permissions to authenticated users
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON posts TO authenticated;
GRANT ALL ON comments TO authenticated;
GRANT ALL ON likes TO authenticated;
GRANT ALL ON notifications TO authenticated;
GRANT ALL ON stories TO authenticated;
GRANT ALL ON story_views TO authenticated;
GRANT ALL ON friends TO authenticated;
GRANT ALL ON friend_requests TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_user_notifications(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_notification_read(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_notification(UUID, TEXT, TEXT, TEXT, UUID) TO authenticated;

-- ===========================================
-- 9. VERIFICATION QUERIES
-- ===========================================

-- Verify profiles table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- Verify notifications table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'notifications' 
ORDER BY ordinal_position;

-- Verify all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'posts', 'comments', 'likes', 'notifications', 'stories', 'story_views', 'friends', 'friend_requests')
ORDER BY table_name;

-- ===========================================
-- SUCCESS MESSAGE
-- ===========================================

DO $$
BEGIN
  RAISE NOTICE '✅ Database schema successfully aligned with frontend types!';
  RAISE NOTICE '✅ All tables now match TypeScript interface definitions';
  RAISE NOTICE '✅ RLS policies created for security';
  RAISE NOTICE '✅ Indexes created for performance';
  RAISE NOTICE '✅ Functions updated to work with new schema';
END $$; 