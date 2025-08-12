-- Fix foreign key references without dropping tables
-- Run this in your Supabase SQL Editor

-- 1. Drop existing foreign key constraints
ALTER TABLE friends DROP CONSTRAINT IF EXISTS friends_user_id_fkey;
ALTER TABLE friends DROP CONSTRAINT IF EXISTS friends_friend_id_fkey;
ALTER TABLE friend_requests DROP CONSTRAINT IF EXISTS friend_requests_from_user_id_fkey;
ALTER TABLE friend_requests DROP CONSTRAINT IF EXISTS friend_requests_to_user_id_fkey;
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;

-- 2. Add correct foreign key constraints
ALTER TABLE friends 
ADD CONSTRAINT friends_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE friends 
ADD CONSTRAINT friends_friend_id_fkey 
FOREIGN KEY (friend_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE friend_requests 
ADD CONSTRAINT friend_requests_from_user_id_fkey 
FOREIGN KEY (from_user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE friend_requests 
ADD CONSTRAINT friend_requests_to_user_id_fkey 
FOREIGN KEY (to_user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE notifications 
ADD CONSTRAINT notifications_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 3. Drop existing functions first (if they exist)
DROP FUNCTION IF EXISTS get_user_friends(UUID);
DROP FUNCTION IF EXISTS get_pending_friend_requests(UUID);
DROP FUNCTION IF EXISTS accept_friend_request(UUID);
DROP FUNCTION IF EXISTS reject_friend_request(UUID);
DROP FUNCTION IF EXISTS send_friend_request(UUID);
DROP FUNCTION IF EXISTS remove_friend(UUID);

-- 4. Create functions for friend operations
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

-- 5. Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_user_friends(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_pending_friend_requests(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION accept_friend_request(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_friend_request(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION send_friend_request(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION remove_friend(UUID) TO authenticated; 