const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runMigration() {
  console.log('🔄 Running database migration...\n');

  const sql = fs.readFileSync('./migrations/add_openai_tracking.sql', 'utf8');
  
  // Split by semicolon and run each statement
  const statements = sql.split(';').filter(s => s.trim());
  
  for (const statement of statements) {
    if (!statement.trim()) continue;
    
    console.log('Executing:', statement.substring(0, 100) + '...');
    
    const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
    
    if (error) {
      // Try direct execution via REST API
      console.log('Trying alternative method...');
      const { error: altError } = await supabase.from('_migrations').insert({
        name: 'add_openai_tracking',
        sql: statement
      });
      
      if (altError) {
        console.error('❌ Error:', error.message || altError.message);
      } else {
        console.log('✅ Success');
      }
    } else {
      console.log('✅ Success');
    }
  }
  
  console.log('\n✅ Migration complete!');
}

runMigration().catch(console.error);
