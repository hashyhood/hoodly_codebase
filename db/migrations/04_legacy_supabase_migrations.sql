-- Comprehensive Supabase Migration for Hoodly Social App
-- Run this in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 1. FIX PROFILES TABLE
-- Add missing email column and fix constraints
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing profiles to have email if missing
UPDATE profiles 
SET email = auth.users.email 
FROM auth.users 
WHERE profiles.id = auth.users.id 
AND profiles.email IS NULL;

-- 2. CREATE MISSING TABLES

-- Messages table for group chats
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'location')),
    file_url TEXT,
    location_data JSONB,
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Private messages table
CREATE TABLE IF NOT EXISTS private_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'location')),
    file_url TEXT,
    location_data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_private_message UNIQUE(sender_id, receiver_id, created_at)
);

-- Rooms table for group chats
CREATE TABLE IF NOT EXISTS rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    is_private BOOLEAN DEFAULT FALSE,
    max_members INTEGER DEFAULT 100,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Room members table
CREATE TABLE IF NOT EXISTS room_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_room_member UNIQUE(room_id, user_id)
);

-- Friends table
CREATE TABLE IF NOT EXISTS friends (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_friendship UNIQUE(user_id, friend_id),
    CONSTRAINT no_self_friend CHECK (user_id != friend_id)
);

-- Friend requests table
CREATE TABLE IF NOT EXISTS friend_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    message TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_friend_request UNIQUE(sender_id, receiver_id),
    CONSTRAINT no_self_request CHECK (sender_id != receiver_id)
);

-- User locations table for proximity features
CREATE TABLE IF NOT EXISTS user_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    accuracy INTEGER,
    is_public BOOLEAN DEFAULT FALSE,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_user_location UNIQUE(user_id)
);

-- User preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    notification_settings JSONB DEFAULT '{"posts": true, "comments": true, "likes": true, "events": true, "marketplace": true, "groups": true, "messages": true}',
    privacy_settings JSONB DEFAULT '{"profile_visibility": "public", "location_sharing": false, "show_online_status": true}',
    theme_preference TEXT DEFAULT 'system' CHECK (theme_preference IN ('light', 'dark', 'system')),
    language_preference TEXT DEFAULT 'en',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_user_preferences UNIQUE(user_id)
);

