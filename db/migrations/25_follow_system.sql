-- Follow system: table and RPCs used by app hooks

-- 1) follows table
CREATE TABLE IF NOT EXISTS follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  target_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, target_id),
  CHECK (follower_id <> target_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_target_id ON follows(target_id);

-- RLS policies
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  -- Select: user can see follows they are involved in
  EXECUTE $$CREATE POLICY IF NOT EXISTS "follows_select_self" ON follows
    FOR SELECT USING (follower_id = auth.uid() OR target_id = auth.uid())$$;

  -- Insert: only as self
  EXECUTE $$CREATE POLICY IF NOT EXISTS "follows_insert_self" ON follows
    FOR INSERT WITH CHECK (follower_id = auth.uid())$$;

  -- Delete: only as self (either side may delete)
  EXECUTE $$CREATE POLICY IF NOT EXISTS "follows_delete_self" ON follows
    FOR DELETE USING (follower_id = auth.uid() OR target_id = auth.uid())$$;
END $$;

-- 2) RPC: check_is_following
CREATE OR REPLACE FUNCTION check_is_following(
  follower_user_id UUID,
  target_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  is_following BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM follows 
    WHERE follower_id = follower_user_id AND target_id = target_user_id
  ) INTO is_following;

  RETURN COALESCE(is_following, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION check_is_following(UUID, UUID) TO authenticated;

-- 3) RPC: get_follow_counts
CREATE OR REPLACE FUNCTION get_follow_counts(user_id UUID)
RETURNS TABLE (
  follower_count BIGINT,
  following_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM follows WHERE target_id = user_id) AS follower_count,
    (SELECT COUNT(*) FROM follows WHERE follower_id = user_id) AS following_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_follow_counts(UUID) TO authenticated;

-- 4) RPC: follow_user_safe
CREATE OR REPLACE FUNCTION follow_user_safe(
  follower_user_id UUID,
  target_user_id UUID
)
RETURNS VOID AS $$
BEGIN
  -- prevent self-follow
  IF follower_user_id = target_user_id THEN
    RAISE EXCEPTION 'Cannot follow yourself';
  END IF;

  INSERT INTO follows (follower_id, target_id)
  VALUES (follower_user_id, target_user_id)
  ON CONFLICT (follower_id, target_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION follow_user_safe(UUID, UUID) TO authenticated;

-- 5) RPC: unfollow_user_safe
CREATE OR REPLACE FUNCTION unfollow_user_safe(
  follower_user_id UUID,
  target_user_id UUID
)
RETURNS VOID AS $$
BEGIN
  DELETE FROM follows 
  WHERE follower_id = follower_user_id AND target_id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION unfollow_user_safe(UUID, UUID) TO authenticated;


