'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign, BarChart3, AlertCircle } from 'lucide-react';

interface ReportDisplayProps {
  reportData: any;
}

export function ReportDisplay({ reportData }: ReportDisplayProps) {
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
    <div className="space-y-6">
      {reportData.valuation_summary && (
        <Card>
          <CardHeader>
            <CardTitle>Valuation Summary</CardTitle>
            <CardDescription>Overall business valuation assessment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                  <p className="text-sm font-medium text-slate-600">Estimated Value</p>
                </div>
                <p className="text-2xl font-bold text-slate-900">
                  {formatCurrency(reportData.valuation_summary.estimated_value)}
                </p>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="h-5 w-5 text-slate-600" />
                  <p className="text-sm font-medium text-slate-600">Primary Method</p>
                </div>
                <p className="text-lg font-semibold text-slate-900">
                  {reportData.valuation_summary.primary_method || 'N/A'}
                </p>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-slate-600" />
                  <p className="text-sm font-medium text-slate-600">Confidence Level</p>
                </div>
                <p className="text-lg font-semibold text-slate-900">
                  {reportData.valuation_summary.confidence_level || 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {reportData.financial_metrics && (
        <Card>
          <CardHeader>
            <CardTitle>Financial Metrics</CardTitle>
            <CardDescription>Key financial performance indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reportData.financial_metrics.revenue && (
                <div className="p-4 border border-slate-200 rounded-lg">
                  <p className="text-sm text-slate-600 mb-1">Annual Revenue</p>
                  <p className="text-xl font-bold text-slate-900">
                    {formatCurrency(reportData.financial_metrics.revenue)}
                  </p>
                </div>
              )}
              {reportData.financial_metrics.ebitda && (
                <div className="p-4 border border-slate-200 rounded-lg">
                  <p className="text-sm text-slate-600 mb-1">EBITDA</p>
                  <p className="text-xl font-bold text-slate-900">
                    {formatCurrency(reportData.financial_metrics.ebitda)}
                  </p>
                </div>
              )}
              {reportData.financial_metrics.net_income && (
                <div className="p-4 border border-slate-200 rounded-lg">
                  <p className="text-sm text-slate-600 mb-1">Net Income</p>
                  <p className="text-xl font-bold text-slate-900">
                    {formatCurrency(reportData.financial_metrics.net_income)}
                  </p>
                </div>
              )}
              {reportData.financial_metrics.profit_margin && (
                <div className="p-4 border border-slate-200 rounded-lg">
                  <p className="text-sm text-slate-600 mb-1">Profit Margin</p>
                  <p className="text-xl font-bold text-slate-900">
                    {formatPercentage(reportData.financial_metrics.profit_margin)}
                  </p>
                </div>
              )}
              {reportData.financial_metrics.revenue_growth && (
                <div className="p-4 border border-slate-200 rounded-lg">
                  <p className="text-sm text-slate-600 mb-1">Revenue Growth</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xl font-bold text-slate-900">
                      {formatPercentage(reportData.financial_metrics.revenue_growth)}
                    </p>
                    {reportData.financial_metrics.revenue_growth > 0 ? (
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                </div>
              )}
              {reportData.financial_metrics.assets && (
                <div className="p-4 border border-slate-200 rounded-lg">
                  <p className="text-sm text-slate-600 mb-1">Total Assets</p>
                  <p className="text-xl font-bold text-slate-900">
                    {formatCurrency(reportData.financial_metrics.assets)}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {reportData.valuation_methods && reportData.valuation_methods.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Valuation Methods</CardTitle>
            <CardDescription>Different approaches used for valuation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportData.valuation_methods.map((method: any, index: number) => (
                <div key={index} className="p-4 border border-slate-200 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-slate-900">{method.method_name}</h4>
                    <Badge variant="outline">{formatCurrency(method.estimated_value)}</Badge>
                  </div>
                  {method.description && (
                    <p className="text-sm text-slate-600 mb-2">{method.description}</p>
                  )}
                  {method.key_assumptions && method.key_assumptions.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-slate-500 mb-1">Key Assumptions:</p>
                      <ul className="list-disc list-inside text-xs text-slate-600 space-y-0.5">
                        {method.key_assumptions.map((assumption: string, idx: number) => (
                          <li key={idx}>{assumption}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {reportData.comparable_companies && reportData.comparable_companies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Comparable Companies</CardTitle>
            <CardDescription>Industry peer analysis and benchmarking</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2 px-3 font-medium text-slate-900">Company</th>
                    <th className="text-right py-2 px-3 font-medium text-slate-900">Revenue</th>
                    <th className="text-right py-2 px-3 font-medium text-slate-900">Multiple</th>
                    <th className="text-right py-2 px-3 font-medium text-slate-900">Industry</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.comparable_companies.map((company: any, index: number) => (
                    <tr key={index} className="border-b border-slate-100">
                      <td className="py-2 px-3 text-slate-900">{company.name}</td>
                      <td className="py-2 px-3 text-right text-slate-600">
                        {formatCurrency(company.revenue)}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-600">
                        {company.multiple ? `${company.multiple.toFixed(2)}x` : 'N/A'}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-600">{company.industry}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {reportData.risk_factors && reportData.risk_factors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Risk Assessment</CardTitle>
            <CardDescription>Identified risks and considerations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reportData.risk_factors.map((risk: any, index: number) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    risk.severity === 'high'
                      ? 'bg-red-50 border-red-200'
                      : risk.severity === 'medium'
                      ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <h4 className="font-semibold text-slate-900">{risk.category}</h4>
                    <Badge
                      variant={
                        risk.severity === 'high'
                          ? 'destructive'
                          : risk.severity === 'medium'
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {risk.severity}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600">{risk.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {reportData.key_findings && reportData.key_findings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Key Findings</CardTitle>
            <CardDescription>Important observations from the analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {reportData.key_findings.map((finding: string, index: number) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="mt-1 h-2 w-2 rounded-full bg-blue-600 flex-shrink-0" />
                  <p className="text-slate-700">{finding}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {reportData.recommendations && reportData.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
            <CardDescription>Suggested actions and considerations</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {reportData.recommendations.map((recommendation: string, index: number) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="mt-1 h-2 w-2 rounded-full bg-green-600 flex-shrink-0" />
                  <p className="text-slate-700">{recommendation}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
