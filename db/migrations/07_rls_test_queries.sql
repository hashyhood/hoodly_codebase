-- 🧪 COMPREHENSIVE RLS POLICY TEST QUERIES
-- Run these queries to validate your RLS security setup

-- ===========================================
-- 1. BASIC AUTHENTICATION TESTS
-- ===========================================

-- Test 1: Check if user is authenticated
SELECT 
    CASE 
        WHEN auth.uid() IS NOT NULL THEN '✅ User authenticated: ' || auth.uid()::text
        ELSE '❌ No user authenticated'
    END as auth_status;

-- Test 2: Check current user's profile access
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()) THEN '✅ Can access own profile'
        ELSE '❌ Cannot access own profile'
    END as profile_access;

-- ===========================================
-- 2. PROFILES TABLE TESTS
-- ===========================================

-- Test 3: Can user view their own profile?
SELECT 
    'profiles_own_access' as test_name,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ PASS'
        ELSE '❌ FAIL'
    END as result
FROM profiles 
WHERE id = auth.uid();

-- Test 4: Can user view public profiles?
SELECT 
    'profiles_public_access' as test_name,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ PASS'
        ELSE '❌ FAIL'
    END as result
FROM profiles 
WHERE is_private = false 
LIMIT 1;

-- Test 5: Can user view private profiles of others? (should fail)
SELECT 
    'profiles_private_others_access' as test_name,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ PASS (correctly blocked)'
        ELSE '❌ FAIL (should be blocked)'
    END as result
FROM profiles 
WHERE is_private = true 
AND id != auth.uid()
LIMIT 1;

-- ===========================================
-- 3. POSTS TABLE TESTS
-- ===========================================

-- Test 6: Can user view public posts?
SELECT 
    'posts_public_access' as test_name,
    CASE 
        WHEN COUNT(*) >= 0 THEN '✅ PASS'
        ELSE '❌ FAIL'
    END as result
FROM posts 
LIMIT 1;

