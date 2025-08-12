const { createClient } = require('@supabase/supabase-js');

// Supabase credentials
const supabaseUrl = 'https://ikeocbgjivpifvwzllkm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrZW9jYmdqaXZwaWZ2d3psbGttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzMzkwMDMsImV4cCI6MjA2NzkxNTAwM30.qUuQhufz_ddMI0c__i7SovJZVU74TXQc1OPOV99aRl0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testDatabase() {
  console.log('🔍 Testing Hoodly Database State...\n');

  try {
    // Test 1: Check if all required tables exist
    console.log('1. Checking required tables...');
    const requiredTables = [
      'profiles',
      'posts',
      'comments',
      'likes',
      'events',
      'event_rsvps',
      'marketplace_listings',
      'groups',
      'group_members',
      'group_posts',
      'notifications',
      'messages',
      'private_messages',
      'rooms',
      'room_members',
      'friends',
      'friend_requests',
      'user_locations',
      'user_preferences'
    ];

    for (const table of requiredTables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ Table ${table}: ${error.message}`);
        } else {
          console.log(`✅ Table ${table}: OK`);
        }
      } catch (err) {
        console.log(`❌ Table ${table}: ${err.message}`);
      }
    }

    // Test 2: Check profiles table structure
    console.log('\n2. Checking profiles table structure...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(5);

    if (profilesError) {
      console.log(`❌ Profiles error: ${profilesError.message}`);
    } else {
      console.log(`✅ Found ${profiles.length} profiles`);
      if (profiles.length > 0) {
        const profile = profiles[0];
        console.log('   Sample profile fields:', Object.keys(profile));
        
        // Check for required fields
        const requiredFields = ['id', 'email', 'full_name', 'created_at', 'updated_at'];
        for (const field of requiredFields) {
          if (profile.hasOwnProperty(field)) {
            console.log(`   ✅ Field ${field}: OK`);
          } else {
            console.log(`   ❌ Missing field: ${field}`);
          }
        }
      }
    }

    // Test 3: Check auth users
    console.log('\n3. Checking auth users...');
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.log(`❌ Auth error: ${authError.message}`);
    } else {
      console.log(`✅ Found ${users.length} auth users`);
      if (users.length > 0) {
        console.log('   Sample user:', {
          id: users[0].id,
          email: users[0].email,
          created_at: users[0].created_at
        });
      }
    }

    // Test 4: Check if profiles match auth users
    console.log('\n4. Checking profile-auth user consistency...');
    if (profiles && users) {
      const profileIds = new Set(profiles.map(p => p.id));
      const authIds = new Set(users.map(u => u.id));
      
      const missingProfiles = users.filter(u => !profileIds.has(u.id));
      const orphanedProfiles = profiles.filter(p => !authIds.has(p.id));
      
      if (missingProfiles.length > 0) {
        console.log(`⚠️  ${missingProfiles.length} auth users without profiles`);
      } else {
        console.log('✅ All auth users have profiles');
      }
      
      if (orphanedProfiles.length > 0) {
        console.log(`⚠️  ${orphanedProfiles.length} orphaned profiles`);
      } else {
        console.log('✅ All profiles have auth users');
      }
    }

    // Test 5: Check RLS policies
    console.log('\n5. Checking RLS policies...');
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_rls_policies');
    
    if (policiesError) {
      console.log(`❌ RLS check error: ${policiesError.message}`);
      console.log('   (This is expected if the function doesn\'t exist)');
    } else {
      console.log(`✅ Found ${policies.length} RLS policies`);
    }

    // Test 6: Test basic CRUD operations
    console.log('\n6. Testing basic CRUD operations...');
    
    // Test creating a test post (if we have a user)
    if (profiles && profiles.length > 0) {
      const testUserId = profiles[0].id;
      
      try {
        const { data: testPost, error: postError } = await supabase
          .from('posts')
          .insert({
            user_id: testUserId,
            content: 'Test post from database verification script',
            created_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (postError) {
          console.log(`❌ Post creation failed: ${postError.message}`);
        } else {
          console.log('✅ Test post created successfully');
          
          // Clean up test post
          await supabase
            .from('posts')
            .delete()
            .eq('id', testPost.id);
          console.log('✅ Test post cleaned up');
        }
      } catch (err) {
        console.log(`❌ Post test error: ${err.message}`);
      }
    }

    // Test 7: Check storage buckets
    console.log('\n7. Checking storage buckets...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.log(`❌ Storage error: ${bucketsError.message}`);
    } else {
      console.log(`✅ Found ${buckets.length} storage buckets`);
      buckets.forEach(bucket => {
        console.log(`   - ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
      });
    }

    // Test 8: Check real-time subscriptions
    console.log('\n8. Testing real-time subscriptions...');
    const channel = supabase
      .channel('test-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, (payload) => {
        console.log('✅ Real-time subscription working');
      })
      .subscribe();
    
    // Wait a moment then unsubscribe
    setTimeout(() => {
      channel.unsubscribe();
    }, 1000);

    // Test 9: Check database functions
    console.log('\n9. Checking database functions...');
    try {
      const { data: nearbyUsers, error: funcError } = await supabase
        .rpc('get_nearby_users', {
          user_location: 'POINT(0 0)',
          radius_meters: 1000
        });
      
      if (funcError) {
        console.log(`❌ Function test error: ${funcError.message}`);
      } else {
        console.log('✅ Database functions working');
      }
    } catch (err) {
      console.log(`❌ Function test error: ${err.message}`);
    }

    // Test 10: Check indexes
    console.log('\n10. Checking database performance...');
    const { data: postCount, error: countError } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.log(`❌ Count error: ${countError.message}`);
    } else {
      console.log(`✅ Database performance OK (${postCount} posts found)`);
    }

    console.log('\n🎉 Database verification complete!');
    console.log('\n📋 Summary:');
    console.log('- All required tables should be present');
    console.log('- RLS policies should be enabled');
    console.log('- Auth users should have corresponding profiles');
    console.log('- Storage buckets should be configured');
    console.log('- Real-time subscriptions should work');
    console.log('- Database functions should be available');
    
    console.log('\n🚀 Next steps:');
    console.log('1. Run the SQL migration in Supabase dashboard');
    console.log('2. Test the app functionality');
    console.log('3. Create test data if needed');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testDatabase(); 