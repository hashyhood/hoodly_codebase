# 🛡️ Supabase RLS Security Documentation

## Overview

This document outlines the comprehensive Row Level Security (RLS) setup for the Hoodly social app. All tables are secured with proper RLS policies to ensure data privacy and prevent unauthorized access.

## 📋 Security Principles

### 1. **Default Deny**
- All tables have fallback `SELECT FALSE` policies
- Access is only granted through specific, explicit policies
- No accidental data exposure

### 2. **User Isolation**
- Users can only access their own data
- Private data is completely isolated between users
- Public data is accessible to all authenticated users

### 3. **Principle of Least Privilege**
- Users get minimum required permissions
- Admin/moderator roles have elevated privileges only where needed
- No unnecessary access granted

## 🗂️ Table Security Matrix

| Table | RLS Enabled | Public Read | Own Data | Admin Access | Notes |
|-------|-------------|-------------|----------|--------------|-------|
| `profiles` | ✅ | ✅ (public only) | ✅ | ❌ | Private profiles hidden |
| `posts` | ✅ | ✅ | ✅ | ❌ | All users can read posts |
| `messages` | ✅ | ❌ | ✅ (room members) | ✅ | Room-based access |
| `private_messages` | ✅ | ❌ | ✅ (participants) | ❌ | Direct message privacy |
| `rooms` | ✅ | ✅ (public) | ✅ (members) | ✅ | Creator controls |
| `room_members` | ✅ | ❌ | ✅ (members) | ✅ | Admin management |
| `friends` | ✅ | ❌ | ✅ (participants) | ❌ | Mutual friendship only |
| `friend_requests` | ✅ | ❌ | ✅ (participants) | ❌ | Sender/receiver only |
| `user_locations` | ✅ | ❌ | ✅ | ❌ | Personal location only |
| `user_preferences` | ✅ | ❌ | ✅ | ❌ | Personal settings only |
| `notifications` | ✅ | ❌ | ✅ | ✅ | System can create |
| `comments` | ✅ | ✅ | ✅ | ❌ | Public comments |
| `likes` | ✅ | ✅ | ✅ | ❌ | Public likes |
| `events` | ✅ | ✅ | ✅ | ❌ | Public events |
| `marketplace_listings` | ✅ | ✅ (active) | ✅ | ❌ | Active listings only |
| `groups` | ✅ | ✅ (public) | ✅ (members) | ✅ | Creator controls |
| `group_members` | ✅ | ❌ | ✅ (members) | ✅ | Admin management |
| `group_posts` | ✅ | ❌ | ✅ (members) | ❌ | Group members only |

## 🔐 Policy Details

### Profiles Table
```sql
-- Users can view public profiles or their own private profile
CREATE POLICY "profiles_select_public_or_own" ON profiles
    FOR SELECT USING (
        NOT is_private OR 
        auth.uid() = id
    );

-- Users can manage only their own profile
CREATE POLICY "profiles_manage_own" ON profiles
    FOR ALL USING (auth.uid() = id);
```

### Posts Table
```sql
-- All users can view posts (public content)
CREATE POLICY "posts_select_public" ON posts
    FOR SELECT USING (true);

-- Users can manage only their own posts
CREATE POLICY "posts_manage_own" ON posts
    FOR ALL USING (auth.uid() = user_id);
```

### Private Messages Table
```sql
-- Users can view messages they sent or received
CREATE POLICY "private_messages_select_participants" ON private_messages
    FOR SELECT USING (
        auth.uid() = sender_id OR 
        auth.uid() = receiver_id
    );

-- Users can send messages only as themselves
CREATE POLICY "private_messages_insert_sender" ON private_messages
    FOR INSERT WITH CHECK (auth.uid() = sender_id);
```

### Friend Requests Table
```sql
-- Users can view requests they sent or received
CREATE POLICY "friend_requests_select_participants" ON friend_requests
    FOR SELECT USING (
        auth.uid() = sender_id OR 
        auth.uid() = receiver_id
    );

-- Only receivers can update (accept/reject) requests
CREATE POLICY "friend_requests_update_receiver" ON friend_requests
    FOR UPDATE USING (auth.uid() = receiver_id);
```