-- 3. CREATE INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_location ON posts USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_events_start_time ON events(start_time);
CREATE INDEX IF NOT EXISTS idx_events_location ON events USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_seller_id ON marketplace_listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_status ON marketplace_listings(status);
CREATE INDEX IF NOT EXISTS idx_groups_creator_id ON groups(creator_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_room_id ON messages(room_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_private_messages_sender_id ON private_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_private_messages_receiver_id ON private_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_private_messages_created_at ON private_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_room_members_room_id ON room_members(room_id);
CREATE INDEX IF NOT EXISTS idx_room_members_user_id ON room_members(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_user_id ON friends(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_friend_id ON friends(friend_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_sender_id ON friend_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver_id ON friend_requests(receiver_id);
CREATE INDEX IF NOT EXISTS idx_user_locations_location ON user_locations USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- 4. CREATE TRIGGERS FOR AUTOMATIC UPDATES
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_marketplace_listings_updated_at BEFORE UPDATE ON marketplace_listings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON rooms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_friends_updated_at BEFORE UPDATE ON friends FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_friend_requests_updated_at BEFORE UPDATE ON friend_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. CREATE FUNCTIONS FOR AUTOMATIC COUNTS
CREATE OR REPLACE FUNCTION update_post_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE posts SET 
            likes_count = (SELECT COUNT(*) FROM likes WHERE post_id = NEW.post_id),
            comments_count = (SELECT COUNT(*) FROM comments WHERE post_id = NEW.post_id)
        WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE posts SET 
            likes_count = (SELECT COUNT(*) FROM likes WHERE post_id = OLD.post_id),
            comments_count = (SELECT COUNT(*) FROM comments WHERE post_id = OLD.post_id)
        WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_post_likes_count AFTER INSERT OR DELETE ON likes FOR EACH ROW EXECUTE FUNCTION update_post_counts();
CREATE TRIGGER update_post_comments_count AFTER INSERT OR DELETE ON comments FOR EACH ROW EXECUTE FUNCTION update_post_counts();

-- Function to update group member count
CREATE OR REPLACE FUNCTION update_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE groups SET member_count = (SELECT COUNT(*) FROM group_members WHERE group_id = NEW.group_id) WHERE id = NEW.group_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE groups SET member_count = (SELECT COUNT(*) FROM group_members WHERE group_id = OLD.group_id) WHERE id = OLD.group_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_group_member_count_trigger AFTER INSERT OR DELETE ON group_members FOR EACH ROW EXECUTE FUNCTION update_group_member_count();

-- 6. ROW LEVEL SECURITY (RLS) POLICIES

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE private_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Posts policies
CREATE POLICY "Users can view all posts" ON posts FOR SELECT USING (true);
CREATE POLICY "Users can create posts" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON posts FOR DELETE USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "Users can view all comments" ON comments FOR SELECT USING (true);
CREATE POLICY "Users can create comments" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON comments FOR DELETE USING (auth.uid() = user_id);

-- Likes policies
CREATE POLICY "Users can view all likes" ON likes FOR SELECT USING (true);
CREATE POLICY "Users can create likes" ON likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own likes" ON likes FOR DELETE USING (auth.uid() = user_id);

-- Events policies
CREATE POLICY "Users can view all events" ON events FOR SELECT USING (true);
CREATE POLICY "Users can create events" ON events FOR INSERT WITH CHECK (auth.uid() = organizer_id);
CREATE POLICY "Users can update own events" ON events FOR UPDATE USING (auth.uid() = organizer_id);
CREATE POLICY "Users can delete own events" ON events FOR DELETE USING (auth.uid() = organizer_id);

-- Event RSVPs policies
CREATE POLICY "Users can view all RSVPs" ON event_rsvps FOR SELECT USING (true);
CREATE POLICY "Users can manage own RSVPs" ON event_rsvps FOR ALL USING (auth.uid() = user_id);

-- Marketplace policies
CREATE POLICY "Users can view all listings" ON marketplace_listings FOR SELECT USING (true);
CREATE POLICY "Users can create listings" ON marketplace_listings FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "Users can update own listings" ON marketplace_listings FOR UPDATE USING (auth.uid() = seller_id);
CREATE POLICY "Users can delete own listings" ON marketplace_listings FOR DELETE USING (auth.uid() = seller_id);

-- Groups policies
CREATE POLICY "Users can view all groups" ON groups FOR SELECT USING (true);
CREATE POLICY "Users can create groups" ON groups FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Users can update own groups" ON groups FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "Users can delete own groups" ON groups FOR DELETE USING (auth.uid() = creator_id);

-- Group members policies
CREATE POLICY "Users can view group members" ON group_members FOR SELECT USING (true);
CREATE POLICY "Users can join groups" ON group_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave groups" ON group_members FOR DELETE USING (auth.uid() = user_id);

-- Group posts policies
CREATE POLICY "Users can view group posts" ON group_posts FOR SELECT USING (true);
CREATE POLICY "Users can create group posts" ON group_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own group posts" ON group_posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own group posts" ON group_posts FOR DELETE USING (auth.uid() = user_id);

-- Messages policies
CREATE POLICY "Users can view room messages" ON messages FOR SELECT USING (
    EXISTS (SELECT 1 FROM room_members WHERE room_id = messages.room_id AND user_id = auth.uid())
);
CREATE POLICY "Users can send messages to rooms" ON messages FOR INSERT WITH CHECK (
    auth.uid() = user_id AND 
    EXISTS (SELECT 1 FROM room_members WHERE room_id = messages.room_id AND user_id = auth.uid())
);
CREATE POLICY "Users can update own messages" ON messages FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own messages" ON messages FOR DELETE USING (auth.uid() = user_id);

-- Private messages policies
CREATE POLICY "Users can view private messages" ON private_messages FOR SELECT USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
);
CREATE POLICY "Users can send private messages" ON private_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update own messages" ON private_messages FOR UPDATE USING (auth.uid() = sender_id);
CREATE POLICY "Users can delete own messages" ON private_messages FOR DELETE USING (auth.uid() = sender_id);

-- Rooms policies
CREATE POLICY "Users can view all rooms" ON rooms FOR SELECT USING (true);
CREATE POLICY "Users can create rooms" ON rooms FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Users can update own rooms" ON rooms FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "Users can delete own rooms" ON rooms FOR DELETE USING (auth.uid() = creator_id);

-- Room members policies
CREATE POLICY "Users can view room members" ON room_members FOR SELECT USING (true);
CREATE POLICY "Users can join rooms" ON room_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave rooms" ON room_members FOR DELETE USING (auth.uid() = user_id);

-- Friends policies
CREATE POLICY "Users can view own friendships" ON friends FOR SELECT USING (
    auth.uid() = user_id OR auth.uid() = friend_id
);
CREATE POLICY "Users can manage own friendships" ON friends FOR ALL USING (
    auth.uid() = user_id OR auth.uid() = friend_id
);

-- Friend requests policies
CREATE POLICY "Users can view own friend requests" ON friend_requests FOR SELECT USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
);
CREATE POLICY "Users can send friend requests" ON friend_requests FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update own friend requests" ON friend_requests FOR UPDATE USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
);
CREATE POLICY "Users can delete own friend requests" ON friend_requests FOR DELETE USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
);

-- User locations policies
CREATE POLICY "Users can view public locations" ON user_locations FOR SELECT USING (is_public = true);
CREATE POLICY "Users can view own location" ON user_locations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own location" ON user_locations FOR ALL USING (auth.uid() = user_id);

-- User preferences policies
CREATE POLICY "Users can view own preferences" ON user_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own preferences" ON user_preferences FOR ALL USING (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- 7. CREATE DEFAULT DATA
-- Insert default public room
INSERT INTO rooms (id, name, description, creator_id, is_private) 
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'General Chat',
    'Welcome to the general chat room!',
    '00000000-0000-0000-0000-000000000001',
    false
) ON CONFLICT (id) DO NOTHING;

