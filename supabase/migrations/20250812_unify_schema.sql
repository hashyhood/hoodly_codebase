-- === HOODLY UNIFY SCHEMA (idempotent) ===

-- 0) Helpers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS postgis;

-- Ensure profiles table exists (required for foreign key references)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name text,
  avatar_url text,
  email text,
  neighborhood text,
  bio text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 1) POSTS: ensure posts table exists and rename author_id -> user_id (if needed) + add app-required columns
CREATE TABLE IF NOT EXISTS public.posts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Ensure user_id column exists and handle the author_id -> user_id rename
DO $$
BEGIN
  -- If user_id column doesn't exist, add it
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='posts' AND column_name='user_id'
  ) THEN
    -- If author_id exists, rename it to user_id
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='posts' AND column_name='author_id'
    ) THEN
      ALTER TABLE public.posts RENAME COLUMN author_id TO user_id;
    ELSE
      -- Otherwise add a new user_id column
      ALTER TABLE public.posts ADD COLUMN user_id uuid;
    END IF;
  END IF;
END $$;

-- Add other required columns
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS likes_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS comments_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS proximity text CHECK (proximity IN ('neighborhood','city','state')) DEFAULT 'city',
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS image_url text;

-- Skip foreign key creation for now to avoid column issues
-- We'll handle this in a separate migration once the schema is stable

-- 2) COUNTERS: ensure reactions table exists and maintain likes/comments via triggers
CREATE TABLE IF NOT EXISTS public.reactions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type text NOT NULL CHECK (target_type IN ('post', 'comment')),
  target_id uuid NOT NULL,
  reaction_type text NOT NULL CHECK (reaction_type IN ('like', 'love', 'laugh', 'wow', 'sad', 'angry')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, target_type, target_id, reaction_type)
);

CREATE OR REPLACE FUNCTION public.update_post_like_count() RETURNS trigger AS $$
BEGIN
  UPDATE public.posts p
  SET likes_count = (
    SELECT COUNT(*) FROM public.reactions r
    WHERE r.target_type='post' AND r.target_id = COALESCE(NEW.target_id, OLD.target_id)
      AND r.reaction_type='like'
  )
  WHERE p.id = COALESCE(NEW.target_id, OLD.target_id);
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

-- Separate triggers for INSERT and DELETE since DELETE can't reference NEW
DROP TRIGGER IF EXISTS trg_reaction_like_insert ON public.reactions;
DROP TRIGGER IF EXISTS trg_reaction_like_delete ON public.reactions;

CREATE TRIGGER trg_reaction_like_insert
AFTER INSERT ON public.reactions
FOR EACH ROW WHEN (NEW.target_type = 'post' AND NEW.reaction_type = 'like')
EXECUTE FUNCTION public.update_post_like_count();

CREATE TRIGGER trg_reaction_like_delete
AFTER DELETE ON public.reactions
FOR EACH ROW WHEN (OLD.target_type = 'post' AND OLD.reaction_type = 'like')
EXECUTE FUNCTION public.update_post_like_count();

-- Ensure comments table exists
CREATE TABLE IF NOT EXISTS public.comments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.update_post_comment_count() RETURNS trigger AS $$
BEGIN
  UPDATE public.posts p
  SET comments_count = (
    SELECT COUNT(*) FROM public.comments c
    WHERE c.post_id = COALESCE(NEW.post_id, OLD.post_id)
  )
  WHERE p.id = COALESCE(NEW.post_id, OLD.post_id);
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_comments_count_ins ON public.comments;
DROP TRIGGER IF EXISTS trg_comments_count_del ON public.comments;
CREATE TRIGGER trg_comments_count_ins AFTER INSERT ON public.comments
FOR EACH ROW EXECUTE FUNCTION public.update_post_comment_count();
CREATE TRIGGER trg_comments_count_del AFTER DELETE ON public.comments
FOR EACH ROW EXECUTE FUNCTION public.update_post_comment_count();

