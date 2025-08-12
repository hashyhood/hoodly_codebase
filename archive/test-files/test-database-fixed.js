const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = "https://ikeocbgjivpifvwzllkm.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrZW9jYmdqaXZwaWZ2d3psbGttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzMzkwMDMsImV4cCI6MjA2NzkxNTAwM30.qUuQhufz_ddMI0c__i7SovJZVU74TXQc1OPOV99aRl0";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testDatabase() {
  console.log('🔍 Testing Hoodly Database State...\n');

  // 1. Test table existence
  console.log('1. Checking table existence...');
  const tables = [
    'profiles', 'posts', 'comments', 'likes', 'events', 'event_rsvps',
    'marketplace_listings', 'groups', 'group_members', 'group_posts',
    'notifications', 'messages', 'private_messages', 'rooms', 'room_members',
    'friends', 'friend_requests', 'user_locations', 'user_preferences'
  ];

  for (const table of tables) {
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

  // 2. Test profiles table structure
  console.log('\n2. Checking profiles table structure...');
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (error) {
      console.log(`❌ Profiles query error: ${error.message}`);
    } else {
      console.log(`✅ Found ${data.length} profiles`);
      if (data.length > 0) {
        const fields = Object.keys(data[0]);
        console.log(`   Sample profile fields: [ ${fields.map(f => `'${f}'`).join(', ')} ]`);
        
        const requiredFields = ['id', 'email', 'full_name', 'created_at', 'updated_at'];
        for (const field of requiredFields) {
          if (fields.includes(field)) {
            console.log(`   ✅ Field ${field}: OK`);
          } else {
            console.log(`   ❌ Missing field: ${field}`);
          }
        }
      }
    }
  } catch (err) {
    console.log(`❌ Profiles structure error: ${err.message}`);
  }

  // 3. Test authentication
  console.log('\n3. Testing authentication...');
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.log(`❌ Auth error: ${error.message}`);
    } else if (user) {
      console.log(`✅ User authenticated: ${user.email}`);
    } else {
      console.log('⚠️  No user authenticated (this is normal for testing)');
    }
  } catch (err) {
    console.log(`❌ Auth test error: ${err.message}`);
  }

  // 4. Test RLS policies
  console.log('\n4. Testing RLS policies...');
  try {
    // Test public data access (should work without auth)
    const { data: publicProfiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .limit(1);
    
    if (profileError) {
      console.log(`❌ Public profiles access: ${profileError.message}`);
    } else {
      console.log(`✅ Public profiles access: OK (${publicProfiles.length} profiles)`);
    }

    // Test rooms access
    const { data: publicRooms, error: roomError } = await supabase
      .from('rooms')
      .select('id, name')
      .limit(1);
    
    if (roomError) {
      console.log(`❌ Public rooms access: ${roomError.message}`);
    } else {
      console.log(`✅ Public rooms access: OK (${publicRooms.length} rooms)`);
    }
  } catch (err) {
    console.log(`❌ RLS test error: ${err.message}`);
  }

  // 5. Test function calls
  console.log('\n5. Testing database functions...');
  try {
    // Test auth function
    const { data: authTest, error: authTestError } = await supabase
      .rpc('test_auth');
    
    if (authTestError) {
      console.log(`❌ Auth function test: ${authTestError.message}`);
    } else {
      console.log(`✅ Auth function test: ${authTest}`);
    }

    // Test friend functions (will fail without auth, but should not crash)
    const { data: friendTest, error: friendTestError } = await supabase
      .rpc('test_friend_functions');
    
    if (friendTestError) {
      console.log(`❌ Friend functions test: ${friendTestError.message}`);
    } else {
      console.log(`✅ Friend functions test: OK`);
      if (friendTest && friendTest.length > 0) {
        friendTest.forEach(test => {
          console.log(`   ${test.test_name}: ${test.result ? '✅' : '❌'}`);
        });
      }
    }
  } catch (err) {
    console.log(`❌ Function test error: ${err.message}`);
  }

  // 6. Test post creation (will fail without auth, but should not crash)
  console.log('\n6. Testing post creation...');
  try {
    const { data: postTest, error: postTestError } = await supabase
      .rpc('test_create_post', { content: 'Test post from database test' });
    
    if (postTestError) {
      console.log(`❌ Post creation test: ${postTestError.message}`);
    } else {
      console.log(`✅ Post creation test: ${postTest ? 'Success' : 'Failed (no auth)'}`);
    }
  } catch (err) {
    console.log(`❌ Post creation error: ${err.message}`);
  }

  // 7. Test data insertion (without auth)
  console.log('\n7. Testing basic data operations...');
  try {
    // Test reading existing data
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('id, content')
      .limit(5);
    
    if (postsError) {
      console.log(`❌ Posts read test: ${postsError.message}`);
    } else {
      console.log(`✅ Posts read test: OK (${posts.length} posts found)`);
    }

    // Test reading events
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, title')
      .limit(5);
    
    if (eventsError) {
      console.log(`❌ Events read test: ${eventsError.message}`);
    } else {
      console.log(`✅ Events read test: OK (${events.length} events found)`);
    }
  } catch (err) {
    console.log(`❌ Data operations error: ${err.message}`);
  }

  console.log('\n🎉 Database test completed!');
  console.log('\n📝 Summary:');
  console.log('- If you see mostly ✅ marks, your database is working correctly');
  console.log('- ❌ marks indicate issues that need to be fixed');
  console.log('- ⚠️  marks are warnings (like no user being authenticated)');
  console.log('\n💡 Next steps:');
  console.log('1. If you see auth errors, try logging in to your app first');
  console.log('2. If you see RLS errors, the policies might need adjustment');
  console.log('3. If you see function errors, check the function definitions');
}

testDatabase().catch(console.error); 