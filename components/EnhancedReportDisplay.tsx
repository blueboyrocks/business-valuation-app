'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, DollarSign, BarChart3, AlertCircle, Target, Lightbulb, FileText } from 'lucide-react';
import { WaterfallChart } from './charts/WaterfallChart';
import { RiskHeatMap } from './charts/RiskHeatMap';
import { GaugeChart } from './charts/GaugeChart';
import { FinancialTrendChart } from './charts/FinancialTrendChart';

interface EnhancedReportDisplayProps {
  reportData: any;
  companyName: string;
}

export function EnhancedReportDisplay({ reportData, companyName }: EnhancedReportDisplayProps) {
  if (!reportData) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600">No report data available</p>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number | null | undefined) => {
    if (value === null || value === undefined) return 'N/A';
    return `${value.toFixed(2)}%`;
  };

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-8 rounded-lg">
        <h1 className="text-3xl font-bold mb-2">Business Valuation Report</h1>
        <p className="text-blue-100 text-lg">{companyName}</p>
        <p className="text-blue-200 text-sm mt-2">Generated on {new Date().toLocaleDateString()}</p>
      </div>

      <Tabs defaultValue="executive" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6">
          <TabsTrigger value="executive">Executive Summary</TabsTrigger>
          <TabsTrigger value="financial">Financial Analysis</TabsTrigger>
          <TabsTrigger value="valuation">Valuation</TabsTrigger>
          <TabsTrigger value="risk">Risk Assessment</TabsTrigger>
          <TabsTrigger value="insights">Strategic Insights</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="executive" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Executive Summary
              </CardTitle>
              <CardDescription>Comprehensive overview of business valuation and key findings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {reportData.valuation_summary && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-6 bg-blue-50 rounded-lg border-2 border-blue-200">
                    <div className="flex items-center gap-2 mb-3">
                      <DollarSign className="h-6 w-6 text-blue-600" />
                      <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Estimated Value</p>
                    </div>
                    <p className="text-3xl font-bold text-slate-900 mb-2">
                      {formatCurrency(reportData.valuation_summary.estimated_value)}
                    </p>
                    {reportData.valuation_summary.value_range && (
                      <p className="text-sm text-slate-600">
                        Range: {formatCurrency(reportData.valuation_summary.value_range.low)} -{' '}
                        {formatCurrency(reportData.valuation_summary.value_range.high)}
                      </p>
                    )}
                  </div>
                  <div className="p-6 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-2 mb-3">
                      <BarChart3 className="h-6 w-6 text-slate-600" />
                      <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Primary Method</p>
                    </div>
                    <p className="text-xl font-semibold text-slate-900 mb-2">
                      {reportData.valuation_summary.primary_method || 'Comprehensive Analysis'}
                    </p>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Target className="h-6 w-6 text-slate-600" />
                      <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Confidence Level</p>
                    </div>
                    <p className="text-xl font-semibold text-slate-900 mb-2">
                      {reportData.valuation_summary.confidence_level || 'High'}
                    </p>
                  </div>
                </div>
              )}

              {reportData.key_value_drivers && reportData.key_value_drivers.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Key Value Drivers</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {reportData.key_value_drivers.map((driver: any, index: number) => (
                      <div key={index} className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-start gap-3">
                          <TrendingUp className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold text-slate-900">{driver.title || driver}</p>
                            {driver.description && (
                              <p className="text-sm text-slate-600 mt-1">{driver.description}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {reportData.critical_risks && reportData.critical_risks.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Critical Risk Factors</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {reportData.critical_risks.map((risk: any, index: number) => (
                      <div key={index} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold text-slate-900">{risk.title || risk}</p>
                            {risk.description && (
                              <p className="text-sm text-slate-600 mt-1">{risk.description}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {reportData.business_health_score && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <GaugeChart
                title="Overall Health"
                value={reportData.business_health_score.overall || 7}
                maxValue={10}
                label="Business Health Score"
                thresholds={{ low: 4, medium: 6, high: 8 }}
              />
              <GaugeChart
                title="Financial Strength"
                value={reportData.business_health_score.financial || 7}
                maxValue={10}
                label="Financial Health Score"
                thresholds={{ low: 4, medium: 6, high: 8 }}
              />
              <GaugeChart
                title="Growth Potential"
                value={reportData.business_health_score.growth || 7}
                maxValue={10}
                label="Growth Score"
                thresholds={{ low: 4, medium: 6, high: 8 }}
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="financial" className="space-y-6 mt-6">
          {reportData.financial_analysis?.multi_year_data && (
            <FinancialTrendChart
              title="Multi-Year Financial Performance"
              description="Historical trends and projections"
              data={reportData.financial_analysis.multi_year_data}
              metrics={[
                { key: 'revenue', name: 'Revenue', color: '#3b82f6' },
                { key: 'ebitda', name: 'EBITDA', color: '#10b981' },
                { key: 'netIncome', name: 'Net Income', color: '#f59e0b' },
              ]}
            />
          )}

          {reportData.financial_metrics && (
            <Card>
              <CardHeader>
                <CardTitle>Financial Metrics Overview</CardTitle>
                <CardDescription>Key financial performance indicators with industry benchmarking</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {reportData.financial_metrics.revenue && (
                    <div className="p-4 border border-slate-200 rounded-lg">
                      <p className="text-sm text-slate-600 mb-1">Annual Revenue</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {formatCurrency(reportData.financial_metrics.revenue)}
                      </p>
                      {reportData.financial_metrics.revenue_growth && (
                        <div className="flex items-center gap-1 mt-2">
                          {reportData.financial_metrics.revenue_growth > 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          )}
                          <span className={`text-sm font-medium ${reportData.financial_metrics.revenue_growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatPercentage(reportData.financial_metrics.revenue_growth)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  {reportData.financial_metrics.ebitda && (
                    <div className="p-4 border border-slate-200 rounded-lg">
                      <p className="text-sm text-slate-600 mb-1">EBITDA</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {formatCurrency(reportData.financial_metrics.ebitda)}
                      </p>
                      {reportData.financial_metrics.ebitda_margin && (
                        <p className="text-sm text-slate-600 mt-2">
                          Margin: {formatPercentage(reportData.financial_metrics.ebitda_margin)}
                        </p>
                      )}
                    </div>
                  )}
                  {reportData.financial_metrics.net_income && (
                    <div className="p-4 border border-slate-200 rounded-lg">
                      <p className="text-sm text-slate-600 mb-1">Net Income</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {formatCurrency(reportData.financial_metrics.net_income)}
                      </p>
                      {reportData.financial_metrics.profit_margin && (
                        <p className="text-sm text-slate-600 mt-2">
                          Margin: {formatPercentage(reportData.financial_metrics.profit_margin)}
                        </p>
                      )}
                    </div>
                  )}
                  {reportData.financial_metrics.cash_flow && (
                    <div className="p-4 border border-slate-200 rounded-lg">
                      <p className="text-sm text-slate-600 mb-1">Operating Cash Flow</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {formatCurrency(reportData.financial_metrics.cash_flow)}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {reportData.financial_ratios && (
            <Card>
              <CardHeader>
                <CardTitle>Financial Ratio Analysis</CardTitle>
                <CardDescription>Comprehensive ratio analysis with industry benchmarking</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(reportData.financial_ratios).map(([category, ratios]: [string, any]) => (
                    <div key={category} className="border border-slate-200 rounded-lg p-4">
                      <h4 className="font-semibold text-slate-900 mb-3 capitalize">{category.replace('_', ' ')}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {Object.entries(ratios).map(([ratio, value]: [string, any]) => (
                          <div key={ratio} className="bg-slate-50 p-3 rounded">
                            <p className="text-xs text-slate-600 mb-1 capitalize">{ratio.replace('_', ' ')}</p>
                            <p className="text-lg font-semibold text-slate-900">
                              {typeof value === 'number' ? value.toFixed(2) : value}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="valuation" className="space-y-6 mt-6">
          {reportData.valuation_approaches && (
            <>
              {reportData.valuation_approaches.asset_approach && (
                <Card>
                  <CardHeader>
                    <CardTitle>Asset Approach</CardTitle>
                    <CardDescription>Valuation based on adjusted net asset value</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-slate-600 mb-2">Asset Approach Value</p>
                        <p className="text-3xl font-bold text-slate-900">
                          {formatCurrency(reportData.valuation_approaches.asset_approach.value)}
                        </p>
                      </div>
                      {reportData.valuation_approaches.asset_approach.components && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {reportData.valuation_approaches.asset_approach.components.map((component: any, index: number) => (
                            <div key={index} className="p-3 border border-slate-200 rounded">
                              <p className="text-sm text-slate-600">{component.name}</p>
                              <p className="text-xl font-semibold text-slate-900">
                                {formatCurrency(component.value)}
                              </p>
                              {component.adjustment && (
                                <p className="text-xs text-slate-500 mt-1">{component.adjustment}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {reportData.valuation_approaches.income_approach && (
                <Card>
                  <CardHeader>
                    <CardTitle>Income Approach (DCF)</CardTitle>
                    <CardDescription>Discounted cash flow analysis with detailed projections</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-sm text-slate-600 mb-2">Income Approach Value</p>
                        <p className="text-3xl font-bold text-slate-900">
                          {formatCurrency(reportData.valuation_approaches.income_approach.value)}
                        </p>
                      </div>
                      {reportData.valuation_approaches.income_approach.discount_rate && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="p-3 bg-slate-50 rounded">
                            <p className="text-xs text-slate-600">Discount Rate</p>
                            <p className="text-lg font-semibold text-slate-900">
                              {formatPercentage(reportData.valuation_approaches.income_approach.discount_rate)}
                            </p>
                          </div>
                          {reportData.valuation_approaches.income_approach.terminal_growth_rate && (
                            <div className="p-3 bg-slate-50 rounded">
                              <p className="text-xs text-slate-600">Terminal Growth Rate</p>
                              <p className="text-lg font-semibold text-slate-900">
                                {formatPercentage(reportData.valuation_approaches.income_approach.terminal_growth_rate)}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {reportData.valuation_approaches.market_approach && (
                <Card>
                  <CardHeader>
                    <CardTitle>Market Approach</CardTitle>
                    <CardDescription>Comparable company and transaction analysis</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                        <p className="text-sm text-slate-600 mb-2">Market Approach Value</p>
                        <p className="text-3xl font-bold text-slate-900">
                          {formatCurrency(reportData.valuation_approaches.market_approach.value)}
                        </p>
                      </div>
                      {reportData.valuation_approaches.market_approach.comparable_multiples && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {Object.entries(reportData.valuation_approaches.market_approach.comparable_multiples).map(
                            ([metric, multiple]: [string, any]) => (
                              <div key={metric} className="p-3 bg-slate-50 rounded">
                                <p className="text-xs text-slate-600 capitalize">{metric.replace('_', ' ')}</p>
                                <p className="text-lg font-semibold text-slate-900">{multiple}x</p>
                              </div>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {reportData.valuation_reconciliation && (
                <WaterfallChart
                  title="Valuation Reconciliation"
                  description="Weighting and reconciliation of different valuation approaches"
                  data={reportData.valuation_reconciliation}
                />
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="risk" className="space-y-6 mt-6">
          {reportData.quantified_risk_assessment && (
            <RiskHeatMap
              title="Quantified Risk Assessment"
              description="Comprehensive risk analysis with impact and probability scoring"
              risks={reportData.quantified_risk_assessment}
            />
          )}

          {reportData.risk_categories && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(reportData.risk_categories).map(([category, data]: [string, any]) => (
                <Card key={category}>
                  <CardHeader>
                    <CardTitle className="capitalize">{category.replace('_', ' ')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Risk Score</span>
                        <span className="text-2xl font-bold text-slate-900">{data.score}/10</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            data.score >= 8 ? 'bg-red-500' : data.score >= 6 ? 'bg-orange-500' : data.score >= 4 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${(data.score / 10) * 100}%` }}
                        />
                      </div>
                      {data.factors && data.factors.length > 0 && (
                        <ul className="space-y-1 mt-3">
                          {data.factors.map((factor: string, index: number) => (
                            <li key={index} className="text-xs text-slate-600 flex items-start gap-2">
                              <span className="text-slate-400">•</span>
                              <span>{factor}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="insights" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Strategic Insights
              </CardTitle>
              <CardDescription>Expert analysis and strategic recommendations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {reportData.competitive_analysis && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Competitive Analysis</h3>
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-slate-700 leading-relaxed">
                      {reportData.competitive_analysis.summary}
                    </p>
                    {reportData.competitive_analysis.competitive_advantages && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-slate-700 mb-2">Competitive Advantages:</p>
                        <ul className="space-y-2">
                          {reportData.competitive_analysis.competitive_advantages.map((advantage: string, index: number) => (
                            <li key={index} className="flex items-start gap-2 text-sm text-slate-600">
                              <TrendingUp className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                              <span>{advantage}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {reportData.value_enhancement_opportunities && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Value Enhancement Opportunities</h3>
                  <div className="space-y-3">
                    {reportData.value_enhancement_opportunities.map((opportunity: any, index: number) => (
                      <div key={index} className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-slate-900">{opportunity.title}</h4>
                          {opportunity.potential_impact && (
                            <Badge variant="outline">{opportunity.potential_impact}</Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 mb-3">{opportunity.description}</p>
                        {opportunity.implementation_timeline && (
                          <p className="text-xs text-slate-500">
                            Timeline: {opportunity.implementation_timeline}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {reportData.growth_catalysts && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Growth Catalysts</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {reportData.growth_catalysts.map((catalyst: any, index: number) => (
                      <div key={index} className="p-4 border border-slate-200 rounded-lg">
                        <h4 className="font-semibold text-slate-900 mb-2">{catalyst.title || catalyst}</h4>
                        {catalyst.description && (
                          <p className="text-sm text-slate-600">{catalyst.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Strategic Recommendations</CardTitle>
              <CardDescription>Actionable recommendations for business optimization</CardDescription>
            </CardHeader>
            <CardContent>
              {reportData.recommendations && reportData.recommendations.length > 0 ? (
                <div className="space-y-4">
                  {reportData.recommendations.map((recommendation: any, index: number) => (
                    <div key={index} className="p-4 border-l-4 border-blue-600 bg-slate-50 rounded-r-lg">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-900 mb-2">
                            {recommendation.title || recommendation}
                          </h4>
                          {recommendation.description && (
                            <p className="text-slate-600 text-sm mb-3">{recommendation.description}</p>
                          )}
                          {recommendation.priority && (
                            <Badge
                              variant={
                                recommendation.priority === 'high'
                                  ? 'destructive'
                                  : recommendation.priority === 'medium'
                                  ? 'default'
                                  : 'secondary'
                              }
                            >
                              {recommendation.priority} priority
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-600 text-center py-8">No specific recommendations available.</p>
              )}
            </CardContent>
          </Card>

          {reportData.exit_strategy_considerations && (
            <Card>
              <CardHeader>
                <CardTitle>Exit Strategy Considerations</CardTitle>
                <CardDescription>Guidance for potential exit scenarios and timing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportData.exit_strategy_considerations.optimal_timing && (
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-slate-900 mb-2">Optimal Timing</h4>
                      <p className="text-slate-700">{reportData.exit_strategy_considerations.optimal_timing}</p>
                    </div>
                  )}
                  {reportData.exit_strategy_considerations.preparation_steps && (
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-3">Preparation Steps</h4>
                      <ul className="space-y-2">
                        {reportData.exit_strategy_considerations.preparation_steps.map((step: string, index: number) => (
                          <li key={index} className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center text-xs font-semibold text-slate-700">
                              {index + 1}
                            </div>
                            <p className="text-slate-600 flex-1 pt-0.5">{step}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
