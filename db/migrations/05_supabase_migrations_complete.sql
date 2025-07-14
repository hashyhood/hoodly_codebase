-- Complete Database Migration for Hoodly App
-- Run this in your Supabase SQL Editor

-- 1. Fix profiles table - add missing fields
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing profiles to have created_at
UPDATE profiles 
SET created_at = NOW() 
WHERE created_at IS NULL;

-- 2. Create rooms table for group chat rooms
CREATE TABLE IF NOT EXISTS rooms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    is_private BOOLEAN DEFAULT false,
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create room_members table
CREATE TABLE IF NOT EXISTS room_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(room_id, user_id)
);

-- 4. Create friends table
CREATE TABLE IF NOT EXISTS friends (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    friend_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, friend_id),
    CHECK (user_id != friend_id)
);

-- 5. Create friend_requests table
CREATE TABLE IF NOT EXISTS friend_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    from_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    to_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(from_user_id, to_user_id),
    CHECK (from_user_id != to_user_id)
);

-- 6. Create user_locations table
CREATE TABLE IF NOT EXISTS user_locations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    address TEXT,
    city TEXT,
    state TEXT,
    country TEXT,
    postal_code TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 7. Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
    notifications_enabled BOOLEAN DEFAULT true,
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    privacy_level TEXT DEFAULT 'friends' CHECK (privacy_level IN ('public', 'friends', 'private')),
    location_sharing BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 8. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rooms_created_by ON rooms(created_by);