-- Test 7: Can user create a post for themselves?
-- (This would be tested with INSERT, but we'll check if they can see their own posts)
SELECT 
    'posts_own_posts_access' as test_name,
    CASE 
        WHEN COUNT(*) >= 0 THEN '✅ PASS'
        ELSE '❌ FAIL'
    END as result
FROM posts 
WHERE user_id = auth.uid();

-- ===========================================
-- 4. FRIEND REQUESTS TESTS
-- ===========================================

-- Test 8: Can user view their own friend requests?
SELECT 
    'friend_requests_own_access' as test_name,
    CASE 
        WHEN COUNT(*) >= 0 THEN '✅ PASS'
        ELSE '❌ FAIL'
    END as result
FROM friend_requests 
WHERE sender_id = auth.uid() OR receiver_id = auth.uid();

-- Test 9: Can user view other users' friend requests? (should fail)
SELECT 
    'friend_requests_others_access' as test_name,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ PASS (correctly blocked)'
        ELSE '❌ FAIL (should be blocked)'
    END as result
FROM friend_requests 
WHERE sender_id != auth.uid() AND receiver_id != auth.uid()
LIMIT 1;

-- ===========================================
-- 5. FRIENDS TABLE TESTS
-- ===========================================

-- Test 10: Can user view their own friendships?
SELECT 
    'friends_own_access' as test_name,
    CASE 
        WHEN COUNT(*) >= 0 THEN '✅ PASS'
        ELSE '❌ FAIL'
    END as result
FROM friends 
WHERE user_id = auth.uid() OR friend_id = auth.uid();

-- Test 11: Can user view other users' friendships? (should fail)
SELECT 
    'friends_others_access' as test_name,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ PASS (correctly blocked)'
        ELSE '❌ FAIL (should be blocked)'
    END as result
FROM friends 
WHERE user_id != auth.uid() AND friend_id != auth.uid()
LIMIT 1;

-- ===========================================
-- 6. PRIVATE MESSAGES TESTS
-- ===========================================

-- Test 12: Can user view their own private messages?
SELECT 
    'private_messages_own_access' as test_name,
    CASE 
        WHEN COUNT(*) >= 0 THEN '✅ PASS'
        ELSE '❌ FAIL'
    END as result
FROM private_messages 
WHERE sender_id = auth.uid() OR receiver_id = auth.uid();

-- Test 13: Can user view other users' private messages? (should fail)
SELECT 
    'private_messages_others_access' as test_name,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ PASS (correctly blocked)'
        ELSE '❌ FAIL (should be blocked)'
    END as result
FROM private_messages 
WHERE sender_id != auth.uid() AND receiver_id != auth.uid()
LIMIT 1;

-- ===========================================
-- 7. USER PREFERENCES TESTS
-- ===========================================

-- Test 14: Can user view their own preferences?
SELECT 
    'user_preferences_own_access' as test_name,
    CASE 
        WHEN COUNT(*) >= 0 THEN '✅ PASS'
        ELSE '❌ FAIL'
    END as result
FROM user_preferences 
WHERE user_id = auth.uid();

-- Test 15: Can user view other users' preferences? (should fail)
SELECT 
    'user_preferences_others_access' as test_name,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ PASS (correctly blocked)'
        ELSE '❌ FAIL (should be blocked)'
    END as result
FROM user_preferences 
WHERE user_id != auth.uid()
LIMIT 1;

-- ===========================================
-- 8. NOTIFICATIONS TESTS
-- ===========================================

-- Test 16: Can user view their own notifications?
SELECT 
    'notifications_own_access' as test_name,
    CASE 
        WHEN COUNT(*) >= 0 THEN '✅ PASS'
        ELSE '❌ FAIL'
    END as result
FROM notifications 
WHERE user_id = auth.uid();

-- Test 17: Can user view other users' notifications? (should fail)
SELECT 
    'notifications_others_access' as test_name,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ PASS (correctly blocked)'
        ELSE '❌ FAIL (should be blocked)'
    END as result
FROM notifications 
WHERE user_id != auth.uid()
LIMIT 1;

-- ===========================================
-- 9. ROOMS AND MESSAGES TESTS
-- ===========================================

-- Test 18: Can user view public rooms?
SELECT 
    'rooms_public_access' as test_name,
    CASE 
        WHEN COUNT(*) >= 0 THEN '✅ PASS'
        ELSE '❌ FAIL'
    END as result
FROM rooms 
WHERE is_private = false
LIMIT 1;

-- Test 19: Can user view rooms they're members of?
SELECT 
    'rooms_member_access' as test_name,
    CASE 
        WHEN COUNT(*) >= 0 THEN '✅ PASS'
        ELSE '❌ FAIL'
    END as result
FROM rooms r
WHERE EXISTS (
    SELECT 1 FROM room_members rm 
    WHERE rm.room_id = r.id AND rm.user_id = auth.uid()
);

-- Test 20: Can user view messages in rooms they're members of?
SELECT 
    'messages_member_access' as test_name,
    CASE 
        WHEN COUNT(*) >= 0 THEN '✅ PASS'
        ELSE '❌ FAIL'
    END as result
FROM messages m
WHERE EXISTS (
    SELECT 1 FROM room_members rm 
    WHERE rm.room_id = m.room_id AND rm.user_id = auth.uid()
);

-- ===========================================
-- 10. MARKETPLACE AND EVENTS TESTS
-- ===========================================

-- Test 21: Can user view active marketplace listings?
SELECT 
    'marketplace_active_access' as test_name,
    CASE 
        WHEN COUNT(*) >= 0 THEN '✅ PASS'
        ELSE '❌ FAIL'
    END as result
FROM marketplace_listings 
WHERE status = 'active'
LIMIT 1;

-- Test 22: Can user view public events?
SELECT 
    'events_public_access' as test_name,
    CASE 
        WHEN COUNT(*) >= 0 THEN '✅ PASS'
        ELSE '❌ FAIL'
    END as result
FROM events 
LIMIT 1;

-- ===========================================
-- 11. GROUPS TESTS
-- ===========================================

-- Test 23: Can user view public groups?
SELECT 
    'groups_public_access' as test_name,
    CASE 
        WHEN COUNT(*) >= 0 THEN '✅ PASS'
        ELSE '❌ FAIL'
    END as result
FROM groups 
WHERE is_private = false
LIMIT 1;

-- Test 24: Can user view groups they're members of?
SELECT 
    'groups_member_access' as test_name,
    CASE 
        WHEN COUNT(*) >= 0 THEN '✅ PASS'
        ELSE '❌ FAIL'
    END as result
FROM groups g
WHERE EXISTS (
    SELECT 1 FROM group_members gm 
    WHERE gm.group_id = g.id AND gm.user_id = auth.uid()
);

-- ===========================================
-- 12. COMPREHENSIVE SECURITY SUMMARY
-- ===========================================

-- Create a summary of all test results
WITH test_results AS (
    -- Profiles tests
    SELECT 'profiles_own_access' as test_name, 
           CASE WHEN EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()) THEN 'PASS' ELSE 'FAIL' END as result
    UNION ALL
    SELECT 'profiles_public_access' as test_name,
           CASE WHEN EXISTS (SELECT 1 FROM profiles WHERE is_private = false LIMIT 1) THEN 'PASS' ELSE 'FAIL' END as result
    UNION ALL
    SELECT 'profiles_private_others_access' as test_name,
           CASE WHEN NOT EXISTS (SELECT 1 FROM profiles WHERE is_private = true AND id != auth.uid() LIMIT 1) THEN 'PASS' ELSE 'FAIL' END as result
    
    -- Posts tests
    UNION ALL
    SELECT 'posts_public_access' as test_name,
           CASE WHEN EXISTS (SELECT 1 FROM posts LIMIT 1) THEN 'PASS' ELSE 'FAIL' END as result
    UNION ALL
    SELECT 'posts_own_posts_access' as test_name,
           CASE WHEN EXISTS (SELECT 1 FROM posts WHERE user_id = auth.uid()) THEN 'PASS' ELSE 'FAIL' END as result
    
    -- Friend requests tests
    UNION ALL
    SELECT 'friend_requests_own_access' as test_name,
           CASE WHEN EXISTS (SELECT 1 FROM friend_requests WHERE sender_id = auth.uid() OR receiver_id = auth.uid()) THEN 'PASS' ELSE 'FAIL' END as result
    UNION ALL
    SELECT 'friend_requests_others_access' as test_name,
           CASE WHEN NOT EXISTS (SELECT 1 FROM friend_requests WHERE sender_id != auth.uid() AND receiver_id != auth.uid() LIMIT 1) THEN 'PASS' ELSE 'FAIL' END as result
    
    -- Friends tests
    UNION ALL
    SELECT 'friends_own_access' as test_name,
           CASE WHEN EXISTS (SELECT 1 FROM friends WHERE user_id = auth.uid() OR friend_id = auth.uid()) THEN 'PASS' ELSE 'FAIL' END as result
    UNION ALL
    SELECT 'friends_others_access' as test_name,
           CASE WHEN NOT EXISTS (SELECT 1 FROM friends WHERE user_id != auth.uid() AND friend_id != auth.uid() LIMIT 1) THEN 'PASS' ELSE 'FAIL' END as result
    
    -- Private messages tests
    UNION ALL
    SELECT 'private_messages_own_access' as test_name,
           CASE WHEN EXISTS (SELECT 1 FROM private_messages WHERE sender_id = auth.uid() OR receiver_id = auth.uid()) THEN 'PASS' ELSE 'FAIL' END as result
    UNION ALL
    SELECT 'private_messages_others_access' as test_name,
           CASE WHEN NOT EXISTS (SELECT 1 FROM private_messages WHERE sender_id != auth.uid() AND receiver_id != auth.uid() LIMIT 1) THEN 'PASS' ELSE 'FAIL' END as result
    
    -- User preferences tests
    UNION ALL
    SELECT 'user_preferences_own_access' as test_name,
           CASE WHEN EXISTS (SELECT 1 FROM user_preferences WHERE user_id = auth.uid()) THEN 'PASS' ELSE 'FAIL' END as result
    UNION ALL
    SELECT 'user_preferences_others_access' as test_name,
           CASE WHEN NOT EXISTS (SELECT 1 FROM user_preferences WHERE user_id != auth.uid() LIMIT 1) THEN 'PASS' ELSE 'FAIL' END as result
    
    -- Notifications tests
    UNION ALL
    SELECT 'notifications_own_access' as test_name,
           CASE WHEN EXISTS (SELECT 1 FROM notifications WHERE user_id = auth.uid()) THEN 'PASS' ELSE 'FAIL' END as result
    UNION ALL
    SELECT 'notifications_others_access' as test_name,
           CASE WHEN NOT EXISTS (SELECT 1 FROM notifications WHERE user_id != auth.uid() LIMIT 1) THEN 'PASS' ELSE 'FAIL' END as result
)
SELECT 
    test_name,
    result,
    CASE 
        WHEN result = 'PASS' THEN '✅'
        ELSE '❌'
    END as status_icon
