-- Step 1: Enable required extensions (basic ones first)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Step 2: Create tables WITHOUT location fields first
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    location_lat DOUBLE PRECISION,
    location_lng DOUBLE PRECISION,
    interests TEXT[],
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.rooms (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    location_lat DOUBLE PRECISION,
    location_lng DOUBLE PRECISION,
    radius_meters INTEGER DEFAULT 1000,
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    is_private BOOLEAN DEFAULT FALSE,
    max_members INTEGER DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.memberships (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'moderator', 'member')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(room_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'video', 'audio', 'location')),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.dm_threads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user1_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    user2_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user1_id, user2_id)
);

CREATE TABLE IF NOT EXISTS public.dm_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    thread_id UUID REFERENCES public.dm_threads(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'video', 'audio', 'location')),
    is_read BOOLEAN DEFAULT FALSE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.posts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    media_urls TEXT[],
    location_lat DOUBLE PRECISION,
    location_lng DOUBLE PRECISION,
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
    author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.reactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    target_type TEXT NOT NULL CHECK (target_type IN ('post', 'comment', 'message')),
    target_id UUID NOT NULL,
    reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'love', 'haha', 'wow', 'sad', 'angry')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, target_type, target_id)
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('follow', 'like', 'comment', 'mention', 'message', 'event', 'urgent')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.device_tokens (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    token TEXT NOT NULL,
    provider TEXT NOT NULL CHECK (provider IN ('fcm', 'apns')),
    device_type TEXT CHECK (device_type IN ('ios', 'android')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, token)
);

CREATE TABLE IF NOT EXISTS public.follows (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(follower_id, following_id)
);

CREATE TABLE IF NOT EXISTS public.events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    location_lat DOUBLE PRECISION,
    location_lng DOUBLE PRECISION,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    organizer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    is_public BOOLEAN DEFAULT TRUE,
    max_attendees INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create regular indexes (no GIST indexes yet)
CREATE INDEX IF NOT EXISTS idx_messages_room_id ON public.messages (room_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages (sender_id);
CREATE INDEX IF NOT EXISTS idx_dm_messages_thread_id ON public.dm_messages (thread_id);
CREATE INDEX IF NOT EXISTS idx_notifications_receiver_id ON public.notifications (receiver_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications (created_at);
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON public.follows (follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON public.follows (following_id);

-- Step 4: Create location indexes using regular BTREE (works with lat/lng)
CREATE INDEX IF NOT EXISTS idx_profiles_location ON public.profiles (location_lat, location_lng);
CREATE INDEX IF NOT EXISTS idx_rooms_location ON public.rooms (location_lat, location_lng);
CREATE INDEX IF NOT EXISTS idx_posts_location ON public.posts (location_lat, location_lng);
CREATE INDEX IF NOT EXISTS idx_events_location ON public.events (location_lat, location_lng);

-- Step 5: Set REPLICA IDENTITY FULL for real-time tables
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.dm_messages REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.posts REPLICA IDENTITY FULL;
ALTER TABLE public.comments REPLICA IDENTITY FULL;

-- Step 6: Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dm_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dm_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Step 7: Create RLS Policies
CREATE POLICY "Users can view all profiles" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view public rooms" ON public.rooms
    FOR SELECT USING (is_private = false OR EXISTS (
        SELECT 1 FROM public.memberships 
        WHERE room_id = rooms.id AND user_id = auth.uid()
    ));

CREATE POLICY "Room owners can update rooms" ON public.rooms
    FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Authenticated users can create rooms" ON public.rooms
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view memberships in their rooms" ON public.memberships
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.memberships m2 
        WHERE m2.room_id = memberships.room_id AND m2.user_id = auth.uid()
    ));

CREATE POLICY "Room owners can manage memberships" ON public.memberships
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.rooms 
        WHERE id = memberships.room_id AND created_by = auth.uid()
    ));

CREATE POLICY "Users can view messages in their rooms" ON public.messages
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.memberships 
        WHERE room_id = messages.room_id AND user_id = auth.uid()
    ));

CREATE POLICY "Users can send messages to their rooms" ON public.messages
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM public.memberships 
        WHERE room_id = messages.room_id AND user_id = auth.uid()
    ));

