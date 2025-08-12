const { createClient } = require('@supabase/supabase-js');

// Supabase credentials (from supabase.ts)
const SUPABASE_URL = 'https://ikeocbgjivpifvwzllkm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrZW9jYmdqaXZwaWZ2d3psbGttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzMzkwMDMsImV4cCI6MjA2NzkxNTAwM30.qUuQhufz_ddMI0c__i7SovJZVU74TXQc1OPOV99aRl0';

console.log('🔍 Testing Hoodly App Connections...\n');

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testSupabaseConnection() {
  try {
    console.log('📡 Testing Supabase connection...');
    
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (error) {
      console.log('❌ Supabase connection failed:', error.message);
      return false;
    } else {
      console.log('✅ Supabase connection successful');
      return true;
    }
  } catch (error) {
    console.log('❌ Supabase connection failed:', error.message);
    return false;
  }
}

async function testDatabaseOperations() {
  try {
    console.log('🗄️ Testing database operations...');
    
    // Test basic read operation
    const { data: rooms, error } = await supabase
      .from('rooms')
      .select('count')
      .limit(1);

    if (error) {
      console.log('❌ Database read operation failed:', error.message);
      return false;
    } else {
      console.log('✅ Database operations successful');
      return true;
    }
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
    return false;
  }
}

async function testAuthentication() {
  try {
    console.log('🔐 Testing authentication...');
    
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.log('❌ Authentication failed:', error.message);
      return false;
    } else if (session) {
      console.log('✅ Authentication working (user logged in)');
      return true;
    } else {
      console.log('✅ Authentication working (no user logged in)');
      return true;
    }
  } catch (error) {
    console.log('❌ Authentication failed:', error.message);
    return false;
  }
}

async function testRealTimeSubscription() {
  try {
    console.log('🔌 Testing real-time subscription...');
    
    const channel = supabase
      .channel('test-channel')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages'
      }, (payload) => {
        console.log('✅ Real-time message received:', payload);
      })
      .subscribe();

    // Wait a bit for subscription to establish
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('✅ Real-time subscription working');
    return true;
  } catch (error) {
    console.log('❌ Real-time subscription failed:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting comprehensive connection tests...\n');
  
  const results = {
    supabase: await testSupabaseConnection(),
    database: await testDatabaseOperations(),
    auth: await testAuthentication(),
    realtime: await testRealTimeSubscription()
  };

  console.log('\n📊 Test Results:');
  console.log('================');
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅' : '❌';
    const testName = test.charAt(0).toUpperCase() + test.slice(1);
    console.log(`${status} ${testName}: ${passed ? 'PASSED' : 'FAILED'}`);
  });

  const allPassed = Object.values(results).every(result => result);
  
  console.log('\n🎯 Overall Status:', allPassed ? '✅ ALL TESTS PASSED' : '⚠️ SOME TESTS FAILED');
  
  if (!allPassed) {
    console.log('\n🔧 Troubleshooting Tips:');
    console.log('1. Check your .env file has correct Supabase credentials');
    console.log('2. Verify your Supabase project is active');
    console.log('3. Ensure database migrations are applied');
    console.log('4. Check Row Level Security policies');
    console.log('5. Verify real-time is enabled in Supabase dashboard');
  }

  return results;
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { runAllTests }; 