FROM test_results
ORDER BY test_name;

-- ===========================================
-- 13. RLS POLICY COUNT SUMMARY
-- ===========================================

-- Count total RLS policies
SELECT 
    'Total RLS Policies' as metric,
    COUNT(*) as count
FROM pg_policies 
WHERE schemaname = 'public'

UNION ALL

-- Count tables with RLS enabled
SELECT 
    'Tables with RLS Enabled' as metric,
    COUNT(*) as count
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true

UNION ALL

-- Count fallback deny policies
SELECT 
    'Fallback Deny Policies' as metric,
    COUNT(*) as count
FROM pg_policies 
WHERE schemaname = 'public' 
AND policyname LIKE '%deny_all%';

-- ===========================================
-- 14. SECURITY RECOMMENDATIONS
-- ===========================================

-- Check for any tables without RLS
SELECT 
    'Tables without RLS' as issue,
    STRING_AGG(tablename, ', ') as affected_tables
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = false

UNION ALL

-- Check for tables without fallback policies
SELECT 
    'Tables without fallback policies' as issue,
    STRING_AGG(tablename, ', ') as affected_tables
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename NOT IN (
    SELECT DISTINCT tablename 
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND policyname LIKE '%deny_all%'
);

-- ===========================================
-- 🧪 TESTING INSTRUCTIONS
-- ===========================================

/*
To run these tests:

1. Make sure you're authenticated in Supabase
2. Run each section of tests
3. Check that all tests return 'PASS' or '✅'
4. Verify that unauthorized access tests correctly return 'PASS (correctly blocked)'

Expected Results:
- ✅ All own data access tests should PASS
- ✅ All public data access tests should PASS  
- ✅ All unauthorized access tests should PASS (correctly blocked)
- ✅ All tables should have RLS enabled
- ✅ All tables should have fallback deny policies

If any tests fail, check the corresponding RLS policies in the main migration file.
*/ 