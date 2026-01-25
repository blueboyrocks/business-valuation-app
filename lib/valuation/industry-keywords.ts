/**
 * Industry Keywords - Blocklists and Required Keywords by Industry
 *
 * This module defines keywords that should NOT appear in reports for specific industries
 * (to catch wrong industry references) and keywords that SHOULD appear.
 */

// ============ TYPES ============

export interface IndustryKeywordSet {
  naics_code: string;
  industry_name: string;
  blocked_keywords: string[];
  required_keywords: string[];
  related_terms: string[];
}

// ============ KEYWORD DEFINITIONS ============

/**
 * Keywords that should NOT appear for Engineering Services (541330)
 */
export const ENGINEERING_BLOCKED_KEYWORDS = [
  // HVAC and Trades
  'hvac',
  'heating',
  'ventilation',
  'air conditioning',
  'plumbing',
  'plumber',
  'electrician',
  'electrical contractor',

  // Food Service
  'restaurant',
  'food service',
  'catering',
  'bakery',
  'cafe',
  'bar',
  'tavern',

  // Retail
  'retail store',
  'retail shop',
  'convenience store',
  'grocery',

  // Personal Services
  'hair salon',
  'beauty salon',
  'barber',
  'spa',
  'nail salon',
  'massage',

  // Healthcare
  'medical practice',
  'dental practice',
  'dentist',
  'physician',
  'clinic',
  'healthcare provider',
  'veterinary',
  'veterinarian',

  // Legal & Accounting
  'law firm',
  'legal services',
  'attorney',
  'accounting firm',
  'cpa firm',
  'bookkeeper',

  // Construction Trades (different from engineering)
  'roofing',
  'roofer',
  'landscaping',
  'landscaper',
  'painting contractor',
  'flooring',
  'carpet installation',

  // Auto
  'auto repair',
  'car wash',
  'auto body',
  'tire shop',

  // Fitness & Recreation
  'gym',
  'fitness center',
  'yoga studio',
  'martial arts',

  // Hospitality
  'hotel',
  'motel',
  'bed and breakfast',
  'inn',
];

/**
 * Keywords that SHOULD appear for Engineering Services (541330)
 */
export const ENGINEERING_REQUIRED_KEYWORDS = [
  'engineering',
  'design',
  'consulting',
  'professional services',
];

/**
 * Related terms for Engineering Services (541330) - acceptable
 */
export const ENGINEERING_RELATED_TERMS = [
  'civil',
  'structural',
  'mechanical',
  'electrical engineering',
  'environmental',
  'survey',
  'surveying',
  'geotechnical',
  'architecture',
  'cad',
  'drafting',
  'infrastructure',
  'construction management',
  'project management',
  'technical',
  'blueprint',
  'specifications',
  'pe license',
  'professional engineer',
];

// ============ INDUSTRY KEYWORD SETS ============

