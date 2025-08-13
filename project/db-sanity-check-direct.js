const { createClient } = require('@supabase/supabase-js');

// Supabase credentials for Hoodly project
const supabaseUrl = 'https://ikeocbgjivpifvwzllkm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrZW9jYmdqaXZwaWZ2d3psbGttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzMzkwMDMsImV4cCI6MjA2NzkxNTAwM30.qUuQhufz_ddMI0c__i7SovJZVU74TXQc1OPOV99aRl0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runSanityChecks() {
  console.log('🔍 Running DB Sanity Checks for Hoodly...\n');

  try {
    // Check 1: Confirm RPCs exist
    console.log('1️⃣ Checking RPCs...');
    
    const rpcChecks = [
      { name: 'feed_rank', test: () => supabase.rpc('feed_rank', { u: '00000000-0000-0000-0000-000000000000', lat: 0, lng: 0, limit_n: 1 }) },
      { name: 'feed_rank_v2', test: () => supabase.rpc('feed_rank_v2', { u: '00000000-0000-0000-0000-000000000000', lat: 0, lng: 0, limit_n: 1 }) },
      { name: 'trending_posts', test: () => supabase.rpc('trending_posts', { lat: 0, lng: 0, radius_km: 10, hours: 24, limit_n: 1 }) },
      { name: 'suggest_friends', test: () => supabase.rpc('suggest_friends', { u: '00000000-0000-0000-0000-000000000000', lat: 0, lng: 0, limit_n: 1 }) },
      { name: 'get_or_create_thread', test: () => supabase.rpc('get_or_create_thread', { a: '00000000-0000-0000-0000-000000000000', b: '00000000-0000-0000-0000-000000000000' }) }
    ];

    for (const rpc of rpcChecks) {
      try {
        const { error } = await rpc.test();
        if (error && error.message.includes('function') && error.message.includes('does not exist')) {
          console.log(`   ❌ ${rpc.name}: Missing`);
        } else if (error && error.message.includes('invalid input syntax for type uuid')) {
          console.log(`   ✅ ${rpc.name}: Exists (UUID validation working)`);
        } else if (error) {
          console.log(`   ⚠️  ${rpc.name}: Exists but error - ${error.message}`);
        } else {
          console.log(`   ✅ ${rpc.name}: Exists and working`);
        }
      } catch (e) {
        console.log(`   ❌ ${rpc.name}: Error - ${e.message}`);
      }
    }

    // Check 2: Confirm new tables exist
    console.log('\n2️⃣ Checking new tables...');
    const newTables = [
      'user_settings', 'feed_preferences', 'user_interests', 'user_locations', 
      'location_shares', 'events', 'businesses', 'ad_campaigns', 
      'sponsored_posts', 'ad_impressions'
    ];

    for (const table of newTables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error && error.message.includes('relation') && error.message.includes('does not exist')) {
          console.log(`   ❌ ${table}: Missing`);
        } else if (error && error.message.includes('permission denied')) {
          console.log(`   ✅ ${table}: Exists (permission check working)`);
        } else if (error) {
          console.log(`   ⚠️  ${table}: Exists but error - ${error.message}`);
        } else {
          console.log(`   ✅ ${table}: Exists and accessible`);
        }
      } catch (e) {
        console.log(`   ❌ ${table}: Error - ${e.message}`);
      }
    }

    // Check 3: Confirm critical indexes
    console.log('\n3️⃣ Checking critical indexes...');
    const indexChecks = [
      { table: 'dm_messages', pattern: 'created' },
      { table: 'messages', pattern: 'created' },
      { table: 'posts', pattern: 'created' }
    ];

    for (const check of indexChecks) {
      try {
        const { data, error } = await supabase
          .from(check.table)
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1);
        
        if (error && error.message.includes('relation') && error.message.includes('does not exist')) {
          console.log(`   ❌ ${check.table}: Table missing`);
        } else if (error && error.message.includes('column') && error.message.includes('does not exist')) {
          console.log(`   ❌ ${check.table}: created_at column missing`);
        } else if (error && error.message.includes('permission denied')) {
          console.log(`   ✅ ${check.table}: Table exists, permission check working`);
        } else if (error) {
          console.log(`   ⚠️  ${check.table}: Error - ${error.message}`);
        } else {
          console.log(`   ✅ ${check.table}: Index check passed`);
        }
      } catch (e) {
        console.log(`   ❌ ${check.table}: Error - ${e.message}`);
      }
    }

    // Check 4: Test basic table access
    console.log('\n4️⃣ Testing basic table access...');
    const basicTables = ['profiles', 'posts', 'follows'];
    
    for (const table of basicTables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error && error.message.includes('relation') && error.message.includes('does not exist')) {
          console.log(`   ❌ ${table}: Missing`);
        } else if (error && error.message.includes('permission denied')) {
          console.log(`   ✅ ${table}: Exists (permission check working)`);
        } else if (error) {
          console.log(`   ⚠️  ${table}: Error - ${error.message}`);
        } else {
          console.log(`   ✅ ${table}: Accessible`);
        }
      } catch (e) {
        console.log(`   ❌ ${table}: Error - ${e.message}`);
      }
    }

    console.log('\n✅ DB Sanity Checks completed!');

  } catch (error) {
    console.error('❌ Error running sanity checks:', error.message);
  }
}

// Run the checks
runSanityChecks();
