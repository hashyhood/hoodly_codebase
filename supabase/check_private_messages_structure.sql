-- Check the exact structure of private_messages table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'private_messages'
ORDER BY ordinal_position;

-- Also check private_conversations structure
SELECT 
    'private_conversations' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'private_conversations'
ORDER BY ordinal_position;
