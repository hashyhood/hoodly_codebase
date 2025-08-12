-- Schema reconciliation to match app code expectations (non-destructive)
-- - Ensure comments.content column
-- - Ensure posts.likes_count and posts.comments_count (plural)
-- - Create likes table used by app
-- - Create friends table if missing
-- - Friend requests compatibility columns and FKs for from_user_id/to_user_id
-- - Safety indexes and RLS

-- 1) COMMENTS: ensure "content" column exists; migrate from legacy "text"
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'comments' AND column_name = 'content'
  ) THEN
    ALTER TABLE comments ADD COLUMN content TEXT;
    -- If legacy column "text" exists, backfill
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'comments' AND column_name = 'text'
    ) THEN
      UPDATE comments SET content = COALESCE(content, text);
    END IF;
    -- Ensure not null if appropriate
    ALTER TABLE comments ALTER COLUMN content SET NOT NULL;
  END IF;

  -- Optional: drop legacy column if it exists and is redundant
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'comments' AND column_name = 'text'
  ) THEN
    BEGIN
      ALTER TABLE comments DROP COLUMN text;
    EXCEPTION WHEN undefined_column THEN
      -- ignore if already dropped
      NULL;
    END;
  END IF;
END $$;

-- 2) POSTS: ensure plural count columns exist and mirror legacy singular if present
DO $$
BEGIN
  -- likes_count
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'posts' AND column_name = 'likes_count'
  ) THEN
    ALTER TABLE posts ADD COLUMN likes_count INTEGER DEFAULT 0;
  END IF;
  -- comments_count
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'posts' AND column_name = 'comments_count'
  ) THEN
    ALTER TABLE posts ADD COLUMN comments_count INTEGER DEFAULT 0;
  END IF;

  -- backfill from legacy singular names if they exist
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'posts' AND column_name = 'like_count'
  ) THEN
    UPDATE posts SET likes_count = COALESCE(likes_count, like_count);
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'posts' AND column_name = 'comment_count'
  ) THEN
    UPDATE posts SET comments_count = COALESCE(comments_count, comment_count);
  END IF;
END $$;

-- 3) LIKES TABLE: create if missing (used by app as "likes")
CREATE TABLE IF NOT EXISTS likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Indexes for likes
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_created_at ON likes(created_at DESC);

-- RLS for likes
DO $$
BEGIN
  PERFORM 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'likes';
  IF FOUND THEN
    EXECUTE 'ALTER TABLE likes ENABLE ROW LEVEL SECURITY';
    -- Select: everyone can read likes
    EXECUTE $$CREATE POLICY IF NOT EXISTS "likes_select_all" ON likes
      FOR SELECT USING (true)$$;
    -- Insert: only the liking user
    EXECUTE $$CREATE POLICY IF NOT EXISTS "likes_insert_own" ON likes
      FOR INSERT WITH CHECK (auth.uid() = user_id)$$;
    -- Delete: only the liking user
    EXECUTE $$CREATE POLICY IF NOT EXISTS "likes_delete_own" ON likes
      FOR DELETE USING (auth.uid() = user_id)$$;
  END IF;
END $$;

-- 4) FRIENDS TABLE: create if missing (symmetrical edges)
CREATE TABLE IF NOT EXISTS friends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

CREATE INDEX IF NOT EXISTS idx_friends_user_id ON friends(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_friend_id ON friends(friend_id);

DO $$
BEGIN
  EXECUTE 'ALTER TABLE friends ENABLE ROW LEVEL SECURITY';
  -- Allow users to read rows where they are user or friend
  EXECUTE $$CREATE POLICY IF NOT EXISTS "friends_select_self" ON friends
    FOR SELECT USING (user_id = auth.uid() OR friend_id = auth.uid())$$;
  -- Allow users to insert friendships where they are involved
  EXECUTE $$CREATE POLICY IF NOT EXISTS "friends_insert_self" ON friends
    FOR INSERT WITH CHECK (user_id = auth.uid())$$;
  -- Allow users to delete friendships where they are involved
  EXECUTE $$CREATE POLICY IF NOT EXISTS "friends_delete_self" ON friends
    FOR DELETE USING (user_id = auth.uid() OR friend_id = auth.uid())$$;
END $$;

-- 5) FRIEND_REQUESTS compat columns and FKs for app code selecting by from_user_id/to_user_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'friend_requests'
  ) THEN
    -- Add generated columns mirroring sender_id/receiver_id if base columns exist
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'friend_requests' AND column_name = 'sender_id'
    ) AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'friend_requests' AND column_name = 'from_user_id'
    ) THEN
      ALTER TABLE friend_requests 
        ADD COLUMN from_user_id UUID GENERATED ALWAYS AS (sender_id) STORED;
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'friend_requests' AND column_name = 'receiver_id'
    ) AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'friend_requests' AND column_name = 'to_user_id'
    ) THEN
      ALTER TABLE friend_requests 
        ADD COLUMN to_user_id UUID GENERATED ALWAYS AS (receiver_id) STORED;
    END IF;

    -- Add FKs with names used by app relational selects
    BEGIN
      ALTER TABLE friend_requests 
        ADD CONSTRAINT friend_requests_from_user_id_fkey 
        FOREIGN KEY (from_user_id) REFERENCES profiles(id) ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL; END;

    BEGIN
      ALTER TABLE friend_requests 
        ADD CONSTRAINT friend_requests_to_user_id_fkey 
        FOREIGN KEY (to_user_id) REFERENCES profiles(id) ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL; END;

    -- Helpful indexes
    CREATE INDEX IF NOT EXISTS idx_friend_requests_from_user_id ON friend_requests(from_user_id);
    CREATE INDEX IF NOT EXISTS idx_friend_requests_to_user_id ON friend_requests(to_user_id);
  END IF;
END $$;

-- 6) NOTIFICATIONS sanity: ensure receiver_id column exists (app relies on it)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'notifications' AND column_name = 'receiver_id'
    ) THEN
      -- Add receiver_id for app compatibility
      ALTER TABLE notifications ADD COLUMN receiver_id UUID;
      -- Best effort backfill from user_id if present
      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'user_id'
      ) THEN
        UPDATE notifications SET receiver_id = user_id WHERE receiver_id IS NULL;
      END IF;
    END IF;
  END IF;
END $$;


