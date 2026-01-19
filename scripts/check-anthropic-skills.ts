/**
 * Check Existing Skills in Anthropic Console
 *
 * This script lists all skills available in your Anthropic workspace,
 * including both Anthropic pre-built skills and custom skills.
 *
 * Run with: npx tsx scripts/check-anthropic-skills.ts
 */

import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function main() {
  console.log('Fetching skills from Anthropic Console...\n');

  try {
    const skills = await client.beta.skills.list({
      betas: ['skills-2025-10-02']
    });

    console.log(`Total skills: ${skills.data.length}\n`);

    const customSkills = skills.data.filter(s => s.source === 'custom');
    const anthropicSkills = skills.data.filter(s => s.source === 'anthropic');

    console.log('=== Anthropic Pre-built Skills ===');
    if (anthropicSkills.length === 0) {
      console.log('  No Anthropic skills found (this may be due to API access level)');
    } else {
      anthropicSkills.forEach(skill => {
        console.log(`  ${skill.id}: ${skill.display_title}`);
      });
    }

    console.log('\n=== Custom Skills ===');
    if (customSkills.length === 0) {
      console.log('  No custom skills found in your workspace.');
    } else {
      customSkills.forEach(skill => {
        console.log(`  ID: ${skill.id}`);
        console.log(`    Title: ${skill.display_title}`);
        console.log(`    Latest Version: ${skill.latest_version}`);
        console.log(`    Created: ${skill.created_at}`);
        console.log('');
      });
    }

    // Check specifically for business valuation skill
    const bizValSkill = customSkills.find(s =>
      s.display_title?.toLowerCase().includes('business') &&
      s.display_title?.toLowerCase().includes('valuation')
    );

    if (bizValSkill) {
      console.log('\n========================================');
      console.log('Business Valuation Expert skill FOUND!');
      console.log('========================================');
      console.log(`   ID: ${bizValSkill.id}`);
      console.log(`   Title: ${bizValSkill.display_title}`);
      console.log(`   Version: ${bizValSkill.latest_version}`);
      console.log('\nAdd this to your .env.local:');
      console.log(`   BUSINESS_VALUATION_SKILL_ID=${bizValSkill.id}`);
    } else {
      console.log('\n========================================');
      console.log('Business Valuation Expert skill NOT FOUND');
      console.log('========================================');
      console.log('You need to upload it. Run:');
      console.log('   npx tsx scripts/upload-business-valuation-skill.ts');
    }

  } catch (error: any) {
    if (error.status === 401) {
      console.error('Authentication failed. Check your ANTHROPIC_API_KEY.');
    } else if (error.status === 404) {
      console.error('Skills API not available. Your API key may not have access to this beta feature.');
      console.error('Contact Anthropic to request access to the Skills API beta.');
    } else {
      console.error('Error fetching skills:', error.message);
      console.error('Full error:', error);
    }
    process.exit(1);
  }
}

main();
