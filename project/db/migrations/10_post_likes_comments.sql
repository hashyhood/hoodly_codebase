-- Add likes, like_count, comment_count to posts
ALTER TABLE posts ADD COLUMN IF NOT EXISTS likes JSONB DEFAULT '[]';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0;

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for posts: allow updating likes, like_count, comment_count if auth.uid() IS NOT NULL
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow update likes/counts if authed" ON posts
  FOR UPDATE USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- RLS for comments
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
-- SELECT where post_id matches (public read)
CREATE POLICY "Select comments by post" ON comments
  FOR SELECT USING (true);
-- INSERT where user_id = auth.uid()
CREATE POLICY "Insert own comment" ON comments
  FOR INSERT WITH CHECK (user_id = auth.uid());
-- DELETE only if user_id = auth.uid()
CREATE POLICY "Delete own comment" ON comments
  FOR DELETE USING (user_id = auth.uid());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC); 