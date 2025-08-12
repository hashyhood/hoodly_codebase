-- Smart Migration: Adapt to Existing Hoodly Database Structure
-- This migration works with your existing tables and adds missing features

-- Step 1: Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Step 2: Add missing columns to existing tables (only if they don't exist)
-- Add location columns to profiles if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'location_lat') THEN
        ALTER TABLE public.profiles ADD COLUMN location_lat DOUBLE PRECISION;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'location_lng') THEN
        ALTER TABLE public.profiles ADD COLUMN location_lng DOUBLE PRECISION;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'interests') THEN
        ALTER TABLE public.profiles ADD COLUMN interests TEXT[];
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'last_seen') THEN
        ALTER TABLE public.profiles ADD COLUMN last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'bio') THEN
        ALTER TABLE public.profiles ADD COLUMN bio TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'avatar_url') THEN
        ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;
    END IF;
END $$;

-- Step 3: Add location columns to rooms if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rooms' AND column_name = 'location_lat') THEN
        ALTER TABLE public.rooms ADD COLUMN location_lat DOUBLE PRECISION;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rooms' AND column_name = 'location_lng') THEN
        ALTER TABLE public.rooms ADD COLUMN location_lng DOUBLE PRECISION;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rooms' AND column_name = 'radius_meters') THEN
        ALTER TABLE public.rooms ADD COLUMN radius_meters INTEGER DEFAULT 1000;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rooms' AND column_name = 'is_private') THEN
        ALTER TABLE public.rooms ADD COLUMN is_private BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rooms' AND column_name = 'max_members') THEN
        ALTER TABLE public.rooms ADD COLUMN max_members INTEGER DEFAULT 100;
    END IF;
END $$;

-- Step 4: Add location columns to posts if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'location_lat') THEN
        ALTER TABLE public.posts ADD COLUMN location_lat DOUBLE PRECISION;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'location_lng') THEN
        ALTER TABLE public.posts ADD COLUMN location_lng DOUBLE PRECISION;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'is_public') THEN
        ALTER TABLE public.posts ADD COLUMN is_public BOOLEAN DEFAULT TRUE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'media_urls') THEN
        ALTER TABLE public.posts ADD COLUMN media_urls TEXT[];
    END IF;
END $$;

-- Step 5: Add location columns to events if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'location_lat') THEN
        ALTER TABLE public.events ADD COLUMN location_lat DOUBLE PRECISION;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'location_lng') THEN
        ALTER TABLE public.events ADD COLUMN location_lng DOUBLE PRECISION;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'is_public') THEN
        ALTER TABLE public.events ADD COLUMN is_public BOOLEAN DEFAULT TRUE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'max_attendees') THEN
        ALTER TABLE public.events ADD COLUMN max_attendees INTEGER;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'organizer_id') THEN
        ALTER TABLE public.events ADD COLUMN organizer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Step 6: Add missing columns to messages if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'message_type') THEN
        ALTER TABLE public.messages ADD COLUMN message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'video', 'audio', 'location'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'metadata') THEN
        ALTER TABLE public.messages ADD COLUMN metadata JSONB;
    END IF;
END $$;

-- Step 7: Add missing columns to notifications if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'type') THEN
        ALTER TABLE public.notifications ADD COLUMN type TEXT DEFAULT 'message' CHECK (type IN ('follow', 'like', 'comment', 'mention', 'message', 'event', 'urgent'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'title') THEN
        ALTER TABLE public.notifications ADD COLUMN title TEXT DEFAULT 'Notification';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'data') THEN
        ALTER TABLE public.notifications ADD COLUMN data JSONB;
    END IF;
END $$;

-- Step 8: Create missing tables that don't exist
-- Create device_tokens table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.device_tokens (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    token TEXT NOT NULL,
    provider TEXT NOT NULL CHECK (provider IN ('fcm', 'apns')),
    device_type TEXT CHECK (device_type IN ('ios', 'android')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, token)
);

