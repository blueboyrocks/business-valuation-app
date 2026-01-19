/**
 * Upload Business Valuation Expert Skill to Anthropic
 *
 * This script uploads the business-valuation-expert skill folder to your Anthropic workspace.
 *
 * Prerequisites:
 * - The skill folder must exist at ./skills/business-valuation-expert/
 * - The folder must contain a SKILL.md file
 *
 * Run with: npx tsx scripts/upload-business-valuation-skill.ts
 */

import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, relative } from 'path';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SKILL_PATH = './skills/business-valuation-expert';

function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
  const files = readdirSync(dirPath);

  files.forEach(file => {
    const filePath = join(dirPath, file);
    if (statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else {
      arrayOfFiles.push(filePath);
    }
  });

  return arrayOfFiles;
}

function getMimeType(filename: string): string {
  if (filename.endsWith('.md')) return 'text/markdown';
  if (filename.endsWith('.py')) return 'text/x-python';
  if (filename.endsWith('.ts')) return 'text/typescript';
  if (filename.endsWith('.js')) return 'text/javascript';
  if (filename.endsWith('.json')) return 'application/json';
  if (filename.endsWith('.yaml') || filename.endsWith('.yml')) return 'text/yaml';
  if (filename.endsWith('.txt')) return 'text/plain';
  return 'text/plain';
}

async function uploadSkill() {
  console.log('Uploading Business Valuation Expert skill...\n');

  // Check if skill folder exists
  if (!existsSync(SKILL_PATH)) {
    console.error(`Error: Skill folder not found at ${SKILL_PATH}`);
    console.error('\nTo create the skill folder, run:');
    console.error('   npx tsx scripts/create-skill-structure.ts');
    process.exit(1);
  }

  // Check if SKILL.md exists
  if (!existsSync(join(SKILL_PATH, 'SKILL.md'))) {
    console.error('Error: SKILL.md not found in skill folder');
    console.error('Every skill must have a SKILL.md file at the root');
    process.exit(1);
  }

  try {
    // Get all files in the skill directory
    const allFiles = getAllFiles(SKILL_PATH);

    console.log(`Found ${allFiles.length} files to upload:`);

    // Create file tuples (filename, content, mime_type)
    const fileTuples: Array<[string, Buffer, string]> = allFiles.map(filePath => {
      const relativePath = relative('.', filePath).replace(/\\/g, '/');
      const content = readFileSync(filePath);
      const mimeType = getMimeType(filePath);

      console.log(`  - ${relativePath} (${content.length} bytes, ${mimeType})`);
      return [relativePath, content, mimeType];
    });

    // Calculate total size
    const totalSize = fileTuples.reduce((sum, [_, content]) => sum + content.length, 0);
    console.log(`\nTotal size: ${(totalSize / 1024).toFixed(2)} KB`);

    if (totalSize > 8 * 1024 * 1024) {
      console.error('Error: Total size exceeds 8MB limit');
      process.exit(1);
    }

    console.log('\nUploading to Anthropic...');

    // Upload to Anthropic
    const skill = await client.beta.skills.create({
      display_title: 'Business Valuation Expert',
      files: fileTuples as any,
      betas: ['skills-2025-10-02']
    });

    console.log('\n========================================');
    console.log('Skill uploaded successfully!');
    console.log('========================================');
    console.log(`   ID: ${skill.id}`);
    console.log(`   Title: ${skill.display_title}`);
    console.log(`   Version: ${skill.latest_version}`);
    console.log(`   Created: ${skill.created_at}`);

    console.log('\nAdd this to your .env.local:');
    console.log(`   BUSINESS_VALUATION_SKILL_ID=${skill.id}`);

    console.log('\nAdd this to Vercel environment variables:');
    console.log('   Settings → Environment Variables → Add');
    console.log(`   BUSINESS_VALUATION_SKILL_ID = ${skill.id}`);

    return skill;

  } catch (error: any) {
    console.error('\nError uploading skill:', error.message);

    if (error.status === 401) {
      console.error('Authentication failed. Check your ANTHROPIC_API_KEY.');
    } else if (error.status === 400) {
      console.error('Bad request. Check that SKILL.md has valid YAML frontmatter.');
      console.error('Full error:', error);
    } else {
      console.error('Full error:', error);
    }

    process.exit(1);
  }
}

uploadSkill();
