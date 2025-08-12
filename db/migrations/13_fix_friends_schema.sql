-- Fix friends and friend_requests schema
-- Run this in your Supabase SQL Editor

-- 1. Ensure friends table has correct schema (no status column)
DROP TABLE IF EXISTS friends CASCADE;
CREATE TABLE friends (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    friend_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, friend_id),
    CHECK (user_id != friend_id)
);

-- 2. Ensure friend_requests table has correct schema
DROP TABLE IF EXISTS friend_requests CASCADE;
CREATE TABLE friend_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    from_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    to_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(from_user_id, to_user_id),
    CHECK (from_user_id != to_user_id)
);

-- 3. Ensure notifications table has correct schema
DROP TABLE IF EXISTS notifications CASCADE;
CREATE TABLE notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('post', 'comment', 'like', 'event', 'marketplace', 'group')),
    reference_id UUID,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_friends_user_id ON friends(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_friend_id ON friends(friend_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_from_user_id ON friend_requests(from_user_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_to_user_id ON friend_requests(to_user_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_status ON friend_requests(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- 5. Enable RLS
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for friends
CREATE POLICY "Users can view their own friends" ON friends
    FOR SELECT USING (user_id = auth.uid() OR friend_id = auth.uid());

CREATE POLICY "Users can add friends" ON friends
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can remove their own friendships" ON friends
    FOR DELETE USING (user_id = auth.uid() OR friend_id = auth.uid());

-- 7. Create RLS policies for friend_requests
CREATE POLICY "Users can view their own friend requests" ON friend_requests
    FOR SELECT USING (from_user_id = auth.uid() OR to_user_id = auth.uid());

CREATE POLICY "Users can send friend requests" ON friend_requests
    FOR INSERT WITH CHECK (from_user_id = auth.uid());

CREATE POLICY "Users can update friend requests sent to them" ON friend_requests
    FOR UPDATE USING (to_user_id = auth.uid());

CREATE POLICY "Users can delete their own friend requests" ON friend_requests
    FOR DELETE USING (from_user_id = auth.uid() OR to_user_id = auth.uid());

-- 8. Create RLS policies for notifications
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (user_id = auth.uid());

-- 9. Grant permissions
GRANT ALL ON friends TO authenticated;
GRANT ALL ON friend_requests TO authenticated;
GRANT ALL ON notifications TO authenticated;

-- 10. Drop existing functions first (if they exist)
DROP FUNCTION IF EXISTS get_user_friends(UUID);
DROP FUNCTION IF EXISTS get_pending_friend_requests(UUID);
DROP FUNCTION IF EXISTS accept_friend_request(UUID);
DROP FUNCTION IF EXISTS reject_friend_request(UUID);
DROP FUNCTION IF EXISTS send_friend_request(UUID);
DROP FUNCTION IF EXISTS remove_friend(UUID);

-- 11. Create functions for friend operations
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

CREATE OR REPLACE FUNCTION reject_friend_request(request_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE friend_requests 
    SET status = 'rejected', updated_at = NOW()
    WHERE id = request_uuid AND to_user_id = auth.uid() AND status = 'pending';
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

CREATE OR REPLACE FUNCTION remove_friend(friend_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    DELETE FROM friends 
    WHERE (user_id = auth.uid() AND friend_id = friend_uuid)
       OR (user_id = friend_uuid AND friend_id = auth.uid());
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_user_friends(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_pending_friend_requests(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION accept_friend_request(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_friend_request(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION send_friend_request(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION remove_friend(UUID) TO authenticated;

COMMENT ON TABLE friends IS 'User friendships';
COMMENT ON TABLE friend_requests IS 'Friend request management';
COMMENT ON TABLE notifications IS 'User notifications'; 