-- Step 9: Create indexes for performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_messages_room_id ON public.messages (room_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages (sender_id);
CREATE INDEX IF NOT EXISTS idx_notifications_receiver_id ON public.notifications (receiver_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications (created_at);
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON public.follows (follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON public.follows (following_id);

-- Create location indexes using regular BTREE (works with lat/lng)
CREATE INDEX IF NOT EXISTS idx_profiles_location ON public.profiles (location_lat, location_lng);
CREATE INDEX IF NOT EXISTS idx_rooms_location ON public.rooms (location_lat, location_lng);
CREATE INDEX IF NOT EXISTS idx_posts_location ON public.posts (location_lat, location_lng);
CREATE INDEX IF NOT EXISTS idx_events_location ON public.events (location_lat, location_lng);

-- Step 10: Set REPLICA IDENTITY FULL for real-time tables
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.posts REPLICA IDENTITY FULL;

-- Step 11: Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- Step 12: Create RLS Policies for profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Step 13: Create RLS Policies for rooms
DROP POLICY IF EXISTS "Users can view public rooms" ON public.rooms;
DROP POLICY IF EXISTS "Room owners can update rooms" ON public.rooms;
DROP POLICY IF EXISTS "Authenticated users can create rooms" ON public.rooms;

CREATE POLICY "Users can view public rooms" ON public.rooms FOR SELECT USING (COALESCE(is_private, false) = false OR EXISTS (
    SELECT 1 FROM public.room_members WHERE room_id = rooms.id AND user_id = auth.uid()
));
CREATE POLICY "Room owners can update rooms" ON public.rooms FOR UPDATE USING (created_by = auth.uid() OR creator_id = auth.uid());
CREATE POLICY "Authenticated users can create rooms" ON public.rooms FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Step 14: Create RLS Policies for room_members
DROP POLICY IF EXISTS "Users can view memberships in their rooms" ON public.room_members;
DROP POLICY IF EXISTS "Room owners can manage memberships" ON public.room_members;

CREATE POLICY "Users can view memberships in their rooms" ON public.room_members FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.room_members m2 WHERE m2.room_id = room_members.room_id AND m2.user_id = auth.uid()
));
CREATE POLICY "Room owners can manage memberships" ON public.room_members FOR ALL USING (EXISTS (
    SELECT 1 FROM public.rooms WHERE id = room_members.room_id AND (created_by = auth.uid() OR creator_id = auth.uid())
));

-- Step 15: Create RLS Policies for messages
DROP POLICY IF EXISTS "Users can view messages in their rooms" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages to their rooms" ON public.messages;
DROP POLICY IF EXISTS "Users can update own messages" ON public.messages;

CREATE POLICY "Users can view messages in their rooms" ON public.messages FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.room_members WHERE room_id = messages.room_id AND user_id = auth.uid()
));
CREATE POLICY "Users can send messages to their rooms" ON public.messages FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.room_members WHERE room_id = messages.room_id AND user_id = auth.uid()
));
CREATE POLICY "Users can update own messages" ON public.messages FOR UPDATE USING (sender_id = auth.uid());

-- Step 16: Create RLS Policies for private_conversations
DROP POLICY IF EXISTS "Users can view their DM threads" ON public.private_conversations;
DROP POLICY IF EXISTS "Users can create DM threads" ON public.private_conversations;

CREATE POLICY "Users can view their DM threads" ON public.private_conversations FOR SELECT USING (user1_id = auth.uid() OR user2_id = auth.uid());
CREATE POLICY "Users can create DM threads" ON public.private_conversations FOR INSERT WITH CHECK (user1_id = auth.uid() OR user2_id = auth.uid());

-- Step 17: Create RLS Policies for private_messages
DROP POLICY IF EXISTS "Users can view messages in their DM threads" ON public.private_messages;
DROP POLICY IF EXISTS "Users can send DM messages" ON public.private_messages;

CREATE POLICY "Users can view messages in their DM threads" ON public.private_messages FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.private_conversations WHERE id = private_messages.conversation_id AND (user1_id = auth.uid() OR user2_id = auth.uid())
));
CREATE POLICY "Users can send DM messages" ON public.private_messages FOR INSERT WITH CHECK (sender_id = auth.uid());

-- Step 18: Create RLS Policies for posts
DROP POLICY IF EXISTS "Users can view public posts" ON public.posts;
DROP POLICY IF EXISTS "Users can create posts" ON public.posts;
DROP POLICY IF EXISTS "Users can update own posts" ON public.posts;

CREATE POLICY "Users can view public posts" ON public.posts FOR SELECT USING (COALESCE(is_public, true) = true OR user_id = auth.uid());
CREATE POLICY "Users can create posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own posts" ON public.posts FOR UPDATE USING (user_id = auth.uid());

-- Step 19: Create RLS Policies for post_comments
DROP POLICY IF EXISTS "Users can view comments on visible posts" ON public.post_comments;
DROP POLICY IF EXISTS "Users can create comments" ON public.post_comments;
DROP POLICY IF EXISTS "Users can update own comments" ON public.post_comments;

CREATE POLICY "Users can view comments on visible posts" ON public.post_comments FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.posts WHERE id = post_comments.post_id AND (COALESCE(is_public, true) = true OR user_id = auth.uid())
));
CREATE POLICY "Users can create comments" ON public.post_comments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own comments" ON public.post_comments FOR UPDATE USING (user_id = auth.uid());

-- Step 20: Create RLS Policies for likes
DROP POLICY IF EXISTS "Users can view reactions" ON public.likes;
DROP POLICY IF EXISTS "Users can create reactions" ON public.likes;
DROP POLICY IF EXISTS "Users can update own reactions" ON public.likes;

CREATE POLICY "Users can view reactions" ON public.likes FOR SELECT USING (true);
CREATE POLICY "Users can create reactions" ON public.likes FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own reactions" ON public.likes FOR UPDATE USING (user_id = auth.uid());

