-- Posts Engagement System Migration
-- This migration creates the complete posts, likes, and comments system

-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  image TEXT,
  proximity TEXT DEFAULT 'neighborhood' CHECK (proximity IN ('neighborhood', 'city', 'state')),
  tags TEXT[] DEFAULT '{}',
  is_ai_bot BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create post_likes table
CREATE TABLE IF NOT EXISTS post_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Create post_comments table
CREATE TABLE IF NOT EXISTS post_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_proximity ON posts(proximity);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_user_id ON post_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_created_at ON post_comments(created_at);

-- Enable Row Level Security
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

-- Posts RLS Policies
CREATE POLICY "Users can view all posts" ON posts
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own posts" ON posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts" ON posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts" ON posts
  FOR DELETE USING (auth.uid() = user_id);

-- Post Likes RLS Policies
CREATE POLICY "Users can view all likes" ON post_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own likes" ON post_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes" ON post_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Post Comments RLS Policies
CREATE POLICY "Users can view all comments" ON post_comments
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own comments" ON post_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" ON post_comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON post_comments
  FOR DELETE USING (auth.uid() = user_id);

-- Create functions for updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_posts_updated_at 
  BEFORE UPDATE ON posts 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_post_comments_updated_at 
  BEFORE UPDATE ON post_comments 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to get post engagement stats
CREATE OR REPLACE FUNCTION get_post_engagement(post_uuid UUID)
RETURNS TABLE(
  like_count BIGINT,
  comment_count BIGINT,
  user_liked BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM post_likes WHERE post_id = post_uuid) as like_count,
    (SELECT COUNT(*) FROM post_comments WHERE post_id = post_uuid) as comment_count,
    (SELECT EXISTS(SELECT 1 FROM post_likes WHERE post_id = post_uuid AND user_id = auth.uid())) as user_liked;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create view for posts with engagement data
CREATE OR REPLACE VIEW posts_with_engagement AS
SELECT 
  p.*,
  u.personalName,
  u.username,
  u.avatar,
  u.location,
  COUNT(DISTINCT pl.id) as like_count,
  COUNT(DISTINCT pc.id) as comment_count,
  EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = auth.uid()) as user_liked
FROM posts p
LEFT JOIN profiles u ON p.user_id = u.id
LEFT JOIN post_likes pl ON p.id = pl.post_id
LEFT JOIN post_comments pc ON p.id = pc.post_id
GROUP BY p.id, u.id;

-- Grant permissions
GRANT ALL ON posts TO authenticated;
GRANT ALL ON post_likes TO authenticated;
GRANT ALL ON post_comments TO authenticated;
GRANT SELECT ON posts_with_engagement TO authenticated;

-- Insert sample data for testing (optional)
INSERT INTO posts (user_id, content, proximity, tags) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Welcome to the neighborhood! 🏠', 'neighborhood', ARRAY['welcome', 'community']),
  ('00000000-0000-0000-0000-000000000002', 'Great weather today! Perfect for a walk in the park.', 'neighborhood', ARRAY['weather', 'outdoors']),
  ('00000000-0000-0000-0000-000000000003', 'Anyone up for a community meetup this weekend?', 'city', ARRAY['meetup', 'community', 'weekend']);

-- Add some sample likes and comments
INSERT INTO post_likes (post_id, user_id) VALUES
  ((SELECT id FROM posts LIMIT 1), '00000000-0000-0000-0000-000000000002'),
  ((SELECT id FROM posts LIMIT 1), '00000000-0000-0000-0000-000000000003');

INSERT INTO post_comments (post_id, user_id, text) VALUES
  ((SELECT id FROM posts LIMIT 1), '00000000-0000-0000-0000-000000000002', 'Welcome! Looking forward to meeting everyone!'),
  ((SELECT id FROM posts LIMIT 1), '00000000-0000-0000-0000-000000000003', 'Thanks for the warm welcome! 🎉'); 