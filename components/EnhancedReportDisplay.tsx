'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, DollarSign, BarChart3, AlertCircle, Target, Lightbulb, FileText, Shield, Building2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import type { Components } from 'react-markdown';

interface EnhancedReportDisplayProps {
  reportData: any;
  companyName: string;
}

// Custom markdown components for professional formatting
const markdownComponents: Components = {
  // Tables
  table: ({ node, ...props }) => (
    <div className="overflow-x-auto my-6">
      <table className="min-w-full divide-y divide-gray-300 border border-gray-300" {...props} />
    </div>
  ),
  thead: ({ node, ...props }) => (
    <thead className="bg-gray-50" {...props} />
  ),
  tbody: ({ node, ...props }) => (
    <tbody className="divide-y divide-gray-200 bg-white" {...props} />
  ),
  tr: ({ node, ...props }) => (
    <tr className="hover:bg-gray-50" {...props} />
  ),
  th: ({ node, ...props }) => (
    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-r border-gray-300 last:border-r-0" {...props} />
  ),
  td: ({ node, ...props }) => (
    <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200 last:border-r-0" {...props} />
  ),
  
  // Typography
  p: ({ node, ...props }) => (
    <p className="mb-4 text-gray-700 leading-relaxed" {...props} />
  ),
  h1: ({ node, ...props }) => (
    <h1 className="text-3xl font-bold mt-8 mb-4 text-gray-900" {...props} />
  ),
  h2: ({ node, ...props }) => (
    <h2 className="text-2xl font-bold mt-6 mb-3 text-gray-900" {...props} />
  ),
  h3: ({ node, ...props }) => (
    <h3 className="text-xl font-semibold mt-4 mb-2 text-gray-900" {...props} />
  ),
  h4: ({ node, ...props }) => (
    <h4 className="text-lg font-semibold mt-3 mb-2 text-gray-800" {...props} />
  ),
  
  // Lists
  ul: ({ node, ...props }) => (
    <ul className="list-disc list-inside mb-4 space-y-2 text-gray-700 ml-4" {...props} />
  ),
  ol: ({ node, ...props }) => (
    <ol className="list-decimal list-inside mb-4 space-y-2 text-gray-700 ml-4" {...props} />
  ),
  li: ({ node, ...props }) => (
    <li className="ml-2" {...props} />
  ),
  
  // Code
  code: ({ node, inline, ...props }: any) => (
    inline 
      ? <code className="px-1.5 py-0.5 bg-gray-100 text-red-600 rounded text-sm font-mono" {...props} />
      : <code className="block p-4 bg-gray-900 text-gray-100 rounded-lg overflow-x-auto text-sm font-mono my-4" {...props} />
  ),
  
  // Blockquotes and emphasis
  blockquote: ({ node, ...props }) => (
    <blockquote className="border-l-4 border-blue-500 pl-4 italic my-4 text-gray-600 bg-blue-50 py-2" {...props} />
  ),
  strong: ({ node, ...props }) => (
    <strong className="font-bold text-gray-900" {...props} />
  ),
  em: ({ node, ...props }) => (
    <em className="italic text-gray-700" {...props} />
  ),
  
  // Links
  a: ({ node, ...props }) => (
    <a className="text-blue-600 hover:text-blue-800 underline" {...props} />
  ),
  
  // Horizontal rule
  hr: ({ node, ...props }) => (
    <hr className="my-6 border-gray-300" {...props} />
  ),
};

