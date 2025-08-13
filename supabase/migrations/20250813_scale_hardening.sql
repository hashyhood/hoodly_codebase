-- === HOODLY SCALE HARDENING ===

-- Fast list scans
CREATE INDEX IF NOT EXISTS idx_messages_room_created ON public.messages (room_id, created_at);
CREATE INDEX IF NOT EXISTS idx_dm_messages_pair_created ON public.dm_messages (sender_id, receiver_id, created_at DESC);

-- Geo index for proximity (only if location column is geography type)
DO $$
BEGIN
  -- Check if posts.location is geography type before creating GIST index
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'posts'
    AND column_name = 'location'
    AND data_type = 'USER-DEFINED'
    AND udt_name = 'geography'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_posts_location_gist ON public.posts USING GIST (location);
  END IF;
END $$;

-- Rate limits for messages
CREATE OR REPLACE FUNCTION public.messages_rate_limit() RETURNS trigger AS $$
BEGIN
  PERFORM public.enforce_rate_limit('public.messages', 120, '5 minutes'); -- 120 msgs/5min
  RETURN NEW;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_messages_rate ON public.messages;
CREATE TRIGGER trg_messages_rate BEFORE INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.messages_rate_limit();

CREATE OR REPLACE FUNCTION public.dm_messages_rate_limit() RETURNS trigger AS $$
BEGIN
  PERFORM public.enforce_rate_limit('public.dm_messages', 120, '5 minutes');
  RETURN NEW;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_dm_messages_rate ON public.dm_messages;
CREATE TRIGGER trg_dm_messages_rate BEFORE INSERT ON public.dm_messages
FOR EACH ROW EXECUTE FUNCTION public.dm_messages_rate_limit();
