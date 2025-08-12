-- 🔧 ALIGN DATABASE WITH OLDER FILES
-- Update database schema to match older file expectations

-- ===========================================
-- 1. UPDATE NOTIFICATIONS TABLE TO MATCH OLDER FILES
-- ===========================================

-- Drop existing notifications table
DROP TABLE IF EXISTS notifications CASCADE;

-- Create notifications table that matches older files expectations
CREATE TABLE notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('like', 'comment', 'follow', 'message', 'friend_request', 'post', 'event', 'marketplace', 'group')),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    message TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_receiver_id ON notifications(receiver_id);
CREATE INDEX IF NOT EXISTS idx_notifications_sender_id ON notifications(sender_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for notifications
CREATE POLICY "notifications_select_policy" ON notifications
    FOR SELECT USING (receiver_id = auth.uid() OR sender_id = auth.uid());

CREATE POLICY "notifications_insert_policy" ON notifications
    FOR INSERT WITH CHECK (sender_id = auth.uid());

CREATE POLICY "notifications_update_policy" ON notifications
    FOR UPDATE USING (receiver_id = auth.uid());

CREATE POLICY "notifications_delete_policy" ON notifications
    FOR DELETE USING (sender_id = auth.uid());

-- ===========================================
-- 2. UPDATE FRIEND_REQUESTS TABLE TO MATCH OLDER FILES
-- ===========================================

-- Drop existing friend_requests table
DROP TABLE IF EXISTS friend_requests CASCADE;

-- Create friend_requests table that matches older files expectations
CREATE TABLE friend_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(sender_id, receiver_id),
    CHECK (sender_id != receiver_id)
);

-- Create indexes for friend_requests
CREATE INDEX IF NOT EXISTS idx_friend_requests_sender_id ON friend_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver_id ON friend_requests(receiver_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_status ON friend_requests(status);

-- Enable RLS
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for friend_requests
CREATE POLICY "friend_requests_select_policy" ON friend_requests
    FOR SELECT USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "friend_requests_insert_policy" ON friend_requests
    FOR INSERT WITH CHECK (sender_id = auth.uid());

CREATE POLICY "friend_requests_update_policy" ON friend_requests
    FOR UPDATE USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "friend_requests_delete_policy" ON friend_requests
    FOR DELETE USING (sender_id = auth.uid());

-- ===========================================
-- 3. UPDATE MESSAGES TABLE TO MATCH OLDER FILES
-- ===========================================

-- Add sender_id column to messages table if it doesn't exist
ALTER TABLE messages ADD COLUMN IF NOT EXISTS sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE;

-- Update existing messages to set sender_id = user_id
UPDATE messages SET sender_id = user_id WHERE sender_id IS NULL;

-- Create index for sender_id
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);

-- Update RLS policies to include sender_id
DROP POLICY IF EXISTS "messages_select_policy" ON messages;
DROP POLICY IF EXISTS "messages_insert_policy" ON messages;

CREATE POLICY "messages_select_policy" ON messages
    FOR SELECT USING (
        sender_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM room_members rm 
            WHERE rm.room_id = messages.room_id 
            AND rm.user_id = auth.uid()
        )
    );

CREATE POLICY "messages_insert_policy" ON messages
    FOR INSERT WITH CHECK (
        sender_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM room_members rm 
            WHERE rm.room_id = messages.room_id 
            AND rm.user_id = auth.uid()
        )
    );

-- ===========================================
-- 4. UPDATE ROOMS TABLE TO MATCH OLDER FILES
-- ===========================================

-- Add creator_id column to rooms table if it doesn't exist
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE;

-- Update existing rooms to set creator_id = created_by
UPDATE rooms SET creator_id = created_by WHERE creator_id IS NULL;

-- Create index for creator_id
CREATE INDEX IF NOT EXISTS idx_rooms_creator_id ON rooms(creator_id);

-- Update RLS policies to include creator_id
DROP POLICY IF EXISTS "rooms_select_policy" ON rooms;
DROP POLICY IF EXISTS "rooms_insert_policy" ON rooms;
DROP POLICY IF EXISTS "rooms_update_policy" ON rooms;
DROP POLICY IF EXISTS "rooms_delete_policy" ON rooms;

CREATE POLICY "rooms_select_policy" ON rooms
    FOR SELECT USING (true);