-- 8. CREATE STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public) VALUES ('uploads', 'uploads', true) ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'uploads');
CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'uploads' AND auth.role() = 'authenticated'
);
CREATE POLICY "Users can update own uploads" ON storage.objects FOR UPDATE USING (
    bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Users can delete own uploads" ON storage.objects FOR DELETE USING (
    bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 9. CREATE FUNCTIONS FOR NOTIFICATIONS
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_title TEXT,
    p_message TEXT,
    p_type TEXT,
    p_reference_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO notifications (user_id, title, message, type, reference_id)
    VALUES (p_user_id, p_title, p_message, p_type, p_reference_id)
    RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. CREATE FUNCTIONS FOR REAL-TIME FEATURES
CREATE OR REPLACE FUNCTION get_nearby_users(
    user_location GEOGRAPHY,
    radius_meters INTEGER DEFAULT 5000
)
RETURNS TABLE (
    user_id UUID,
    full_name TEXT,
    avatar_url TEXT,
    distance_meters DOUBLE PRECISION
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ul.user_id,
        p.full_name,
        p.avatar_url,
        ST_Distance(ul.location, user_location) as distance_meters
    FROM user_locations ul
    JOIN profiles p ON ul.user_id = p.id
    WHERE ul.is_public = true
    AND ST_DWithin(ul.location, user_location, radius_meters)
    ORDER BY distance_meters;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Update existing profiles with default preferences
INSERT INTO user_preferences (user_id)
SELECT id FROM profiles 
WHERE id NOT IN (SELECT user_id FROM user_preferences)
ON CONFLICT (user_id) DO NOTHING;

-- Update existing profiles with default locations (if they have location data in posts)
INSERT INTO user_locations (user_id, location, is_public)
SELECT DISTINCT user_id, location, false
FROM posts 
WHERE location IS NOT NULL 
AND user_id NOT IN (SELECT user_id FROM user_locations)
ON CONFLICT (user_id) DO NOTHING; 