CREATE POLICY "Users can update own messages" ON public.messages
    FOR UPDATE USING (sender_id = auth.uid());

CREATE POLICY "Users can view their DM threads" ON public.dm_threads
    FOR SELECT USING (user1_id = auth.uid() OR user2_id = auth.uid());

CREATE POLICY "Users can create DM threads" ON public.dm_threads
    FOR INSERT WITH CHECK (user1_id = auth.uid() OR user2_id = auth.uid());

CREATE POLICY "Users can view messages in their DM threads" ON public.dm_messages
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.dm_threads 
        WHERE id = dm_messages.thread_id 
        AND (user1_id = auth.uid() OR user2_id = auth.uid())
    ));

CREATE POLICY "Users can send DM messages" ON public.dm_messages
    FOR INSERT WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can view public posts" ON public.posts
    FOR SELECT USING (is_public = true OR author_id = auth.uid());

CREATE POLICY "Users can create posts" ON public.posts
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own posts" ON public.posts
    FOR UPDATE USING (author_id = auth.uid());

CREATE POLICY "Users can view comments on visible posts" ON public.comments
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.posts 
        WHERE id = comments.post_id 
        AND (is_public = true OR author_id = auth.uid())
    ));

CREATE POLICY "Users can create comments" ON public.comments
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own comments" ON public.comments
    FOR UPDATE USING (author_id = auth.uid());

CREATE POLICY "Users can view reactions" ON public.reactions
    FOR SELECT USING (true);

CREATE POLICY "Users can create reactions" ON public.reactions
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own reactions" ON public.reactions
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (receiver_id = auth.uid());

CREATE POLICY "Users can create notifications" ON public.notifications
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (receiver_id = auth.uid());

CREATE POLICY "Users can manage own device tokens" ON public.device_tokens
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can view follows" ON public.follows
    FOR SELECT USING (true);

CREATE POLICY "Users can manage own follows" ON public.follows
    FOR ALL USING (follower_id = auth.uid());

CREATE POLICY "Users can view public events" ON public.events
    FOR SELECT USING (is_public = true OR organizer_id = auth.uid());

CREATE POLICY "Users can create events" ON public.events
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own events" ON public.events
    FOR UPDATE USING (organizer_id = auth.uid());

-- Step 8: Create nearby_rooms function using simple distance calculation
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
        -- Simple distance calculation using Pythagorean theorem (approximate)
        SQRT(
            POWER((r.location_lat - user_lat) * 111320, 2) + 
            POWER((r.location_lng - user_lng) * 111320 * COS(RADIANS(user_lat)), 2)
        ) as distance_meters,
        COUNT(m.user_id)::INTEGER as member_count,
        r.created_at
    FROM public.rooms r
    LEFT JOIN public.memberships m ON r.id = m.room_id
    WHERE r.location_lat IS NOT NULL 
        AND r.location_lng IS NOT NULL
        -- Simple bounding box filter for performance
        AND r.location_lat BETWEEN user_lat - (radius_meters / 111320.0) 
                               AND user_lat + (radius_meters / 111320.0)
        AND r.location_lng BETWEEN user_lng - (radius_meters / (111320.0 * COS(RADIANS(user_lat))))
                               AND user_lng + (radius_meters / (111320.0 * COS(RADIANS(user_lat))))
        AND r.is_private = false
    GROUP BY r.id, r.name, r.description, r.location_lat, r.location_lng, r.created_at
    HAVING SQRT(
        POWER((r.location_lat - user_lat) * 111320, 2) + 
        POWER((r.location_lng - user_lng) * 111320 * COS(RADIANS(user_lat)), 2)
    ) <= radius_meters
    ORDER BY distance_meters ASC
    LIMIT limit_count;
END;
$$;

-- Step 9: Create triggers
CREATE OR REPLACE FUNCTION public.handle_room_creation()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.memberships (room_id, user_id, role)
    VALUES (NEW.id, NEW.created_by, 'owner');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER room_creation_trigger
    AFTER INSERT ON public.rooms
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_room_creation();

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

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Step 10: Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