-- 3) DMs: ensure dm_threads/dm_messages exist; add RPC + FKs usable by PostgREST join syntax
CREATE TABLE IF NOT EXISTS public.dm_threads (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user1_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user2_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Create unique constraint to ensure no duplicate user pairs
-- We'll handle the sorting logic in the application code
ALTER TABLE public.dm_threads ADD CONSTRAINT dm_threads_unique_users UNIQUE (user1_id, user2_id);

CREATE TABLE IF NOT EXISTS public.dm_messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id uuid NOT NULL REFERENCES public.dm_threads(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  message_type text DEFAULT 'text' CHECK (message_type IN ('text','image','video','audio','location')),
  is_read boolean DEFAULT false,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Skip foreign key creation for dm_messages to avoid column issues
-- We'll handle this in a separate migration once the schema is stable

-- RPC to get/create a thread for a pair (used by app code)
CREATE OR REPLACE FUNCTION public.get_or_create_thread(a uuid, b uuid) RETURNS uuid AS $$
DECLARE t_id uuid;
BEGIN
  IF a = b THEN RAISE EXCEPTION 'cannot DM yourself'; END IF;
  
  -- Try to find existing thread in both directions
  SELECT id INTO t_id FROM public.dm_threads 
  WHERE (user1_id = a AND user2_id = b) OR (user1_id = b AND user2_id = a);
  
  IF t_id IS NULL THEN
    -- Create new thread (always use a as user1_id, b as user2_id for consistency)
    INSERT INTO public.dm_threads(user1_id, user2_id) VALUES (a, b) RETURNING id INTO t_id;
  END IF;
  
  RETURN t_id;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;
GRANT EXECUTE ON FUNCTION public.get_or_create_thread(uuid, uuid) TO authenticated;

-- 4) GROUPS & MEMBERS (used by UI)
CREATE TABLE IF NOT EXISTS public.groups (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  creator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_private boolean DEFAULT false,
  member_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Ensure creator_id column exists (in case table already exists without it)
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS creator_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE TABLE IF NOT EXISTS public.group_members (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text DEFAULT 'member' CHECK (role IN ('admin','member')),
  joined_at timestamptz DEFAULT now(),
  UNIQUE(group_id,user_id)
);
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS groups_read ON public.groups;
DROP POLICY IF EXISTS groups_insert ON public.groups;

CREATE POLICY groups_read ON public.groups
  FOR SELECT USING (is_private=false OR creator_id=auth.uid() OR EXISTS(SELECT 1 FROM public.group_members gm WHERE gm.group_id=groups.id AND gm.user_id=auth.uid()));
CREATE POLICY groups_insert ON public.groups
  FOR INSERT WITH CHECK (creator_id=auth.uid());

CREATE POLICY group_members_read ON public.group_members
  FOR SELECT USING (user_id=auth.uid() OR EXISTS(SELECT 1 FROM public.groups g WHERE g.id=group_id AND g.creator_id=auth.uid()));
CREATE POLICY group_members_insert ON public.group_members
  FOR INSERT WITH CHECK (user_id=auth.uid());

-- 5) SAFETY ALERTS (used by UI)
CREATE TABLE IF NOT EXISTS public.safety_alerts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('emergency','warning','info')),
  message text NOT NULL,
  location geography(POINT,4326),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.safety_alerts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS safety_alerts_read ON public.safety_alerts;
DROP POLICY IF EXISTS safety_alerts_write ON public.safety_alerts;

CREATE POLICY safety_alerts_read  ON public.safety_alerts FOR SELECT USING (true);
CREATE POLICY safety_alerts_write ON public.safety_alerts FOR INSERT WITH CHECK (user_id=auth.uid());

-- 6) INVITE LINKS (used by project/lib/invite.ts)
CREATE TABLE IF NOT EXISTS public.invite_links (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  code text UNIQUE NOT NULL,
  type text NOT NULL CHECK (type IN ('user','group','event')),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  max_uses integer,
  current_uses integer DEFAULT 0,
  is_active boolean DEFAULT true,
  metadata jsonb
);
ALTER TABLE public.invite_links ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS invite_links_read ON public.invite_links;
DROP POLICY IF EXISTS invite_links_write ON public.invite_links;

CREATE POLICY invite_links_read  ON public.invite_links FOR SELECT USING (true);
CREATE POLICY invite_links_write ON public.invite_links FOR INSERT WITH CHECK (created_by=auth.uid());

-- 7) Indexes (hot paths)
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post_id_created_at ON public.comments (post_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reactions_target ON public.reactions (target_type, target_id, reaction_type);
CREATE INDEX IF NOT EXISTS idx_dm_messages_pair_created ON public.dm_messages (sender_id, receiver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_receiver_created ON public.notifications (receiver_id, created_at DESC);

-- 8) Server-side rate limits (simple)
CREATE OR REPLACE FUNCTION public.enforce_rate_limit(tbl regclass, max_count int, time_window interval) RETURNS void AS $$
DECLARE cnt int;
BEGIN
  EXECUTE format('SELECT count(*) FROM %s WHERE user_id = auth.uid() AND created_at > now() - $1', tbl)
    INTO cnt USING time_window;
  IF cnt >= max_count THEN RAISE EXCEPTION 'rate_limit_exceeded'; END IF;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.posts_rate_limit() RETURNS trigger AS $$
BEGIN PERFORM public.enforce_rate_limit('public.posts', 5, '5 minutes'); RETURN NEW; END; $$ LANGUAGE plpgsql SECURITY DEFINER;
DROP TRIGGER IF EXISTS trg_posts_rate ON public.posts;
CREATE TRIGGER trg_posts_rate BEFORE INSERT ON public.posts FOR EACH ROW EXECUTE FUNCTION public.posts_rate_limit();

CREATE OR REPLACE FUNCTION public.comments_rate_limit() RETURNS trigger AS $$
BEGIN PERFORM public.enforce_rate_limit('public.comments', 15, '5 minutes'); RETURN NEW; END; $$ LANGUAGE plpgsql SECURITY DEFINER;
DROP TRIGGER IF EXISTS trg_comments_rate ON public.comments;
CREATE TRIGGER trg_comments_rate BEFORE INSERT ON public.comments FOR EACH ROW EXECUTE FUNCTION public.comments_rate_limit();

CREATE OR REPLACE FUNCTION public.reactions_rate_limit() RETURNS trigger AS $$
BEGIN PERFORM public.enforce_rate_limit('public.reactions', 60, '5 minutes'); RETURN NEW; END; $$ LANGUAGE plpgsql SECURITY DEFINER;
DROP TRIGGER IF EXISTS trg_reactions_rate ON public.reactions;
CREATE TRIGGER trg_reactions_rate BEFORE INSERT ON public.reactions FOR EACH ROW EXECUTE FUNCTION public.reactions_rate_limit();
