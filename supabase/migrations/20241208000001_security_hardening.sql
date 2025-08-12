-- Security Hardening Migration
-- IMMEDIATE ACTION REQUIRED: Rotate Supabase keys in dashboard
-- This migration implements principle of least privilege

-- Revoke overly broad permissions
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated;

-- Grant minimal necessary permissions (Principle of Least Privilege)
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Authenticated users can perform CRUD operations on tables
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- Anonymous users can only read public data
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Authenticated users can use sequences for ID generation
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Only authenticated users can execute functions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Ensure RLS is enabled on all tables (only on tables that exist)
DO $$
DECLARE
    table_record RECORD;
BEGIN
    FOR table_record IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN (
            'profiles', 'rooms', 'messages', 'dm_threads', 'dm_messages',
            'posts', 'comments', 'reactions', 'notifications', 'device_tokens',
            'follows', 'events'
        )
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_record.tablename);
    END LOOP;
END $$;

-- Add comment for security audit
COMMENT ON SCHEMA public IS 'Security hardened schema - RLS enabled, minimal grants applied';

-- Log security changes (create audit table if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.audit_log (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    action TEXT NOT NULL,
    table_name TEXT,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert security hardening record
INSERT INTO public.audit_log (action, table_name, details, created_at)
VALUES (
    'SECURITY_HARDENING',
    'SCHEMA',
    'Applied principle of least privilege - narrowed SQL grants, enabled RLS',
    NOW()
);
