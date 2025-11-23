// Temporary stub implementation - charts disabled for Vercel deployment
// TODO: Replace with serverless-compatible chart generation (e.g., QuickChart API)
// Original implementation backed up to chartGenerator.ts.backup

export async function generateRevenueChart(historicalData: any[]): Promise<Buffer> {
  // Return empty buffer - charts temporarily disabled
  return Buffer.from('');
}

export async function generateMarginChart(historicalData: any[]): Promise<Buffer> {
  return Buffer.from('');
}

export async function generateValuationWaterfallChart(valuationData: any): Promise<Buffer> {
  return Buffer.from('');
}

export async function generateApproachWeightingPieChart(weights: any): Promise<Buffer> {
  return Buffer.from('');
}

export async function generateRiskGaugeChart(riskLevel: number): Promise<Buffer> {
  return Buffer.from('');
}

export async function generateBenchmarkingRadarChart(benchmarkData: any): Promise<Buffer> {
  return Buffer.from('');
}
