/**
 * Export pass outputs to markdown for review
 * Run with: npx ts-node scripts/export-pass-outputs.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const REPORT_ID = '3d30340d-fa5f-40db-84e5-4089a98bd431';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PASS_NAMES: Record<string, string> = {
  'user_provided': 'User-Provided Data',
  '1': 'Pass 1: Document Classification & Company Profile',
  '2': 'Pass 2: Income Statement Extraction',
  '3': 'Pass 3: Balance Sheet Extraction',
  '4': 'Pass 4: Industry Analysis (Web Search)',
  '5': 'Pass 5: Earnings Normalization',
  '6': 'Pass 6: Risk Assessment',
  '7': 'Pass 7: Asset Approach Valuation',
  '8': 'Pass 8: Income Approach Valuation',
  '9': 'Pass 9: Market Approach Valuation',
  '10': 'Pass 10: Value Synthesis',
  '11': 'Pass 11: Report Narratives (Legacy)',
  '12': 'Pass 12: Economic Conditions (Web Search)',
  '13': 'Pass 13: Comparable Transactions (Web Search)',
  'narratives': 'Narrative Passes (11a-11k)',
};

async function exportPassOutputs() {
  console.log(`Fetching pass outputs for report ${REPORT_ID}...`);

  const { data, error } = await supabase
    .from('reports')
    .select('company_name, pass_outputs, report_data')
    .eq('id', REPORT_ID)
    .single();

  if (error) {
    console.error('Error fetching report:', error);
    process.exit(1);
  }

  if (!data) {
    console.error('Report not found');
    process.exit(1);
  }

  const { company_name, pass_outputs, report_data } = data;

  let markdown = `# Pass Outputs Review: ${company_name}\n\n`;
  markdown += `**Report ID:** ${REPORT_ID}\n`;
  markdown += `**Generated:** ${new Date().toISOString()}\n\n`;
  markdown += `---\n\n`;

  // Sort passes by key
  const sortedKeys = Object.keys(pass_outputs || {}).sort((a, b) => {
    // user_provided first, then numeric, then narratives
    if (a === 'user_provided') return -1;
    if (b === 'user_provided') return 1;
    if (a === 'narratives') return 1;
    if (b === 'narratives') return -1;
    return parseInt(a) - parseInt(b);
  });

  for (const passKey of sortedKeys) {
    const passName = PASS_NAMES[passKey] || `Pass ${passKey}`;
    const passData = (pass_outputs as Record<string, unknown>)[passKey];

    markdown += `## ${passName}\n\n`;

    if (passKey === 'narratives') {
      // Handle narratives specially - they have nested structure
      const narratives = passData as Record<string, unknown>;
      const passResults = narratives?.pass_results as Record<string, unknown> || {};

      const narrativeOrder = ['11a', '11b', '11c', '11d', '11e', '11f', '11g', '11h', '11i', '11j', '11k'];
      const narrativeNames: Record<string, string> = {
        '11a': 'Executive Summary',
        '11b': 'Company Overview',
        '11c': 'Financial Analysis',
        '11d': 'Industry Analysis',
        '11e': 'Risk Assessment',
        '11f': 'Asset Approach',
        '11g': 'Income Approach',
        '11h': 'Market Approach',
        '11i': 'Valuation Synthesis',
        '11j': 'Assumptions & Conditions',
        '11k': 'Value Enhancement',
      };

      for (const nKey of narrativeOrder) {
        const nData = passResults[nKey] as Record<string, unknown>;
        if (nData) {
          markdown += `### ${nKey}: ${narrativeNames[nKey]}\n\n`;

          if (nData.content) {
            markdown += `**Content:**\n\n${nData.content}\n\n`;
          }
          if (nData.word_count) {
            markdown += `**Word Count:** ${nData.word_count}\n\n`;
          }

          // Include other fields as JSON
          const otherFields = { ...nData };
          delete otherFields.content;
          delete otherFields.word_count;
          delete otherFields.section;

          if (Object.keys(otherFields).length > 0) {
            markdown += `**Additional Data:**\n\`\`\`json\n${JSON.stringify(otherFields, null, 2)}\n\`\`\`\n\n`;
          }
        }
      }
    } else {
      // Standard pass - output as formatted JSON
      markdown += `\`\`\`json\n${JSON.stringify(passData, null, 2)}\n\`\`\`\n\n`;
    }

    markdown += `---\n\n`;
  }

  // Also include report_data summary
  markdown += `## Aggregated Report Data (report_data)\n\n`;
  markdown += `\`\`\`json\n${JSON.stringify(report_data, null, 2)}\n\`\`\`\n\n`;

  // Write to file
  const outputPath = `./pass-outputs-${REPORT_ID.slice(0, 8)}.md`;
  fs.writeFileSync(outputPath, markdown);
  console.log(`\nExported to: ${outputPath}`);
  console.log(`File size: ${(markdown.length / 1024).toFixed(1)} KB`);
}

exportPassOutputs().catch(console.error);
