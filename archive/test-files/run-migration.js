const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://ikeocbgjivpifvwzllkm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrZW9jYmdqaXZwaWZ2d3psbGttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzMzkwMDMsImV4cCI6MjA2NzkxNTAwM30.qUuQhufz_ddMI0c__i7SovJZVU74TXQc1OPOV99aRl0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runMigration() {
  console.log('🚀 Running Supabase migration...\n');

  try {
    // Read the migration SQL file
    const migrationSQL = fs.readFileSync('./supabase-migrations.sql', 'utf8');
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        if (error) {
          console.log(`⚠️  Statement ${i + 1} had an issue:`, error.message);
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      } catch (err) {
        console.log(`❌ Statement ${i + 1} failed:`, err.message);
      }
    }

    console.log('\n🎉 Migration completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Test the app again');
    console.log('2. Try logging in with your new user');
    console.log('3. Test the chat functionality');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.log('\n💡 Alternative: You can run the SQL manually in your Supabase dashboard:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Click on "SQL Editor"');
    console.log('3. Copy and paste the contents of supabase-migrations.sql');
    console.log('4. Click "Run"');
  }
}

runMigration(); 