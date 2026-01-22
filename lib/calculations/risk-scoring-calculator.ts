/**
 * Risk Scoring Calculator
 *
 * Deterministic risk scoring based on predefined rubrics.
 * Converts qualitative risk factors into quantitative scores.
 */

import {
  RiskScoringRubric,
  ScoredRiskFactor,
  RiskScoringResult,
} from './extended-types';

import { safeNumber } from './utils';

// ============================================
// RISK SCORING RUBRICS
// ============================================

export const RISK_RUBRICS: RiskScoringRubric[] = [
  // Customer Concentration
  {
    factor_name: 'Customer Concentration',
    thresholds: [
      { condition: 'Top customer < 10%', max_value: 0.10, score: 2, rating: 'Low', multiple_impact: 0 },
      { condition: 'Top customer 10-20%', min_value: 0.10, max_value: 0.20, score: 4, rating: 'Moderate', multiple_impact: -0.05 },
      { condition: 'Top customer 20-30%', min_value: 0.20, max_value: 0.30, score: 6, rating: 'High', multiple_impact: -0.10 },
      { condition: 'Top customer 30-50%', min_value: 0.30, max_value: 0.50, score: 8, rating: 'High', multiple_impact: -0.15 },
      { condition: 'Top customer > 50%', min_value: 0.50, score: 10, rating: 'Critical', multiple_impact: -0.25 },
    ],
    weight: 0.15,
  },

  // Revenue Trend
  {
    factor_name: 'Revenue Trend',
    thresholds: [
      { condition: 'Growth > 15%', min_value: 0.15, score: 2, rating: 'Low', multiple_impact: 0.10 },
      { condition: 'Growth 5-15%', min_value: 0.05, max_value: 0.15, score: 3, rating: 'Low', multiple_impact: 0.05 },
      { condition: 'Growth 0-5%', min_value: 0, max_value: 0.05, score: 5, rating: 'Moderate', multiple_impact: 0 },
      { condition: 'Decline 0-10%', min_value: -0.10, max_value: 0, score: 7, rating: 'High', multiple_impact: -0.10 },
      { condition: 'Decline > 10%', max_value: -0.10, score: 9, rating: 'Critical', multiple_impact: -0.20 },
    ],
    weight: 0.15,
  },

  // Owner Dependence
  {
    factor_name: 'Owner Dependence',
    thresholds: [
      { condition: 'Low - Strong management team', max_value: 2, score: 2, rating: 'Low', multiple_impact: 0 },
      { condition: 'Moderate - Some key person risk', min_value: 2, max_value: 4, score: 5, rating: 'Moderate', multiple_impact: -0.05 },
      { condition: 'High - Owner critical to operations', min_value: 4, max_value: 7, score: 7, rating: 'High', multiple_impact: -0.10 },
      { condition: 'Critical - Owner is the business', min_value: 7, score: 9, rating: 'Critical', multiple_impact: -0.20 },
    ],
    weight: 0.12,
  },

  // Industry Risk
  {
    factor_name: 'Industry Risk',
    thresholds: [
      { condition: 'Stable/Growing industry', max_value: 3, score: 2, rating: 'Low', multiple_impact: 0 },
      { condition: 'Mature industry', min_value: 3, max_value: 5, score: 4, rating: 'Moderate', multiple_impact: -0.03 },
      { condition: 'Cyclical industry', min_value: 5, max_value: 7, score: 6, rating: 'High', multiple_impact: -0.07 },
      { condition: 'Declining/Disrupted industry', min_value: 7, score: 8, rating: 'Critical', multiple_impact: -0.15 },
    ],
    weight: 0.10,
  },

  // Profit Margin Stability
  {
    factor_name: 'Profit Margin Stability',
    thresholds: [
      { condition: 'Stable or improving margins', max_value: 0.05, score: 2, rating: 'Low', multiple_impact: 0.03 },
      { condition: 'Minor fluctuation < 10%', min_value: 0.05, max_value: 0.10, score: 4, rating: 'Moderate', multiple_impact: 0 },
      { condition: 'Moderate fluctuation 10-20%', min_value: 0.10, max_value: 0.20, score: 6, rating: 'High', multiple_impact: -0.05 },
      { condition: 'High volatility > 20%', min_value: 0.20, score: 8, rating: 'Critical', multiple_impact: -0.12 },
    ],
    weight: 0.10,
  },

  // Debt Level
  {
    factor_name: 'Debt Level',
    thresholds: [
      { condition: 'D/E < 0.25', max_value: 0.25, score: 2, rating: 'Low', multiple_impact: 0.03 },
      { condition: 'D/E 0.25-0.50', min_value: 0.25, max_value: 0.50, score: 4, rating: 'Moderate', multiple_impact: 0 },
      { condition: 'D/E 0.50-1.00', min_value: 0.50, max_value: 1.00, score: 6, rating: 'High', multiple_impact: -0.05 },
      { condition: 'D/E > 1.00', min_value: 1.00, score: 8, rating: 'Critical', multiple_impact: -0.12 },
    ],
    weight: 0.08,
  },

  // Working Capital Position
  {
    factor_name: 'Working Capital',
    thresholds: [
      { condition: 'Strong positive WC', min_value: 1.5, score: 2, rating: 'Low', multiple_impact: 0.02 },
      { condition: 'Adequate WC', min_value: 1.0, max_value: 1.5, score: 4, rating: 'Moderate', multiple_impact: 0 },
      { condition: 'Tight WC', min_value: 0.8, max_value: 1.0, score: 6, rating: 'High', multiple_impact: -0.05 },
      { condition: 'Negative/Critical WC', max_value: 0.8, score: 8, rating: 'Critical', multiple_impact: -0.10 },
    ],
    weight: 0.08,
  },

  // Geographic Concentration
  {
    factor_name: 'Geographic Concentration',
    thresholds: [
      { condition: 'National/Multi-region', max_value: 2, score: 2, rating: 'Low', multiple_impact: 0 },
      { condition: 'Regional presence', min_value: 2, max_value: 5, score: 4, rating: 'Moderate', multiple_impact: -0.02 },
      { condition: 'Single metro area', min_value: 5, max_value: 7, score: 6, rating: 'High', multiple_impact: -0.05 },
      { condition: 'Single location dependent', min_value: 7, score: 8, rating: 'Critical', multiple_impact: -0.10 },
    ],
    weight: 0.07,
  },

  // Supplier Concentration
  {
    factor_name: 'Supplier Concentration',
    thresholds: [
      { condition: 'Diverse supplier base', max_value: 0.20, score: 2, rating: 'Low', multiple_impact: 0 },
      { condition: 'Some key suppliers', min_value: 0.20, max_value: 0.40, score: 4, rating: 'Moderate', multiple_impact: -0.03 },
      { condition: 'Concentrated suppliers', min_value: 0.40, max_value: 0.60, score: 6, rating: 'High', multiple_impact: -0.07 },
      { condition: 'Single source dependent', min_value: 0.60, score: 8, rating: 'Critical', multiple_impact: -0.12 },
    ],
    weight: 0.07,
  },

  // Technology/Obsolescence Risk
  {
    factor_name: 'Technology Risk',
    thresholds: [
      { condition: 'Modern/Updated technology', max_value: 3, score: 2, rating: 'Low', multiple_impact: 0.02 },
      { condition: 'Adequate technology', min_value: 3, max_value: 5, score: 4, rating: 'Moderate', multiple_impact: 0 },
      { condition: 'Aging technology', min_value: 5, max_value: 7, score: 6, rating: 'High', multiple_impact: -0.05 },
      { condition: 'Obsolete systems', min_value: 7, score: 8, rating: 'Critical', multiple_impact: -0.10 },
    ],
    weight: 0.08,
  },
];

