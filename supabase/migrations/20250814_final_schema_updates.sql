-- === HOODLY FINAL SCHEMA UPDATES ===

-- 1) Ensure posts table has the correct structure and foreign key
DO $$
BEGIN
  -- Check if posts table has user_id column, if not add it
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'posts' 
    AND column_name = 'user_id'
  ) THEN
    -- Add user_id column
    ALTER TABLE public.posts ADD COLUMN user_id uuid;
    
    -- If author_id exists, copy data and then drop it
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'posts' 
      AND column_name = 'author_id'
    ) THEN
      UPDATE public.posts SET user_id = author_id WHERE user_id IS NULL;
      ALTER TABLE public.posts DROP COLUMN author_id;
    END IF;
  END IF;
END $$;

-- 2) Ensure foreign key constraint exists for posts.user_id -> profiles.id
DO $$
BEGIN
  -- Drop any existing auth.users foreign key
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_schema = 'public' 
    AND table_name = 'posts' 
    AND constraint_name = 'posts_user_id_auth_fkey'
  ) THEN
    ALTER TABLE public.posts DROP CONSTRAINT posts_user_id_auth_fkey;
  END IF;
  
  -- Add the profiles foreign key if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_schema = 'public' 
    AND table_name = 'posts' 
    AND constraint_name = 'posts_user_id_fkey'
  ) THEN
    ALTER TABLE public.posts 
      ADD CONSTRAINT posts_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 3) Ensure dm_messages has proper foreign keys to profiles
DO $$
BEGIN
  -- Add profiles foreign keys for dm_messages if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_schema = 'public' 
    AND table_name = 'dm_messages' 
    AND constraint_name = 'dm_messages_sender_id_fkey'
  ) THEN
    ALTER TABLE public.dm_messages 
      ADD CONSTRAINT dm_messages_sender_id_fkey 
      FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_schema = 'public' 
    AND table_name = 'dm_messages' 
    AND constraint_name = 'dm_messages_receiver_id_fkey'
  ) THEN
    ALTER TABLE public.dm_messages 
      ADD CONSTRAINT dm_messages_receiver_id_fkey 
      FOREIGN KEY (receiver_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 4) Add any missing indexes that might not exist
CREATE INDEX IF NOT EXISTS idx_messages_room_id_created_at ON public.messages (room_id, created_at);
CREATE INDEX IF NOT EXISTS idx_dm_messages_sr_created ON public.dm_messages (sender_id, created_at, receiver_id);

-- 5) Update rate limit function to use text parameter instead of regclass for better compatibility
CREATE OR REPLACE FUNCTION public.enforce_rate_limit(tbl text, max_count int, time_window interval) RETURNS void AS $$
DECLARE cnt int;
BEGIN
  EXECUTE format('SELECT count(*) FROM %I WHERE user_id = auth.uid() AND created_at > now() - $1', tbl)
    INTO cnt USING time_window;
  IF cnt >= max_count THEN RAISE EXCEPTION 'rate_limit_exceeded'; END IF;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6) Ensure all rate limit triggers are properly set up
DO $$
BEGIN
  -- Posts rate limit
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'trg_posts_rate'
  ) THEN
    CREATE TRIGGER trg_posts_rate 
    BEFORE INSERT ON public.posts 
    FOR EACH ROW EXECUTE FUNCTION public.posts_rate_limit();
  END IF;
  
  -- Comments rate limit
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'trg_comments_rate'
  ) THEN
    CREATE TRIGGER trg_comments_rate 
    BEFORE INSERT ON public.comments 
    FOR EACH ROW EXECUTE FUNCTION public.comments_rate_limit();
  END IF;
  
  -- Reactions rate limit
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'trg_reactions_rate'
  ) THEN
    CREATE TRIGGER trg_reactions_rate 
    BEFORE INSERT ON public.reactions 
    FOR EACH ROW EXECUTE FUNCTION public.reactions_rate_limit();
  END IF;
  
  -- Messages rate limit
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'trg_messages_rate'
  ) THEN
    CREATE TRIGGER trg_messages_rate 
    BEFORE INSERT ON public.messages 
    FOR EACH ROW EXECUTE FUNCTION public.messages_rate_limit();
  END IF;
  
  -- DM messages rate limit
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'trg_dm_messages_rate'
  ) THEN
    CREATE TRIGGER trg_dm_messages_rate 
    BEFORE INSERT ON public.dm_messages 
    FOR EACH ROW EXECUTE FUNCTION public.dm_messages_rate_limit();
  END IF;
END $$;