CREATE POLICY "rooms_insert_policy" ON rooms
    FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "rooms_update_policy" ON rooms
    FOR UPDATE USING (auth.uid() = creator_id);

CREATE POLICY "rooms_delete_policy" ON rooms
    FOR DELETE USING (auth.uid() = creator_id);

-- ===========================================
-- 5. UPDATE NOTIFICATIONS FUNCTION TO MATCH OLDER FILES
-- ===========================================

-- Drop existing function
DROP FUNCTION IF EXISTS get_user_notifications(UUID);
DROP FUNCTION IF EXISTS get_user_notifications(UUID, INTEGER);
DROP FUNCTION IF EXISTS get_user_notifications(UUID, INTEGER, INTEGER);

-- Create function that matches older files expectations
CREATE OR REPLACE FUNCTION get_user_notifications(
    user_id UUID,
    limit_count INTEGER DEFAULT 20,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    type TEXT,
    is_read BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    sender_data JSON,
    target_data JSON
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.id,
        n.type,
        n.is_read,
        n.created_at,
        json_build_object(
            'id', p.id,
            'username', p.username,
            'full_name', p.full_name,
            'avatar_url', p.avatar_url,
            'is_verified', p.is_verified
        ) as sender_data,
        json_build_object(
            'post_id', n.post_id,
            'room_id', n.room_id,
            'message', n.message
        ) as target_data
    FROM notifications n
    LEFT JOIN profiles p ON p.id = n.sender_id
    WHERE n.receiver_id = get_user_notifications.user_id
    ORDER BY n.created_at DESC
    LIMIT limit_count OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_user_notifications(UUID, INTEGER, INTEGER) TO authenticated;

-- ===========================================
-- 6. CREATE HELPER FUNCTIONS FOR OLDER FILES
-- ===========================================

-- Drop existing functions first to avoid return type conflicts
DROP FUNCTION IF EXISTS create_notification(UUID, UUID, TEXT, UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS mark_notification_read(UUID);
DROP FUNCTION IF EXISTS mark_all_notifications_read(UUID);

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
    sender_id UUID,
    receiver_id UUID,
    notification_type TEXT,
    post_id UUID DEFAULT NULL,
    room_id UUID DEFAULT NULL,
    message TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO notifications (sender_id, receiver_id, type, post_id, room_id, message)
    VALUES (sender_id, receiver_id, notification_type, post_id, room_id, message)
    RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(notification_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE notifications 
    SET is_read = true, updated_at = NOW()
    WHERE id = notification_id AND receiver_id = auth.uid();
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark all notifications as read
CREATE OR REPLACE FUNCTION mark_all_notifications_read(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE notifications 
    SET is_read = true, updated_at = NOW()
    WHERE receiver_id = user_id AND is_read = false;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION create_notification(UUID, UUID, TEXT, UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_notification_read(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_all_notifications_read(UUID) TO authenticated;

-- ===========================================
-- 7. VERIFY CHANGES
-- ===========================================

-- Test notifications table structure
SELECT 'Testing notifications table structure...' as test;
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'notifications' ORDER BY ordinal_position;

-- Test friend_requests table structure
SELECT 'Testing friend_requests table structure...' as test;
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'friend_requests' ORDER BY ordinal_position;

-- Test messages table structure
SELECT 'Testing messages table structure...' as test;
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'messages' ORDER BY ordinal_position;

-- Test rooms table structure
SELECT 'Testing rooms table structure...' as test;
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'rooms' ORDER BY ordinal_position;

-- Test notifications function
SELECT 'Testing notifications function...' as test;
SELECT get_user_notifications(auth.uid(), 5, 0) LIMIT 1;

-- ===========================================
-- SUCCESS MESSAGE
-- ===========================================

DO $$
BEGIN
    RAISE NOTICE '🎉 DATABASE ALIGNED WITH OLDER FILES!';
    RAISE NOTICE '✅ Notifications table updated with sender_id/receiver_id';
    RAISE NOTICE '✅ Friend_requests table updated with sender_id/receiver_id';
    RAISE NOTICE '✅ Messages table updated with sender_id column';
    RAISE NOTICE '✅ Rooms table updated with creator_id column';
    RAISE NOTICE '✅ Notifications function updated to match older files';
    RAISE NOTICE '✅ Helper functions created for older files';
    RAISE NOTICE '✅ All RLS policies updated';
    RAISE NOTICE '🚀 Database now matches your older file expectations!';
END $$; 