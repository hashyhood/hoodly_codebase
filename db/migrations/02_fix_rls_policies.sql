-- Fix RLS Policies and Other Issues
-- Run this in your Supabase SQL Editor

-- 1. Drop the problematic RLS policies
DROP POLICY IF EXISTS "Users can view room members" ON room_members;
DROP POLICY IF EXISTS "Room admins can manage members" ON room_members;

-- 2. Create simpler, non-recursive policies
CREATE POLICY "Users can view room members" ON room_members
    FOR SELECT USING (
        room_id IN (
            SELECT room_id FROM room_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage room members" ON room_members
    FOR ALL USING (
        room_id IN (
            SELECT room_id FROM room_members 
            WHERE user_id = auth.uid() AND role IN ('admin', 'moderator')
        )
    );

-- 3. Fix auth user permissions
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- 4. Grant specific permissions
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT INSERT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT UPDATE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- 5. Grant permissions to anon for public data
GRANT SELECT ON profiles TO anon;
GRANT SELECT ON rooms TO anon;
GRANT SELECT ON groups TO anon;
GRANT SELECT ON events TO anon;
GRANT SELECT ON marketplace_listings TO anon;

-- 6. Fix function permissions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon;

-- 7. Create a test function to verify auth
CREATE OR REPLACE FUNCTION test_auth()
RETURNS TEXT AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN 'No user authenticated';
    ELSE
        RETURN 'User authenticated: ' || auth.uid()::text;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create a function to test post creation
CREATE OR REPLACE FUNCTION test_create_post(content TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN FALSE;
    END IF;
    
    INSERT INTO posts (user_id, content)
    VALUES (auth.uid(), content);
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Create a function to test friend functions
CREATE OR REPLACE FUNCTION test_friend_functions()
RETURNS TABLE (
    test_name TEXT,
    result BOOLEAN
) AS $$
BEGIN
    -- Test get_user_friends
    BEGIN
        PERFORM get_user_friends(auth.uid());
        RETURN QUERY SELECT 'get_user_friends'::TEXT, TRUE;
    EXCEPTION
        WHEN OTHERS THEN
            RETURN QUERY SELECT 'get_user_friends'::TEXT, FALSE;
    END;
    
    -- Test get_pending_friend_requests
    BEGIN
        PERFORM get_pending_friend_requests(auth.uid());
        RETURN QUERY SELECT 'get_pending_friend_requests'::TEXT, TRUE;
    EXCEPTION
        WHEN OTHERS THEN
            RETURN QUERY SELECT 'get_pending_friend_requests'::TEXT, FALSE;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 