-- Step 21: Create RLS Policies for notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can create notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;

CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (receiver_id = auth.uid());
CREATE POLICY "Users can create notifications" ON public.notifications FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (receiver_id = auth.uid());

-- Step 22: Create RLS Policies for device_tokens
DROP POLICY IF EXISTS "Users can manage own device tokens" ON public.device_tokens;
CREATE POLICY "Users can manage own device tokens" ON public.device_tokens FOR ALL USING (user_id = auth.uid());

-- Step 23: Create RLS Policies for follows
DROP POLICY IF EXISTS "Users can view follows" ON public.follows;
DROP POLICY IF EXISTS "Users can manage own follows" ON public.follows;

CREATE POLICY "Users can view follows" ON public.follows FOR SELECT USING (true);
CREATE POLICY "Users can manage own follows" ON public.follows FOR ALL USING (follower_id = auth.uid());

-- Step 24: Create RLS Policies for events
DROP POLICY IF EXISTS "Users can view public events" ON public.events;
DROP POLICY IF EXISTS "Users can create events" ON public.events;
DROP POLICY IF EXISTS "Users can update own events" ON public.events;

CREATE POLICY "Users can view public events" ON public.events FOR SELECT USING (COALESCE(is_public, true) = true OR user_id = auth.uid() OR organizer_id = auth.uid());
CREATE POLICY "Users can create events" ON public.events FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own events" ON public.events FOR UPDATE USING (user_id = auth.uid() OR organizer_id = auth.uid());

-- Step 25: Create RLS Policies for groups
DROP POLICY IF EXISTS "Users can view public groups" ON public.groups;
DROP POLICY IF EXISTS "Users can create groups" ON public.groups;
DROP POLICY IF EXISTS "Users can update own groups" ON public.groups;

CREATE POLICY "Users can view public groups" ON public.groups FOR SELECT USING (true);
CREATE POLICY "Users can create groups" ON public.groups FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own groups" ON public.groups FOR UPDATE USING (created_by = auth.uid());

-- Step 26: Create RLS Policies for group_members
DROP POLICY IF EXISTS "Users can view group members" ON public.group_members;
DROP POLICY IF EXISTS "Group owners can manage members" ON public.group_members;

CREATE POLICY "Users can view group members" ON public.group_members FOR SELECT USING (true);
CREATE POLICY "Group owners can manage members" ON public.group_members FOR ALL USING (EXISTS (
    SELECT 1 FROM public.groups WHERE id = group_members.group_id AND created_by = auth.uid()
));

-- Step 27: Create nearby_rooms function
CREATE OR REPLACE FUNCTION public.nearby_rooms(
    user_lat DOUBLE PRECISION,
    user_lng DOUBLE PRECISION,
    radius_meters INTEGER DEFAULT 1000,
    limit_count INTEGER DEFAULT 20
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    distance_meters DOUBLE PRECISION,
    member_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id,
        r.name,
        r.description,
        SQRT(
            POWER((r.location_lat - user_lat) * 111320, 2) + 
            POWER((r.location_lng - user_lng) * 111320 * COS(RADIANS(user_lat)), 2)
        ) as distance_meters,
        COUNT(rm.user_id)::INTEGER as member_count,
        r.created_at
    FROM public.rooms r
    LEFT JOIN public.room_members rm ON r.id = rm.room_id
    WHERE r.location_lat IS NOT NULL 
        AND r.location_lng IS NOT NULL
        AND r.location_lat BETWEEN user_lat - (radius_meters / 111320.0) 
                               AND user_lat + (radius_meters / 111320.0)
        AND r.location_lng BETWEEN user_lng - (radius_meters / (111320.0 * COS(RADIANS(user_lat))))
                               AND user_lng + (radius_meters / (111320.0 * COS(RADIANS(user_lat))))
        AND COALESCE(r.is_private, false) = false
    GROUP BY r.id, r.name, r.description, r.location_lat, r.location_lng, r.created_at
    HAVING SQRT(
        POWER((r.location_lat - user_lat) * 111320, 2) + 
        POWER((r.location_lng - user_lng) * 111320 * COS(RADIANS(user_lat)), 2)
    ) <= radius_meters
    ORDER BY distance_meters ASC
    LIMIT limit_count;
END;
$$;

-- Step 28: Create trigger function for room creation
CREATE OR REPLACE FUNCTION public.handle_room_creation()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.room_members (room_id, user_id, role)
    VALUES (NEW.id, NEW.created_by, 'owner');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 29: Create trigger for room creation (only if it doesn't exist)
DROP TRIGGER IF EXISTS room_creation_trigger ON public.rooms;
CREATE TRIGGER room_creation_trigger
    AFTER INSERT ON public.rooms
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_room_creation();

-- Step 30: Create trigger function for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, full_name)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'User')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 31: Create trigger for new users (only if it doesn't exist)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Step 32: Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
