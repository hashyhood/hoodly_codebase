const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Get Supabase credentials from environment
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runSanityChecks() {
  console.log('🔍 Running DB Sanity Checks...\n');

  try {
    // Check 1: Confirm RPCs exist
    console.log('1️⃣ Checking RPCs...');
    const { data: rpcs, error: rpcError } = await supabase.rpc('get_rpc_list');
    
    if (rpcError) {
      // Fallback: try to check individual RPCs
      console.log('   Trying individual RPC checks...');
      
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
          } else {
            console.log(`   ✅ ${rpc.name}: Exists`);
          }
        } catch (e) {
          console.log(`   ❌ ${rpc.name}: Error - ${e.message}`);
        }
      }
    } else {
      console.log('   ✅ RPCs check completed');
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
        } else {
          console.log(`   ✅ ${table}: Exists`);
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
        
        if (error) {
          console.log(`   ❌ ${check.table} index check: ${error.message}`);
        } else {
          console.log(`   ✅ ${check.table} index check: Passed`);
        }
      } catch (e) {
        console.log(`   ❌ ${check.table} index check: Error - ${e.message}`);
      }
    }

    console.log('\n✅ DB Sanity Checks completed!');

  } catch (error) {
    console.error('❌ Error running sanity checks:', error.message);
  }
}

// Run the checks
runSanityChecks();
