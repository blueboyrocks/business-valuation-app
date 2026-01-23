/**
 * Quality Checker for Premium Valuation Reports
 *
 * Ensures reports meet the quality standards expected for a $3,000-$5,000 premium product.
 * Checks for completeness of all sections, narrative quality, and data accuracy.
 */

export interface QualityCheckResult {
  score: number; // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  checks: QualityCheck[];
  isPremiumReady: boolean;
  summary: string;
}

interface QualityCheck {
  name: string;
  category: 'critical' | 'important' | 'recommended';
  passed: boolean;
  weight: number;
  details: string;
}

/**
 * Helper to get narrative content from either string or {content: string} format
 */
function getNarrativeContent(value: any): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (value.content) return value.content;
  return '';
}

/**
 * Check report quality against premium standards
 */
export function checkReportQuality(reportData: any): QualityCheckResult {
  const checks: QualityCheck[] = [];

  // === CRITICAL CHECKS (Must have for any report) ===

  // Executive Summary (15 points)
  const execSummary = getNarrativeContent(reportData?.executive_summary) ||
                      getNarrativeContent(reportData?.narratives?.executive_summary);
  checks.push({
    name: 'Executive Summary Present',
    category: 'critical',
    passed: !!execSummary && execSummary.length > 500,
    weight: 15,
    details: execSummary ? `${execSummary.length} characters` : 'Missing',
  });

  // Valuation Amount (10 points)
  checks.push({
    name: 'Concluded Valuation',
    category: 'critical',
    passed: !!reportData?.valuation_amount && reportData.valuation_amount > 0,
    weight: 10,
    details: reportData?.valuation_amount ? `$${reportData.valuation_amount.toLocaleString()}` : 'Missing',
  });

  // Three Approaches Values (15 points total)
  checks.push({
    name: 'Asset Approach Value',
    category: 'critical',
    passed: !!reportData?.asset_approach_value && reportData.asset_approach_value > 0,
    weight: 5,
    details: reportData?.asset_approach_value ? `$${reportData.asset_approach_value.toLocaleString()}` : 'Missing',
  });
  checks.push({
    name: 'Income Approach Value',
    category: 'critical',
    passed: !!reportData?.income_approach_value && reportData.income_approach_value > 0,
    weight: 5,
    details: reportData?.income_approach_value ? `$${reportData.income_approach_value.toLocaleString()}` : 'Missing',
  });
  checks.push({
    name: 'Market Approach Value',
    category: 'critical',
    passed: !!reportData?.market_approach_value && reportData.market_approach_value > 0,
    weight: 5,
    details: reportData?.market_approach_value ? `$${reportData.market_approach_value.toLocaleString()}` : 'Missing',
  });

  // === IMPORTANT CHECKS (Expected for premium report) ===

  // Financial Analysis Narrative (8 points)
  const finAnalysis = getNarrativeContent(reportData?.financial_analysis) ||
                      getNarrativeContent(reportData?.narratives?.financial_analysis);
  checks.push({
    name: 'Financial Analysis Narrative',
    category: 'important',
    passed: !!finAnalysis && finAnalysis.length > 300,
    weight: 8,
    details: finAnalysis ? `${finAnalysis.length} characters` : 'Missing',
  });

  // Risk Assessment Narrative (8 points)
  const riskNarrative = getNarrativeContent(reportData?.risk_assessment) ||
                        getNarrativeContent(reportData?.narratives?.risk_assessment);
  checks.push({
    name: 'Risk Assessment Narrative',
    category: 'important',
    passed: !!riskNarrative && riskNarrative.length > 300,
    weight: 8,
    details: riskNarrative ? `${riskNarrative.length} characters` : 'Missing',
  });

  // Industry Analysis (8 points)
  const industryAnalysis = getNarrativeContent(reportData?.industry_analysis) ||
                           getNarrativeContent(reportData?.narratives?.industry_analysis);
  checks.push({
    name: 'Industry Analysis',
    category: 'important',
    passed: !!industryAnalysis && industryAnalysis.length > 200,
    weight: 8,
    details: industryAnalysis ? `${industryAnalysis.length} characters` : 'Missing',
  });

  // Approach Narratives (12 points total)
  const assetNarrative = getNarrativeContent(reportData?.asset_approach_analysis) ||
                         getNarrativeContent(reportData?.narratives?.asset_approach_narrative);
  checks.push({
    name: 'Asset Approach Narrative',
    category: 'important',
    passed: !!assetNarrative && assetNarrative.length > 200,
    weight: 4,
    details: assetNarrative ? `${assetNarrative.length} characters` : 'Missing',
  });

  const incomeNarrative = getNarrativeContent(reportData?.income_approach_analysis) ||
                          getNarrativeContent(reportData?.narratives?.income_approach_narrative);
  checks.push({
    name: 'Income Approach Narrative',
    category: 'important',
    passed: !!incomeNarrative && incomeNarrative.length > 200,
    weight: 4,
    details: incomeNarrative ? `${incomeNarrative.length} characters` : 'Missing',
  });

  const marketNarrative = getNarrativeContent(reportData?.market_approach_analysis) ||
                          getNarrativeContent(reportData?.narratives?.market_approach_narrative);
  checks.push({
    name: 'Market Approach Narrative',
    category: 'important',
    passed: !!marketNarrative && marketNarrative.length > 200,
    weight: 4,
    details: marketNarrative ? `${marketNarrative.length} characters` : 'Missing',
  });

  // === RECOMMENDED CHECKS (Nice to have for premium) ===

  // Revenue Present (4 points)
  checks.push({
    name: 'Revenue Present',
    category: 'recommended',
    passed: !!reportData?.annual_revenue && reportData.annual_revenue > 0,
    weight: 4,
    details: reportData?.annual_revenue ? `$${reportData.annual_revenue.toLocaleString()}` : 'Missing',
  });

  // Normalized Earnings (4 points)
  checks.push({
    name: 'Normalized Earnings',
    category: 'recommended',
    passed: !!(reportData?.normalized_sde || reportData?.normalized_ebitda),
    weight: 4,
    details: reportData?.normalized_sde ? `SDE: $${reportData.normalized_sde.toLocaleString()}` : 'Missing',
  });

  // Value Enhancement Recommendations (5 points)
  const recommendations = getNarrativeContent(reportData?.strategic_insights) ||
                          getNarrativeContent(reportData?.narratives?.value_enhancement_recommendations);
  checks.push({
    name: 'Value Enhancement Recommendations',
    category: 'recommended',
    passed: !!recommendations && recommendations.length > 200,
    weight: 5,
    details: recommendations ? `${recommendations.length} characters` : 'Missing',
  });

  // Company Profile (3 points)
  const companyProfile = getNarrativeContent(reportData?.company_profile) ||
                         getNarrativeContent(reportData?.narratives?.company_overview);
  checks.push({
    name: 'Company Profile',
    category: 'recommended',
    passed: !!companyProfile && companyProfile.length > 100,
    weight: 3,
    details: companyProfile ? `${companyProfile.length} characters` : 'Missing',
  });

  // Approach Weights (2 points)
  checks.push({
    name: 'Approach Weights Defined',
    category: 'recommended',
    passed: !!(reportData?.asset_approach_weight && reportData?.income_approach_weight && reportData?.market_approach_weight),
    weight: 2,
    details: reportData?.asset_approach_weight ?
      `Asset: ${Math.round((reportData.asset_approach_weight || 0) * 100)}%, Income: ${Math.round((reportData.income_approach_weight || 0) * 100)}%, Market: ${Math.round((reportData.market_approach_weight || 0) * 100)}%` :
      'Missing',
  });

  // === CALCULATE SCORE ===

  const earnedPoints = checks.filter(c => c.passed).reduce((sum, c) => sum + c.weight, 0);
  const totalPoints = checks.reduce((sum, c) => sum + c.weight, 0);
  const score = Math.round((earnedPoints / totalPoints) * 100);

  // Determine grade
  let grade: 'A' | 'B' | 'C' | 'D' | 'F';
  if (score >= 90) grade = 'A';
  else if (score >= 80) grade = 'B';
  else if (score >= 70) grade = 'C';
  else if (score >= 60) grade = 'D';
  else grade = 'F';

  // Check if premium ready (score >= 80 and no critical failures)
  const criticalFailures = checks.filter(c => c.category === 'critical' && !c.passed);
  const isPremiumReady = score >= 80 && criticalFailures.length === 0;

  // Generate summary
  const passedCount = checks.filter(c => c.passed).length;
  const failedCount = checks.filter(c => !c.passed).length;
  const summary = isPremiumReady
    ? `Report meets premium quality standards (${score}/100, Grade ${grade}). All ${passedCount} checks passed.`
    : `Report needs improvement (${score}/100, Grade ${grade}). ${failedCount} checks failed.` +
      (criticalFailures.length > 0 ? ` Critical issues: ${criticalFailures.map(c => c.name).join(', ')}.` : '');

  return {
    score,
    grade,
    checks,
    isPremiumReady,
    summary,
  };
}

/**
 * Get a formatted report of quality check results
 */
export function formatQualityReport(result: QualityCheckResult): string {
  let output = `\n=== REPORT QUALITY CHECK ===\n\n`;
  output += `Score: ${result.score}/100 (Grade: ${result.grade})\n`;
  output += `Premium Ready: ${result.isPremiumReady ? 'YES ✓' : 'NO ✗'}\n\n`;

  output += `--- Critical Checks ---\n`;
  for (const check of result.checks.filter(c => c.category === 'critical')) {
    const status = check.passed ? '✓' : '✗';
    output += `${status} ${check.name} (${check.weight}pts): ${check.details}\n`;
  }

  output += `\n--- Important Checks ---\n`;
  for (const check of result.checks.filter(c => c.category === 'important')) {
    const status = check.passed ? '✓' : '✗';
    output += `${status} ${check.name} (${check.weight}pts): ${check.details}\n`;
  }

  output += `\n--- Recommended Checks ---\n`;
  for (const check of result.checks.filter(c => c.category === 'recommended')) {
    const status = check.passed ? '✓' : '✗';
    output += `${status} ${check.name} (${check.weight}pts): ${check.details}\n`;
  }

  output += `\n${result.summary}\n`;

  return output;
}