// ============================================
// SCORING FUNCTIONS
// ============================================

/**
 * Score a single risk factor using its rubric
 */
export function scoreRiskFactor(
  rubric: RiskScoringRubric,
  rawValue: number,
  category: string = 'General'
): ScoredRiskFactor {
  // Find matching threshold
  let matchedThreshold = rubric.thresholds[rubric.thresholds.length - 1]; // Default to last (worst)

  for (const threshold of rubric.thresholds) {
    const meetsMin = threshold.min_value === undefined || rawValue >= threshold.min_value;
    const meetsMax = threshold.max_value === undefined || rawValue < threshold.max_value;

    if (meetsMin && meetsMax) {
      matchedThreshold = threshold;
      break;
    }
  }

  return {
    factor_name: rubric.factor_name,
    category,
    raw_value: rawValue,
    score: matchedThreshold.score,
    rating: matchedThreshold.rating,
    multiple_impact: matchedThreshold.multiple_impact,
    weighted_score: matchedThreshold.score * rubric.weight,
    description: matchedThreshold.condition,
    mitigation_suggestion: getMitigationSuggestion(rubric.factor_name, matchedThreshold.rating),
  };
}

function getMitigationSuggestion(factorName: string, rating: string): string | undefined {
  if (rating === 'Low') return undefined;

  const suggestions: Record<string, string> = {
    'Customer Concentration': 'Diversify customer base by targeting new market segments or expanding marketing efforts.',
    'Revenue Trend': 'Analyze declining trends and implement growth strategies such as new products, markets, or pricing adjustments.',
    'Owner Dependence': 'Document processes, cross-train employees, and develop a management succession plan.',
    'Industry Risk': 'Monitor industry trends closely and consider diversification or pivot strategies.',
    'Profit Margin Stability': 'Implement cost controls, improve pricing strategy, and stabilize input costs.',
    'Debt Level': 'Consider debt reduction strategies, refinancing, or improved cash management.',
    'Working Capital': 'Improve collections, negotiate better payment terms, or optimize inventory levels.',
    'Geographic Concentration': 'Explore expansion opportunities or develop remote service capabilities.',
    'Supplier Concentration': 'Identify and qualify alternative suppliers to reduce single-source risk.',
    'Technology Risk': 'Develop a technology upgrade roadmap and budget for necessary investments.',
  };

  return suggestions[factorName];
}

