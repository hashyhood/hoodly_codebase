// Simple test script to verify Supabase connection
// Run this with: node test-supabase.js

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ikeocbgjivpifvwzllkm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrZW9jYmdqaXZwaWZ2d3psbGttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzMzkwMDMsImV4cCI6MjA2NzkxNTAwM30.qUuQhufz_ddMI0c__i7SovJZVU74TXQc1OPOV99aRl0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase connection...\n');

  try {
    // Test basic connection
    console.log('1. Testing basic connection...');
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    if (error) throw error;
    console.log('✅ Connection successful!\n');

    // Check existing tables
    console.log('2. Checking required tables...');
    const tables = ['profiles', 'posts', 'events', 'marketplace_listings', 'groups', 'messages', 'private_messages'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select('count').limit(1);
        if (error) {
          console.log(`❌ Table '${table}' not found or inaccessible`);
        } else {
          console.log(`✅ Table '${table}' exists and accessible`);
        }
      } catch (err) {
        console.log(`❌ Table '${table}' error:`, err.message);
      }
    }
    console.log('');

    // Check auth users
    console.log('3. Checking auth users...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
      console.log('❌ Cannot access auth users (admin access required)');
    } else {
      console.log(`✅ Found ${authUsers.users.length} auth users`);
      authUsers.users.forEach(user => {
        console.log(`   - ${user.email} (${user.id}) - Created: ${user.created_at}`);
      });
    }
    console.log('');

    // Check profiles
    console.log('4. Checking profiles...');
    const { data: profiles, error: profilesError } = await supabase.from('profiles').select('*');
    if (profilesError) {
      console.log('❌ Error accessing profiles:', profilesError.message);
    } else {
      console.log(`✅ Found ${profiles.length} profiles`);
      profiles.forEach(profile => {
        console.log(`   - ${profile.full_name} (${profile.id}) - Email: ${profile.email}`);
      });
    }
    console.log('');

    // Check for orphaned auth users (users without profiles)
    console.log('5. Checking for orphaned users...');
    if (authUsers && profiles) {
      const authUserIds = authUsers.users.map(u => u.id);
      const profileUserIds = profiles.map(p => p.id);
      const orphanedUsers = authUserIds.filter(id => !profileUserIds.includes(id));
      
      if (orphanedUsers.length > 0) {
        console.log(`⚠️  Found ${orphanedUsers.length} auth users without profiles:`);
        orphanedUsers.forEach(id => {
          const authUser = authUsers.users.find(u => u.id === id);
          console.log(`   - ${authUser.email} (${id})`);
        });
        console.log('\n💡 These users will get stuck on loading screen!');
      } else {
        console.log('✅ All auth users have corresponding profiles');
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testSupabaseConnection(); 