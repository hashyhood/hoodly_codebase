-- Apply Security Grants - Run this in Supabase SQL Editor
-- This implements the principle of least privilege

-- Step 1: Revoke overly broad permissions
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated;

-- Step 2: Grant minimal necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Authenticated users can perform CRUD operations
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- Anonymous users can only read public data
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Authenticated users can use sequences for ID generation
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Only authenticated users can execute functions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Add security comment
COMMENT ON SCHEMA public IS 'Security hardened - minimal grants applied';

-- Verify the changes
SELECT 
    grantee,
    privilege_type,
    table_name
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
ORDER BY grantee, privilege_type;
