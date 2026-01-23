/**
 * NAICS Suggestion API
 *
 * Takes a business description and returns top 3 NAICS code suggestions
 * using Claude AI to match the description to appropriate codes.
 */

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

const SYSTEM_PROMPT = `You are an expert at classifying businesses into NAICS (North American Industry Classification System) codes.

Given a business description, you will suggest the top 3 most appropriate 6-digit NAICS codes.

IMPORTANT:
- Always use 6-digit NAICS codes (e.g., 541330, not 5413)
- Provide the official NAICS description for each code
- Order by relevance (best match first)
- Include a brief explanation of why each code fits
- If the description is vague, ask clarifying questions in the "clarification_needed" field

You MUST return valid JSON only. No markdown, no explanation text outside the JSON.`;

interface NAICSSuggestion {
  naics_code: string;
  naics_description: string;
  sector: string;
  match_reason: string;
  confidence: number;
}

interface SuggestResponse {
  suggestions: NAICSSuggestion[];
  clarification_needed?: string;
  parsed_business_type: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { description } = body;

    if (!description || typeof description !== 'string') {
      return NextResponse.json(
        { error: 'Business description is required' },
        { status: 400 }
      );
    }

    if (description.length < 10) {
      return NextResponse.json(
        { error: 'Please provide a more detailed business description (at least 10 characters)' },
        { status: 400 }
      );
    }

    const anthropic = new Anthropic();

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      temperature: 0.1,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Classify this business and suggest the top 3 NAICS codes:

Business Description: "${description}"

Return JSON in this exact format:
{
  "suggestions": [
    {
      "naics_code": "541330",
      "naics_description": "Engineering Services",
      "sector": "Professional, Scientific, and Technical Services",
      "match_reason": "Brief explanation of why this code fits",
      "confidence": 0.95
    }
  ],
  "clarification_needed": null or "Question if description is too vague",
  "parsed_business_type": "Your understanding of what this business does"
}`
        }
      ]
    });

    // Extract text content
    let textContent = '';
    for (const block of response.content) {
      if (block.type === 'text') {
        textContent += block.text;
      }
    }

    // Parse JSON response
    let jsonStr = textContent.trim();

    // Clean markdown if present
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.slice(7);
    }
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.slice(3);
    }
    if (jsonStr.endsWith('```')) {
      jsonStr = jsonStr.slice(0, -3);
    }
    jsonStr = jsonStr.trim();

    // Try to find JSON if not starting with {
    if (!jsonStr.startsWith('{')) {
      const match = jsonStr.match(/\{[\s\S]*\}/);
      if (match) {
        jsonStr = match[0];
      }
    }

    const result: SuggestResponse = JSON.parse(jsonStr);

    return NextResponse.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('[NAICS-SUGGEST] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to suggest NAICS codes: ${message}` },
      { status: 500 }
    );
  }
}

/**
 * GET - Return common NAICS codes for quick selection
 */
export async function GET() {
  const commonCodes = [
    { naics_code: '541330', naics_description: 'Engineering Services', sector: 'Professional Services' },
    { naics_code: '541511', naics_description: 'Custom Computer Programming Services', sector: 'Professional Services' },
    { naics_code: '541512', naics_description: 'Computer Systems Design Services', sector: 'Professional Services' },
    { naics_code: '541611', naics_description: 'Administrative Management Consulting', sector: 'Professional Services' },
    { naics_code: '541613', naics_description: 'Marketing Consulting Services', sector: 'Professional Services' },
    { naics_code: '541990', naics_description: 'Other Professional Services', sector: 'Professional Services' },
    { naics_code: '236220', naics_description: 'Commercial Building Construction', sector: 'Construction' },
    { naics_code: '238220', naics_description: 'Plumbing, Heating, AC Contractors', sector: 'Construction' },
    { naics_code: '238210', naics_description: 'Electrical Contractors', sector: 'Construction' },
    { naics_code: '423840', naics_description: 'Industrial Supplies Merchant Wholesalers', sector: 'Wholesale Trade' },
    { naics_code: '441110', naics_description: 'New Car Dealers', sector: 'Retail Trade' },
    { naics_code: '445110', naics_description: 'Supermarkets and Grocery Stores', sector: 'Retail Trade' },
    { naics_code: '722511', naics_description: 'Full-Service Restaurants', sector: 'Food Services' },
    { naics_code: '722513', naics_description: 'Limited-Service Restaurants', sector: 'Food Services' },
    { naics_code: '621111', naics_description: 'Offices of Physicians', sector: 'Health Care' },
    { naics_code: '621210', naics_description: 'Offices of Dentists', sector: 'Health Care' },
    { naics_code: '531210', naics_description: 'Offices of Real Estate Agents', sector: 'Real Estate' },
    { naics_code: '484110', naics_description: 'General Freight Trucking, Local', sector: 'Transportation' },
    { naics_code: '811111', naics_description: 'General Automotive Repair', sector: 'Other Services' },
    { naics_code: '812111', naics_description: 'Barber Shops', sector: 'Other Services' },
  ];

  return NextResponse.json({
    success: true,
    common_codes: commonCodes
  });
}
