-- 🔧 FIX FOREIGN KEY CONSTRAINT NAMES
-- Ensure foreign key constraints have correct names for Supabase PostgREST

-- ===========================================
-- 1. FIX FRIENDS TABLE FOREIGN KEYS
-- ===========================================

-- Drop existing foreign key constraints if they exist
ALTER TABLE friends DROP CONSTRAINT IF EXISTS friends_user_id_fkey;
ALTER TABLE friends DROP CONSTRAINT IF EXISTS friends_friend_id_fkey;

-- Add correctly named foreign key constraints
ALTER TABLE friends 
ADD CONSTRAINT friends_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE friends 
ADD CONSTRAINT friends_friend_id_fkey 
FOREIGN KEY (friend_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- ===========================================
-- 2. FIX FRIEND_REQUESTS TABLE FOREIGN KEYS
-- ===========================================

-- Drop existing foreign key constraints if they exist
ALTER TABLE friend_requests DROP CONSTRAINT IF EXISTS friend_requests_sender_id_fkey;
ALTER TABLE friend_requests DROP CONSTRAINT IF EXISTS friend_requests_receiver_id_fkey;

-- Add correctly named foreign key constraints
ALTER TABLE friend_requests 
ADD CONSTRAINT friend_requests_sender_id_fkey 
FOREIGN KEY (sender_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE friend_requests 
ADD CONSTRAINT friend_requests_receiver_id_fkey 
FOREIGN KEY (receiver_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- ===========================================
-- 3. FIX MESSAGES TABLE FOREIGN KEYS
-- ===========================================

-- Drop existing foreign key constraints if they exist
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;

-- Add sender_id foreign key constraint if it doesn't exist
ALTER TABLE messages 
ADD CONSTRAINT messages_sender_id_fkey 
FOREIGN KEY (sender_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- ===========================================
-- 4. FIX ROOMS TABLE FOREIGN KEYS
-- ===========================================

-- Drop existing foreign key constraints if they exist
ALTER TABLE rooms DROP CONSTRAINT IF EXISTS rooms_creator_id_fkey;

-- Add creator_id foreign key constraint if it doesn't exist
ALTER TABLE rooms 
ADD CONSTRAINT rooms_creator_id_fkey 
FOREIGN KEY (creator_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- ===========================================
-- 5. VERIFY FOREIGN KEY NAMES
-- ===========================================

-- Check friends table foreign keys
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'friends';

-- Check friend_requests table foreign keys
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'friend_requests';

-- ===========================================
-- SUCCESS MESSAGE
-- ===========================================

DO $$
BEGIN
    RAISE NOTICE '🎉 FOREIGN KEY CONSTRAINTS FIXED!';
    RAISE NOTICE '✅ Friends table foreign keys properly named';
    RAISE NOTICE '✅ Friend_requests table foreign keys properly named';
    RAISE NOTICE '✅ Messages table sender_id foreign key added';
    RAISE NOTICE '✅ Rooms table creator_id foreign key added';
    RAISE NOTICE '🚀 Supabase PostgREST queries should now work!';
END $$; 