CREATE INDEX IF NOT EXISTS idx_room_members_room_id ON room_members(room_id);
CREATE INDEX IF NOT EXISTS idx_room_members_user_id ON room_members(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_user_id ON friends(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_friend_id ON friends(friend_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_from_user_id ON friend_requests(from_user_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_to_user_id ON friend_requests(to_user_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_status ON friend_requests(status);
CREATE INDEX IF NOT EXISTS idx_user_locations_user_id ON user_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_room_id ON messages(room_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_private_messages_sender_id ON private_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_private_messages_receiver_id ON private_messages(receiver_id);

-- 9. Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON rooms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_friend_requests_updated_at BEFORE UPDATE ON friend_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_locations_updated_at BEFORE UPDATE ON user_locations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Rooms policies
CREATE POLICY "Users can view public rooms" ON rooms
    FOR SELECT USING (is_private = false);

CREATE POLICY "Users can view rooms they're members of" ON rooms
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM room_members 
            WHERE room_id = rooms.id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create rooms" ON rooms
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Room creators can update their rooms" ON rooms
    FOR UPDATE USING (auth.uid() = created_by);

-- Room members policies
CREATE POLICY "Users can view room members" ON room_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM room_members rm
            WHERE rm.room_id = room_members.room_id AND rm.user_id = auth.uid()
        )
    );

CREATE POLICY "Room admins can manage members" ON room_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM room_members rm
            WHERE rm.room_id = room_members.room_id 
            AND rm.user_id = auth.uid() 
            AND rm.role IN ('admin', 'moderator')
        )
    );

-- Friends policies
CREATE POLICY "Users can view their own friends" ON friends
    FOR SELECT USING (user_id = auth.uid() OR friend_id = auth.uid());

CREATE POLICY "Users can add friends" ON friends
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can remove their own friendships" ON friends
    FOR DELETE USING (user_id = auth.uid() OR friend_id = auth.uid());

-- Friend requests policies
CREATE POLICY "Users can view their own friend requests" ON friend_requests
    FOR SELECT USING (from_user_id = auth.uid() OR to_user_id = auth.uid());

CREATE POLICY "Users can send friend requests" ON friend_requests
    FOR INSERT WITH CHECK (from_user_id = auth.uid());

CREATE POLICY "Users can update friend requests sent to them" ON friend_requests
    FOR UPDATE USING (to_user_id = auth.uid());

CREATE POLICY "Users can delete their own friend requests" ON friend_requests
    FOR DELETE USING (from_user_id = auth.uid() OR to_user_id = auth.uid());

-- User locations policies
CREATE POLICY "Users can view their own location" ON user_locations
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own location" ON user_locations
    FOR ALL USING (user_id = auth.uid());

-- User preferences policies
CREATE POLICY "Users can view their own preferences" ON user_preferences
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own preferences" ON user_preferences
    FOR ALL USING (user_id = auth.uid());

-- 11. Insert default data for existing users
INSERT INTO user_preferences (user_id, theme, notifications_enabled, privacy_level)
SELECT id, 'light', true, 'friends'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_preferences);

-- 12. Create functions for common operations

-- Function to get user's friends
CREATE OR REPLACE FUNCTION get_user_friends(user_uuid UUID)
RETURNS TABLE (
    friend_id UUID,
    friend_name TEXT,
    friend_avatar TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CASE 
            WHEN f.user_id = user_uuid THEN f.friend_id
            ELSE f.user_id
        END as friend_id,
        p.full_name as friend_name,
        p.avatar_url as friend_avatar
    FROM friends f
    JOIN profiles p ON (
        CASE 
            WHEN f.user_id = user_uuid THEN f.friend_id
            ELSE f.user_id
        END = p.id
    )
    WHERE f.user_id = user_uuid OR f.friend_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's pending friend requests
CREATE OR REPLACE FUNCTION get_pending_friend_requests(user_uuid UUID)
RETURNS TABLE (
    request_id UUID,
    from_user_id UUID,
    from_user_name TEXT,
    from_user_avatar TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        fr.id as request_id,
        fr.from_user_id,
        p.full_name as from_user_name,
        p.avatar_url as from_user_avatar,
        fr.created_at
    FROM friend_requests fr
    JOIN profiles p ON fr.from_user_id = p.id
    WHERE fr.to_user_id = user_uuid AND fr.status = 'pending';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to accept friend request
CREATE OR REPLACE FUNCTION accept_friend_request(request_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    request_record friend_requests%ROWTYPE;
BEGIN
    -- Get the friend request
    SELECT * INTO request_record
    FROM friend_requests
    WHERE id = request_uuid AND to_user_id = auth.uid() AND status = 'pending';
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Update request status
    UPDATE friend_requests 
    SET status = 'accepted', updated_at = NOW()
    WHERE id = request_uuid;
    
    -- Create friendship
    INSERT INTO friends (user_id, friend_id)
    VALUES (request_record.from_user_id, request_record.to_user_id);
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reject friend request
CREATE OR REPLACE FUNCTION reject_friend_request(request_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE friend_requests 
    SET status = 'rejected', updated_at = NOW()
    WHERE id = request_uuid AND to_user_id = auth.uid() AND status = 'pending';
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to send friend request
CREATE OR REPLACE FUNCTION send_friend_request(to_user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if already friends
    IF EXISTS (
        SELECT 1 FROM friends 
        WHERE (user_id = auth.uid() AND friend_id = to_user_uuid)
           OR (user_id = to_user_uuid AND friend_id = auth.uid())
    ) THEN
        RETURN FALSE;
    END IF;
    
    -- Check if request already exists
    IF EXISTS (
        SELECT 1 FROM friend_requests 
        WHERE (from_user_id = auth.uid() AND to_user_id = to_user_uuid)
           OR (from_user_id = to_user_uuid AND to_user_id = auth.uid())
    ) THEN
        RETURN FALSE;
    END IF;
    
    -- Insert friend request
    INSERT INTO friend_requests (from_user_id, to_user_id)
    VALUES (auth.uid(), to_user_uuid);
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to remove friend
CREATE OR REPLACE FUNCTION remove_friend(friend_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    DELETE FROM friends 
    WHERE (user_id = auth.uid() AND friend_id = friend_uuid)
       OR (user_id = friend_uuid AND friend_id = auth.uid());
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant permissions to anon users (for public data)
GRANT SELECT ON rooms TO anon;
GRANT SELECT ON profiles TO anon;

COMMENT ON TABLE rooms IS 'Group chat rooms';
COMMENT ON TABLE room_members IS 'Members of group chat rooms';
COMMENT ON TABLE friends IS 'User friendships';
COMMENT ON TABLE friend_requests IS 'Friend request management';
COMMENT ON TABLE user_locations IS 'User location data';
COMMENT ON TABLE user_preferences IS 'User preferences and settings'; 