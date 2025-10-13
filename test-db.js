const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Testing Supabase connection...');
console.log('URL:', supabaseUrl);
console.log('Key length:', supabaseKey?.length);

const supabase = createClient(supabaseUrl, supabaseKey);

const timeout = setTimeout(() => {
  console.error('TIMEOUT: Query took more than 10 seconds!');
  process.exit(1);
}, 10000);

supabase
  .from('profiles')
  .select('id')
  .limit(1)
  .then(({ data, error }) => {
    clearTimeout(timeout);
    if (error) {
      console.error('ERROR:', error);
      process.exit(1);
    }
    console.log('SUCCESS! Database is working.');
    console.log('Records found:', data?.length || 0);
    process.exit(0);
  })
  .catch(err => {
    clearTimeout(timeout);
    console.error('CATCH ERROR:', err);
    process.exit(1);
  });
