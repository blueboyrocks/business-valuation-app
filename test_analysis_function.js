/**
 * Analysis function that can be called directly without HTTP
 */

const { createClient } = require('@supabase/supabase-js');
const FormData = require('form-data');
const fetch = require('node-fetch');

require('dotenv').config({ path: '.env.local' });

// Override system env vars
process.env.OPENAI_API_KEY = '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';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function processAnalysis(reportId) {
  console.log(`   Starting analysis for report: ${reportId}`);
  
  // This will trigger the async processing via the API endpoint
  const response = await fetch('http://localhost:3000/api/analyze-documents', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` // Use service key
    },
    body: JSON.stringify({ reportId })
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Analysis API failed: ${response.status} - ${error}`);
  }
  
  const result = await response.json();
  console.log(`   ✅ ${result.message}`);
  
  return result;
}

module.exports = { processAnalysis };