// Helper to get content from narrative fields (handles both string and {content: string} formats)
function getNarrativeContent(value: any): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (value.content) return value.content;
  return '';
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

  // Extract narratives from multiple possible paths
  const narratives = {
    executive_summary: getNarrativeContent(reportData.executive_summary) ||
                       getNarrativeContent(reportData.narratives?.executive_summary) || '',
    financial_analysis: getNarrativeContent(reportData.financial_analysis) ||
                        getNarrativeContent(reportData.narratives?.financial_analysis) || '',
    industry_analysis: getNarrativeContent(reportData.industry_analysis) ||
                       getNarrativeContent(reportData.narratives?.industry_analysis) || '',
    risk_assessment: getNarrativeContent(reportData.risk_assessment) ||
                     getNarrativeContent(reportData.narratives?.risk_assessment) || '',
    strategic_insights: getNarrativeContent(reportData.strategic_insights) ||
                        getNarrativeContent(reportData.narratives?.value_enhancement_recommendations) ||
                        getNarrativeContent(reportData.narratives?.strategic_insights) || '',
    company_profile: getNarrativeContent(reportData.company_profile) ||
                     getNarrativeContent(reportData.narratives?.company_overview) || '',
    asset_approach_analysis: getNarrativeContent(reportData.asset_approach_analysis) ||
                             getNarrativeContent(reportData.narratives?.asset_approach_narrative) || '',
    income_approach_analysis: getNarrativeContent(reportData.income_approach_analysis) ||
                              getNarrativeContent(reportData.narratives?.income_approach_narrative) || '',
    market_approach_analysis: getNarrativeContent(reportData.market_approach_analysis) ||
                              getNarrativeContent(reportData.narratives?.market_approach_narrative) || '',
    valuation_reconciliation: getNarrativeContent(reportData.valuation_reconciliation) ||
                              getNarrativeContent(reportData.narratives?.valuation_synthesis_narrative) || '',
  };

  // Extract valuation summary from multiple possible paths
  const valuationMethod = reportData.valuation_method ||
                          reportData.valuation_summary?.primary_valuation_method ||
                          'Weighted Multi-Approach';

  const confidenceLevel = reportData.confidence_level ||
                          reportData.valuation_summary?.confidence_level ||
                          reportData.valuation_conclusion?.confidence_level ||
                          'Moderate';

  const valueRangeLow = reportData.valuation_range_low ||
                        reportData.valuation_summary?.value_range?.low ||
                        reportData.valuation_conclusion?.value_range_low ||
                        (reportData.valuation_amount ? Math.round(reportData.valuation_amount * 0.85) : null);

  const valueRangeHigh = reportData.valuation_range_high ||
                         reportData.valuation_summary?.value_range?.high ||
                         reportData.valuation_conclusion?.value_range_high ||
                         (reportData.valuation_amount ? Math.round(reportData.valuation_amount * 1.15) : null);

  // Extract weights with defaults (ensure they're numbers)
  const assetWeight = parseFloat(reportData.asset_approach_weight) || 0.20;
  const incomeWeight = parseFloat(reportData.income_approach_weight) || 0.40;
  const marketWeight = parseFloat(reportData.market_approach_weight) || 0.40;

  // Extract approach values
  const assetValue = reportData.asset_approach_value || 0;
  const incomeValue = reportData.income_approach_value || 0;
  const marketValue = reportData.market_approach_value || 0;

  // Calculate liquidation value if not provided
  const liquidationValue = reportData.liquidation_value || Math.round(assetValue * 0.65);

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-8 rounded-lg">
        <h1 className="text-3xl font-bold mb-2">Business Valuation Report</h1>
        <p className="text-blue-100 text-lg">{companyName}</p>
        <p className="text-blue-200 text-sm mt-2">
          Generated on {reportData.valuation_date || new Date().toLocaleDateString()}
        </p>
      </div>

      {/* Key Metrics Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="h-6 w-6 text-blue-600" />
              <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Estimated Value</p>
            </div>
            <p className="text-3xl font-bold text-slate-900 mb-2">
              {formatCurrency(reportData.valuation_amount)}
            </p>
            {(valueRangeLow && valueRangeHigh) && (
              <p className="text-sm text-slate-600">
                Range: {formatCurrency(valueRangeLow)} - {formatCurrency(valueRangeHigh)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="h-6 w-6 text-slate-600" />
              <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Valuation Method</p>
            </div>
            <p className="text-lg font-semibold text-slate-900">
              {valuationMethod}
            </p>
            {reportData.standard_of_value && (
              <p className="text-sm text-slate-600 mt-2">
                Standard: {reportData.standard_of_value}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-6 w-6 text-slate-600" />
              <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Confidence Level</p>
            </div>
            <Badge
              variant={
                confidenceLevel === 'High' ? 'default' :
                confidenceLevel === 'Medium' || confidenceLevel === 'Moderate' ? 'secondary' :
                'outline'
              }
              className="text-lg px-4 py-2"
            >
              {confidenceLevel}
            </Badge>
            {reportData.premise_of_value && (
              <p className="text-sm text-slate-600 mt-2">
                Premise: {reportData.premise_of_value}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Content */}
      <Tabs defaultValue="executive" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6">
          <TabsTrigger value="executive">Executive Summary</TabsTrigger>
          <TabsTrigger value="financial">Financial Analysis</TabsTrigger>
          <TabsTrigger value="valuation">Valuation</TabsTrigger>
          <TabsTrigger value="risk">Risk Assessment</TabsTrigger>
          <TabsTrigger value="insights">Strategic Insights</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        {/* Executive Summary Tab */}
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
              {narratives.executive_summary ? (
                <div className="prose max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw, rehypeSanitize]}
                    components={markdownComponents}
                  >
                    {narratives.executive_summary}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="text-slate-500 italic">No executive summary available.</p>
              )}

              {reportData.key_findings && reportData.key_findings.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Target className="h-5 w-5 text-blue-600" />
                    Key Findings
                  </h3>
                  <ul className="space-y-2">
                    {reportData.key_findings.map((finding: string, index: number) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-semibold">
                          {index + 1}
                        </span>
                        <span className="text-slate-700">{finding}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {narratives.company_profile && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-blue-600" />
                    Company Profile
                  </h3>
                  <div className="prose max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw, rehypeSanitize]} components={markdownComponents}>{narratives.company_profile}</ReactMarkdown>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Financial Analysis Tab */}
        <TabsContent value="financial" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Financial Analysis
              </CardTitle>
              <CardDescription>Detailed financial performance and metrics analysis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {narratives.financial_analysis ? (
                <div className="prose max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw, rehypeSanitize]} components={markdownComponents}>{narratives.financial_analysis}</ReactMarkdown>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-slate-500 italic">No detailed financial analysis narrative available.</p>
                  {/* Show summary from extracted data */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <p className="text-sm text-slate-600">Revenue</p>
                      <p className="text-lg font-semibold">{formatCurrency(reportData.annual_revenue)}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <p className="text-sm text-slate-600">Pretax Income</p>
                      <p className="text-lg font-semibold">{formatCurrency(reportData.pretax_income)}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <p className="text-sm text-slate-600">Total Assets</p>
                      <p className="text-lg font-semibold">{formatCurrency(reportData.total_assets)}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <p className="text-sm text-slate-600">Total Liabilities</p>
                      <p className="text-lg font-semibold">{formatCurrency(reportData.total_liabilities)}</p>
                    </div>
                  </div>
                </div>
              )}

              {narratives.industry_analysis && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-4">Industry Analysis</h3>
                  <div className="prose max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw, rehypeSanitize]} components={markdownComponents}>{narratives.industry_analysis}</ReactMarkdown>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Valuation Tab */}
        <TabsContent value="valuation" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Valuation Analysis
              </CardTitle>
              <CardDescription>Comprehensive valuation methodology and calculations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Valuation Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-sm font-semibold text-slate-600 mb-2">Concluded Value</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {formatCurrency(reportData.valuation_amount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-600 mb-2">Value Range</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {formatCurrency(valueRangeLow)} - {formatCurrency(valueRangeHigh)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-600 mb-2">Primary Method</p>
                  <p className="text-lg text-slate-900">{valuationMethod}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-600 mb-2">Standard of Value</p>
                  <p className="text-lg text-slate-900">{reportData.standard_of_value || 'Fair Market Value'}</p>
                </div>
              </div>

              {/* Valuation Approaches Breakdown */}
              {(assetValue > 0 || incomeValue > 0 || marketValue > 0) && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-4">Valuation Approaches Breakdown</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-300 border border-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-r border-gray-300">Approach</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 border-r border-gray-300">Value</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 border-r border-gray-300">Weight</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Weighted Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        <tr className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 border-r border-gray-200">Asset Approach</td>
                          <td className="px-4 py-3 text-sm text-right text-gray-700 border-r border-gray-200">
                            {formatCurrency(assetValue)}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-gray-700 border-r border-gray-200">
                            {Math.round(assetWeight * 100)}%
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                            {formatCurrency(assetValue * assetWeight)}
                          </td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 border-r border-gray-200">Income Approach</td>
                          <td className="px-4 py-3 text-sm text-right text-gray-700 border-r border-gray-200">
                            {formatCurrency(incomeValue)}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-gray-700 border-r border-gray-200">
                            {Math.round(incomeWeight * 100)}%
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                            {formatCurrency(incomeValue * incomeWeight)}
                          </td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 border-r border-gray-200">Market Approach</td>
                          <td className="px-4 py-3 text-sm text-right text-gray-700 border-r border-gray-200">
                            {formatCurrency(marketValue)}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-gray-700 border-r border-gray-200">
                            {Math.round(marketWeight * 100)}%
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                            {formatCurrency(marketValue * marketWeight)}
                          </td>
                        </tr>
                        <tr className="bg-blue-50">
                          <td className="px-4 py-4 text-sm font-bold text-gray-900 border-r border-blue-200" colSpan={3}>
                            Final Valuation (Weighted Average)
                          </td>
                          <td className="px-4 py-4 text-right font-bold text-blue-600 text-lg">
                            {formatCurrency(reportData.valuation_amount)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Multiples Used */}
                  {(reportData.revenue_multiple_used || reportData.ebitda_multiple_used || reportData.sde_multiple_used) && (
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                      {reportData.revenue_multiple_used && (
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <p className="text-sm text-gray-600 mb-1">Revenue Multiple</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {reportData.revenue_multiple_used.toFixed(2)}x
                          </p>
                          {reportData.annual_revenue && (
                            <p className="text-xs text-gray-500 mt-1">
                              {formatCurrency(reportData.annual_revenue)} revenue
                            </p>
                          )}
                        </div>
                      )}
                      {reportData.ebitda_multiple_used && (
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <p className="text-sm text-gray-600 mb-1">EBITDA Multiple</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {reportData.ebitda_multiple_used.toFixed(2)}x
                          </p>
                          {reportData.normalized_ebitda && (
                            <p className="text-xs text-gray-500 mt-1">
                              {formatCurrency(reportData.normalized_ebitda)} EBITDA
                            </p>
                          )}
                        </div>
                      )}
                      {reportData.sde_multiple_used && (
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <p className="text-sm text-gray-600 mb-1">SDE Multiple</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {reportData.sde_multiple_used.toFixed(2)}x
                          </p>
                          {reportData.normalized_sde && (
                            <p className="text-xs text-gray-500 mt-1">
                              {formatCurrency(reportData.normalized_sde)} SDE
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Industry Information */}
                  {(reportData.industry_name || reportData.industry_naics_code) && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Building2 className="h-5 w-5 text-blue-600" />
                        <p className="text-sm font-semibold text-blue-900">Industry Classification</p>
                      </div>
                      {reportData.industry_name && (
                        <p className="text-base font-medium text-gray-900">{reportData.industry_name}</p>
                      )}
                      {reportData.industry_naics_code && (
                        <p className="text-sm text-gray-600 mt-1">NAICS Code: {reportData.industry_naics_code}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Asset Approach */}
              {narratives.asset_approach_analysis && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Asset Approach</h3>
                  <div className="prose max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw, rehypeSanitize]} components={markdownComponents}>{narratives.asset_approach_analysis}</ReactMarkdown>
                  </div>
                </div>
              )}

              {/* Income Approach */}
              {narratives.income_approach_analysis && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-4">Income Approach</h3>
                  <div className="prose max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw, rehypeSanitize]} components={markdownComponents}>{narratives.income_approach_analysis}</ReactMarkdown>
                  </div>
                </div>
              )}

              {/* Market Approach */}
              {narratives.market_approach_analysis && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-4">Market Approach</h3>
                  <div className="prose max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw, rehypeSanitize]} components={markdownComponents}>{narratives.market_approach_analysis}</ReactMarkdown>
                  </div>
                </div>
              )}

              {/* Valuation Reconciliation */}
              {narratives.valuation_reconciliation && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-4">Valuation Reconciliation</h3>
                  <div className="prose max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw, rehypeSanitize]} components={markdownComponents}>{narratives.valuation_reconciliation}</ReactMarkdown>
                  </div>
                </div>
              )}

              {/* Discounts and Premiums */}
              {reportData.discounts_and_premiums && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-4">Discounts and Premiums</h3>
                  <div className="prose max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw, rehypeSanitize]} components={markdownComponents}>{reportData.discounts_and_premiums}</ReactMarkdown>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Risk Assessment Tab */}
        <TabsContent value="risk" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Risk Assessment
              </CardTitle>
              <CardDescription>Comprehensive risk analysis and mitigation strategies</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Risk Score Summary */}
              {(reportData.risk_score || reportData.overall_risk_score) && (
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <div className="text-sm text-gray-600">Overall Risk Score</div>
                  <div className="text-2xl font-bold">{reportData.risk_score || reportData.overall_risk_score}/10</div>
                  <div className="text-sm text-gray-500">
                    {(reportData.risk_score || reportData.overall_risk_score) <= 3 ? 'Low Risk' :
                     (reportData.risk_score || reportData.overall_risk_score) <= 6 ? 'Moderate Risk' : 'High Risk'}
                  </div>
                </div>
              )}

              {narratives.risk_assessment ? (
                <div className="prose max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw, rehypeSanitize]} components={markdownComponents}>{narratives.risk_assessment}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-slate-500 italic">No detailed risk assessment narrative available.</p>
              )}

              {reportData.critical_risk_factors && reportData.critical_risk_factors.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-red-600" />
                    Critical Risk Factors
                  </h3>
                  <div className="space-y-3">
                    {reportData.critical_risk_factors.map((risk: string, index: number) => (
                      <div key={index} className="flex items-start gap-3 p-4 bg-red-50 border-l-4 border-red-500 rounded">
                        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <span className="text-slate-700">{risk}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Strategic Insights Tab */}
        <TabsContent value="insights" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Strategic Insights
              </CardTitle>
              <CardDescription>Value drivers and strategic opportunities</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {narratives.strategic_insights ? (
                <div className="prose max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw, rehypeSanitize]} components={markdownComponents}>{narratives.strategic_insights}</ReactMarkdown>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-slate-500 italic">No detailed strategic insights narrative available.</p>
                  <p className="text-slate-600">
                    Based on our analysis, consider the following value enhancement strategies:
                  </p>
                  <ul className="list-disc pl-5 space-y-2 text-slate-700">
                    <li>Reduce customer concentration by diversifying client base</li>
                    <li>Document key processes to reduce owner dependence</li>
                    <li>Strengthen management team depth</li>
                    <li>Improve financial record-keeping and reporting</li>
                    <li>Consider strategies to improve gross margins</li>
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Value Enhancement Recommendations
              </CardTitle>
              <CardDescription>Actionable strategies to maximize business value</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* If we have a narrative string for recommendations, render it */}
              {narratives.strategic_insights && (
                <div className="prose max-w-none mb-6">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw, rehypeSanitize]} components={markdownComponents}>{narratives.strategic_insights}</ReactMarkdown>
                </div>
              )}

              {/* If we have an array of recommendations */}
              {reportData.value_enhancement_recommendations && reportData.value_enhancement_recommendations.length > 0 && (
                <div className="space-y-4">
                  {reportData.value_enhancement_recommendations.map((recommendation: string, index: number) => (
                    <div key={index} className="flex items-start gap-3 p-4 bg-green-50 border-l-4 border-green-500 rounded">
                      <Lightbulb className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-slate-900 mb-1">Recommendation {index + 1}</p>
                        <p className="text-slate-700">{recommendation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Fallback if no recommendations */}
              {!narratives.strategic_insights && (!reportData.value_enhancement_recommendations || reportData.value_enhancement_recommendations.length === 0) && (
                <p className="text-slate-500 italic">No specific recommendations available.</p>
              )}
            </CardContent>
          </Card>

          {/* Assumptions and Limiting Conditions */}
          {reportData.assumptions_and_limiting_conditions && (
            <Card>
              <CardHeader>
                <CardTitle>Assumptions and Limiting Conditions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none text-sm">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw, rehypeSanitize]} components={markdownComponents}>{reportData.assumptions_and_limiting_conditions}</ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Data Sources */}
          {reportData.data_sources && (
            <Card>
              <CardHeader>
                <CardTitle>Data Sources</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none text-sm">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw, rehypeSanitize]} components={markdownComponents}>{reportData.data_sources}</ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Methodology Compliance */}
          {reportData.methodology_compliance && (
            <Card>
              <CardHeader>
                <CardTitle>Professional Standards Compliance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none text-sm">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw, rehypeSanitize]} components={markdownComponents}>{reportData.methodology_compliance}</ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