// ============================================
// MAIN CALCULATION FUNCTION
// ============================================

export interface RiskScoringInputs {
  // Financial metrics for automatic scoring
  customer_concentration?: number; // Top customer as % of revenue
  revenue_growth_rate?: number; // YoY growth
  owner_dependence_score?: number; // 1-10 manual score
  industry_risk_score?: number; // 1-10 manual score
  margin_volatility?: number; // Std dev of margins
  debt_to_equity?: number;
  current_ratio?: number;
  geographic_concentration_score?: number; // 1-10 manual score
  supplier_concentration?: number; // Top supplier as % of purchases
  technology_risk_score?: number; // 1-10 manual score

  // Override rubrics if needed
  custom_rubrics?: RiskScoringRubric[];
}

/**
 * Calculate complete risk scoring
 */
export function calculateRiskScoring(inputs: RiskScoringInputs): RiskScoringResult {
  const rubrics = inputs.custom_rubrics || RISK_RUBRICS;
  const factors: ScoredRiskFactor[] = [];

  // Map inputs to rubrics
  const inputMapping: Record<string, number | undefined> = {
    'Customer Concentration': inputs.customer_concentration,
    'Revenue Trend': inputs.revenue_growth_rate,
    'Owner Dependence': inputs.owner_dependence_score,
    'Industry Risk': inputs.industry_risk_score,
    'Profit Margin Stability': inputs.margin_volatility,
    'Debt Level': inputs.debt_to_equity,
    'Working Capital': inputs.current_ratio,
    'Geographic Concentration': inputs.geographic_concentration_score,
    'Supplier Concentration': inputs.supplier_concentration,
    'Technology Risk': inputs.technology_risk_score,
  };

  // Score each factor
  for (const rubric of rubrics) {
    const rawValue = inputMapping[rubric.factor_name];
    if (rawValue !== undefined && rawValue !== null) {
      const category = getCategoryForFactor(rubric.factor_name);
      factors.push(scoreRiskFactor(rubric, rawValue, category));
    }
  }

  // Calculate category averages
  const categories = Array.from(new Set(factors.map(f => f.category)));
  const category_scores = categories.map(cat => {
    const catFactors = factors.filter(f => f.category === cat);
    const avgScore = catFactors.reduce((sum, f) => sum + f.score, 0) / catFactors.length;
    return {
      category: cat,
      average_score: Math.round(avgScore * 10) / 10,
      rating: getCategoryRating(avgScore),
    };
  });

  // Calculate overall score (weighted average)
  const totalWeight = factors.reduce((sum, f) => {
    const rubric = rubrics.find(r => r.factor_name === f.factor_name);
    return sum + (rubric?.weight || 0.1);
  }, 0);

  const weightedSum = factors.reduce((sum, f) => sum + f.weighted_score, 0);
  const overall_risk_score = totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 10) / 10 : 5;

  // Calculate combined multiple impact
  const recommended_multiple_adjustment = factors.reduce((sum, f) => sum + f.multiple_impact, 0);

  // Calculate company-specific risk premium for cap rate (scale 0-10% based on score)
  const company_specific_risk_premium = Math.max(0, (overall_risk_score - 3) * 0.015);

  // Sort factors for top risks/strengths
  const sortedByScore = [...factors].sort((a, b) => b.score - a.score);
  const top_risks = sortedByScore.filter(f => f.score >= 6).slice(0, 3);
  const top_strengths = [...factors].sort((a, b) => a.score - b.score).filter(f => f.score <= 4).slice(0, 3);

  return {
    factors,
    category_scores,
    overall_risk_score,
    overall_risk_rating: getOverallRating(overall_risk_score) as 'Low' | 'Moderate' | 'High' | 'Very High',
    company_specific_risk_premium,
    recommended_multiple_adjustment: Math.round(recommended_multiple_adjustment * 100) / 100,
    top_risks,
    top_strengths,
    calculated_at: new Date().toISOString(),
  };
}

function getCategoryForFactor(factorName: string): string {
  const categoryMap: Record<string, string> = {
    'Customer Concentration': 'Market Risk',
    'Revenue Trend': 'Financial Risk',
    'Owner Dependence': 'Operational Risk',
    'Industry Risk': 'Market Risk',
    'Profit Margin Stability': 'Financial Risk',
    'Debt Level': 'Financial Risk',
    'Working Capital': 'Financial Risk',
    'Geographic Concentration': 'Market Risk',
    'Supplier Concentration': 'Operational Risk',
    'Technology Risk': 'Operational Risk',
  };
  return categoryMap[factorName] || 'General';
}

function getCategoryRating(score: number): 'Low' | 'Moderate' | 'High' | 'Critical' {
  if (score <= 3) return 'Low';
  if (score <= 5) return 'Moderate';
  if (score <= 7) return 'High';
  return 'Critical';
}

function getOverallRating(score: number): 'Low' | 'Moderate' | 'High' | 'Very High' {
  if (score <= 3) return 'Low';
  if (score <= 5) return 'Moderate';
  if (score <= 7) return 'High';
  return 'Very High';
}
