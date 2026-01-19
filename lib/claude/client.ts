/**
 * Claude API Client Configuration
 * 
 * This module sets up the Anthropic Claude client for the Business Valuation App.
 * It replaces the OpenAI client configuration.
 */

import Anthropic from '@anthropic-ai/sdk';

// Initialize Anthropic client
let anthropicClient: Anthropic | null = null;

export function getClaudeClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      throw new Error(
        'ANTHROPIC_API_KEY is not set. Please add it to your environment variables in Vercel.'
      );
    }

    anthropicClient = new Anthropic({
      apiKey: apiKey,
    });
  }

  return anthropicClient;
}

// Model configuration
export const CLAUDE_MODEL = 'claude-sonnet-4-20250514';
export const MAX_TOKENS = 8192;

// Retry configuration for API calls
export const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
};

/**
 * Call Claude API with automatic retry and exponential backoff
 */
export async function callClaudeWithRetry(
  params: Anthropic.MessageCreateParams,
  retries = RETRY_CONFIG.maxRetries
): Promise<Anthropic.Message> {
  const client = getClaudeClient();
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await client.messages.create(params);
      return response;
    } catch (error: any) {
      console.error(`Claude API error (attempt ${attempt + 1}/${retries + 1}):`, error.message);
      
      // Handle rate limits with exponential backoff
      if (error.status === 429) {
        const delay = Math.min(
          RETRY_CONFIG.initialDelayMs * Math.pow(2, attempt),
          RETRY_CONFIG.maxDelayMs
        );
        console.log(`Rate limited. Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // Handle overloaded errors
      if (error.status === 529) {
        const delay = 5000;
        console.log(`API overloaded. Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // If we've exhausted retries or it's a non-retryable error, throw
      if (attempt === retries) {
        throw error;
      }
    }
  }
  
  throw new Error('Max retries exceeded for Claude API call');
}

/**
 * Convert a PDF buffer to base64 for Claude's document format
 */
export function pdfToClaudeDocument(pdfBuffer: Buffer): Anthropic.DocumentBlockParam {
  const base64Data = pdfBuffer.toString('base64');
  
  return {
    type: 'document',
    source: {
      type: 'base64',
      media_type: 'application/pdf',
      data: base64Data,
    },
  };
}

/**
 * Extract tool use results from Claude's response
 */
export function extractToolUse(response: Anthropic.Message): {
  toolName: string;
  toolInput: any;
  toolId: string;
} | null {
  for (const block of response.content) {
    if (block.type === 'tool_use') {
      return {
        toolName: block.name,
        toolInput: block.input,
        toolId: block.id,
      };
    }
  }
  return null;
}

/**
 * Extract text content from Claude's response
 */
export function extractTextContent(response: Anthropic.Message): string {
  const textBlocks = response.content
    .filter(block => block.type === 'text')
    .map(block => (block as Anthropic.TextBlock).text);
  
  return textBlocks.join('\n');
}