export const INDUSTRY_KEYWORD_SETS: Record<string, IndustryKeywordSet> = {
  '541330': {
    naics_code: '541330',
    industry_name: 'Engineering Services',
    blocked_keywords: ENGINEERING_BLOCKED_KEYWORDS,
    required_keywords: ENGINEERING_REQUIRED_KEYWORDS,
    related_terms: ENGINEERING_RELATED_TERMS,
  },
  '541211': {
    naics_code: '541211',
    industry_name: 'Offices of Certified Public Accountants',
    blocked_keywords: [
      'restaurant',
      'food service',
      'retail',
      'manufacturing',
      'hvac',
      'plumbing',
      'construction',
      'medical',
      'dental',
      'engineering',
    ],
    required_keywords: ['accounting', 'cpa', 'tax', 'audit', 'financial'],
    related_terms: [
      'bookkeeping',
      'payroll',
      'financial statements',
      'tax return',
      'assurance',
      'advisory',
    ],
  },
  '722511': {
    naics_code: '722511',
    industry_name: 'Full-Service Restaurants',
    blocked_keywords: [
      'engineering',
      'consulting',
      'law firm',
      'accounting',
      'dental',
      'medical',
      'software',
      'manufacturing',
      'construction',
    ],
    required_keywords: ['restaurant', 'dining', 'food'],
    related_terms: [
      'menu',
      'kitchen',
      'chef',
      'waiter',
      'server',
      'bar',
      'cuisine',
      'meals',
      'catering',
    ],
  },
  '238220': {
    naics_code: '238220',
    industry_name: 'Plumbing, Heating, and Air-Conditioning Contractors',
    blocked_keywords: [
      'restaurant',
      'food service',
      'retail',
      'software',
      'law firm',
      'accounting',
      'dental',
      'medical',
      'engineering services',
    ],
    required_keywords: ['hvac', 'plumbing', 'heating', 'cooling', 'contractor'],
    related_terms: [
      'air conditioning',
      'furnace',
      'boiler',
      'ductwork',
      'piping',
      'water heater',
      'installation',
      'repair',
      'maintenance',
    ],
  },
  '541511': {
    naics_code: '541511',
    industry_name: 'Custom Computer Programming Services',
    blocked_keywords: [
      'restaurant',
      'food service',
      'retail',
      'hvac',
      'plumbing',
      'dental',
      'medical',
      'law firm',
      'accounting',
    ],
    required_keywords: ['software', 'programming', 'development', 'technology'],
    related_terms: [
      'code',
      'application',
      'web',
      'mobile',
      'database',
      'cloud',
      'saas',
      'api',
      'developer',
    ],
  },
};

// ============ HELPER FUNCTIONS ============

/**
 * Get keyword set for a NAICS code
 */
export function getKeywordSetForNAICS(naicsCode: string): IndustryKeywordSet | null {
  return INDUSTRY_KEYWORD_SETS[naicsCode] || null;
}

/**
 * Get all blocked keywords for a NAICS code
 */
export function getBlockedKeywords(naicsCode: string): string[] {
  const keywordSet = INDUSTRY_KEYWORD_SETS[naicsCode];
  return keywordSet?.blocked_keywords || [];
}

/**
 * Get all required keywords for a NAICS code
 */
export function getRequiredKeywords(naicsCode: string): string[] {
  const keywordSet = INDUSTRY_KEYWORD_SETS[naicsCode];
  return keywordSet?.required_keywords || [];
}

/**
 * Check if a keyword is blocked for a specific industry
 */
export function isKeywordBlocked(naicsCode: string, keyword: string): boolean {
  const blocked = getBlockedKeywords(naicsCode);
  const lowerKeyword = keyword.toLowerCase();

  return blocked.some((blocked) => {
    const lowerBlocked = blocked.toLowerCase();
    // Check for exact match or partial match
    return lowerKeyword.includes(lowerBlocked) || lowerBlocked.includes(lowerKeyword);
  });
}

/**
 * Find all blocked keywords in text
 */
export function findBlockedKeywordsInText(naicsCode: string, text: string): string[] {
  const blocked = getBlockedKeywords(naicsCode);
  const lowerText = text.toLowerCase();
  const found: string[] = [];

  for (const keyword of blocked) {
    if (lowerText.includes(keyword.toLowerCase())) {
      found.push(keyword);
    }
  }

  return found;
}

/**
 * Check if text contains at least one required keyword
 */
export function hasRequiredKeyword(naicsCode: string, text: string): boolean {
  const required = getRequiredKeywords(naicsCode);
  const lowerText = text.toLowerCase();

  return required.some((keyword) => lowerText.includes(keyword.toLowerCase()));
}

/**
 * Get default keyword set for unknown industries
 */
export function getDefaultKeywordSet(): IndustryKeywordSet {
  return {
    naics_code: '000000',
    industry_name: 'General Business',
    blocked_keywords: [],
    required_keywords: [],
    related_terms: [],
  };
}