## 🧪 Testing Procedures

### 1. Run Security Tests
Execute the test queries in `07_rls_test_queries.sql`:

```sql
-- Basic authentication test
SELECT 
    CASE 
        WHEN auth.uid() IS NOT NULL THEN '✅ User authenticated'
        ELSE '❌ No user authenticated'
    END as auth_status;

-- Test own profile access
SELECT COUNT(*) FROM profiles WHERE id = auth.uid();

-- Test unauthorized access (should return 0)
SELECT COUNT(*) FROM user_preferences WHERE user_id != auth.uid();
```

### 2. Expected Test Results
- ✅ All own data access tests should PASS
- ✅ All public data access tests should PASS  
- ✅ All unauthorized access tests should PASS (correctly blocked)
- ✅ All tables should have RLS enabled
- ✅ All tables should have fallback deny policies

### 3. Security Validation Commands
```sql
-- Check RLS status
SELECT * FROM rls_enabled_tables;

-- Count policies
SELECT * FROM security_audit_summary;

-- Test security functions
SELECT * FROM test_rls_security();
SELECT * FROM test_unauthorized_access();
```

## 🚨 Security Monitoring

### Views Available
- `security_policy_usage` - Monitor RLS policy usage
- `rls_enabled_tables` - Show all tables with RLS enabled
- `security_audit_summary` - Comprehensive security status

### Key Metrics to Monitor
- Total RLS policies (should be > 50)
- Tables with RLS enabled (should be all tables)
- Fallback deny policies (should be all tables)
- Failed unauthorized access attempts

## 🔧 Maintenance Procedures

### Adding New Tables
1. Enable RLS: `ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;`
2. Add fallback policy: `CREATE POLICY "new_table_deny_all" ON new_table FOR ALL USING (false);`
3. Add specific policies for required access
4. Update test queries
5. Run security validation

### Updating Policies
1. Test changes in development environment
2. Use `test_rls_security()` function
3. Verify no unauthorized access is possible
4. Deploy to production
5. Run post-deployment tests

### Security Audits
Run monthly security audits:
```sql
-- Check for tables without RLS
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = false;

-- Check for missing fallback policies
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename NOT IN (
    SELECT DISTINCT tablename FROM pg_policies 
    WHERE policyname LIKE '%deny_all%'
);
```

## 🛡️ Security Best Practices

### 1. **Always Use RLS**
- Every table must have RLS enabled
- No exceptions for "public" data tables

### 2. **Fallback Policies**
- Always include `SELECT FALSE` fallback policies
- Explicit policies override fallbacks

### 3. **User Context**
- Always use `auth.uid()` for user identification
- Never trust client-side user IDs

### 4. **Test Thoroughly**
- Test both authorized and unauthorized access
- Verify edge cases and boundary conditions
- Run tests with different user roles

### 5. **Monitor Access**
- Log failed access attempts
- Monitor policy performance
- Regular security audits

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] All tables have RLS enabled
- [ ] All tables have fallback deny policies
- [ ] Specific policies cover all required access patterns
- [ ] Security tests pass
- [ ] Performance impact assessed

### Post-Deployment
- [ ] Run comprehensive security tests
- [ ] Verify application functionality
- [ ] Monitor for access errors
- [ ] Check performance metrics
- [ ] Document any policy adjustments

## 📞 Security Contacts

For security issues or questions:
1. Review this documentation
2. Check the test queries
3. Run security validation functions
4. Contact the development team

## 🔒 Security Status

**Current Status**: ✅ SECURED
- All tables have RLS enabled
- All tables have fallback deny policies
- Comprehensive test coverage
- Regular security monitoring

**Last Audit**: [Date of last security audit]
**Next Audit**: [Date of next scheduled audit]

---

*This security setup ensures maximum protection of user data while maintaining application functionality. All policies are designed to be maintainable and testable.* 