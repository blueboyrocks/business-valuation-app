import React from 'react';

interface PDFReportTemplateProps {
  reportData: any;
  companyName: string;
  generatedDate: string;
}

export function PDFReportTemplate({ reportData, companyName, generatedDate }: PDFReportTemplateProps) {
  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercent = (value: number | null | undefined) => {
    if (!value) return 'N/A';
    return `${(value * 100).toFixed(1)}%`;
  };

  return (
    <div className="pdf-report">
      {/* Cover Page */}
      <div className="pdf-page pdf-cover">
        <div className="cover-content">
          <h1 className="cover-title">Business Valuation Report</h1>
          <div className="cover-company">{companyName}</div>
          
          <div className="cover-value-box">
            <div className="cover-value-label">Estimated Value</div>
            <div className="cover-value-amount">{formatCurrency(reportData.valuation_amount)}</div>
            {(reportData.valuation_range_low && reportData.valuation_range_high) && (
              <div className="cover-value-range">
                Range: {formatCurrency(reportData.valuation_range_low)} - {formatCurrency(reportData.valuation_range_high)}
              </div>
            )}
          </div>
          
          <div className="cover-date">Generated on {generatedDate}</div>
          
          <div className="cover-footer">
            <div className="cover-footer-text">Confidential Business Valuation Analysis</div>
          </div>
        </div>
      </div>

      {/* Table of Contents */}
      <div className="pdf-page">
        <h1 className="pdf-section-title">Table of Contents</h1>
        <div className="toc">
          <div className="toc-item">
            <span className="toc-title">Executive Summary</span>
            <span className="toc-dots"></span>
            <span className="toc-page">3</span>
          </div>
          <div className="toc-item">
            <span className="toc-title">Valuation Summary</span>
            <span className="toc-dots"></span>
            <span className="toc-page">5</span>
          </div>
          <div className="toc-item">
            <span className="toc-title">Company Profile</span>
            <span className="toc-dots"></span>
            <span className="toc-page">7</span>
          </div>
          <div className="toc-item">
            <span className="toc-title">Financial Analysis</span>
            <span className="toc-dots"></span>
            <span className="toc-page">9</span>
          </div>
          <div className="toc-item">
            <span className="toc-title">Valuation Analysis</span>
            <span className="toc-dots"></span>
            <span className="toc-page">12</span>
          </div>
          <div className="toc-item toc-subitem">
            <span className="toc-title">Asset Approach</span>
            <span className="toc-dots"></span>
            <span className="toc-page">13</span>
          </div>
          <div className="toc-item toc-subitem">
            <span className="toc-title">Income Approach</span>
            <span className="toc-dots"></span>
            <span className="toc-page">15</span>
          </div>
          <div className="toc-item toc-subitem">
            <span className="toc-title">Market Approach</span>
            <span className="toc-dots"></span>
            <span className="toc-page">17</span>
          </div>
          <div className="toc-item">
            <span className="toc-title">Risk Assessment</span>
            <span className="toc-dots"></span>
            <span className="toc-page">19</span>
          </div>
          <div className="toc-item">
            <span className="toc-title">Strategic Insights & Recommendations</span>
            <span className="toc-dots"></span>
            <span className="toc-page">21</span>
          </div>
          <div className="toc-item">
            <span className="toc-title">Appendices</span>
            <span className="toc-dots"></span>
            <span className="toc-page">23</span>
          </div>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="pdf-page">
        <h1 className="pdf-section-title">Executive Summary</h1>
        
        <div className="pdf-section">
          <h2 className="pdf-subsection-title">Valuation Conclusion</h2>
          <div className="highlight-box">
            <div className="highlight-row">
              <div className="highlight-label">Concluded Value</div>
              <div className="highlight-value">{formatCurrency(reportData.valuation_amount)}</div>
            </div>
            <div className="highlight-row">
              <div className="highlight-label">Value Range</div>
              <div className="highlight-value-secondary">
                {formatCurrency(reportData.valuation_range_low)} - {formatCurrency(reportData.valuation_range_high)}
              </div>
            </div>
            <div className="highlight-row">
              <div className="highlight-label">Valuation Date</div>
              <div className="highlight-value-secondary">{reportData.valuation_date || generatedDate}</div>
            </div>
            <div className="highlight-row">
              <div className="highlight-label">Standard of Value</div>
              <div className="highlight-value-secondary">{reportData.standard_of_value || 'Fair Market Value'}</div>
            </div>
          </div>
        </div>

        {reportData.executive_summary && (
          <div className="pdf-section">
            <div className="pdf-content" dangerouslySetInnerHTML={{ __html: convertMarkdownToHTML(reportData.executive_summary) }} />
          </div>
        )}

        {reportData.key_findings && reportData.key_findings.length > 0 && (
          <div className="pdf-section">
            <h2 className="pdf-subsection-title">Key Findings</h2>
            <ul className="pdf-list">
              {reportData.key_findings.map((finding: string, index: number) => (
                <li key={index} className="pdf-list-item">{finding}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Valuation Summary */}
      <div className="pdf-page">
        <h1 className="pdf-section-title">Valuation Summary</h1>
        
        <div className="pdf-section">
          <h2 className="pdf-subsection-title">Valuation Methodology</h2>
          <p className="pdf-paragraph">
            {reportData.valuation_method || 'This valuation was conducted using a weighted average of three standard valuation approaches: Asset Approach, Income Approach, and Market Approach.'}
          </p>
        </div>

        {/* Valuation Approaches Table */}
        {(reportData.asset_approach_value && reportData.income_approach_value && reportData.market_approach_value) && (
          <div className="pdf-section">
            <h2 className="pdf-subsection-title">Valuation Approaches Breakdown</h2>
            <table className="pdf-table">
              <thead>
                <tr>
                  <th>Approach</th>
                  <th className="text-right">Value</th>
                  <th className="text-right">Weight</th>
                  <th className="text-right">Weighted Value</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="font-semibold">Asset Approach</td>
                  <td className="text-right">{formatCurrency(reportData.asset_approach_value)}</td>
                  <td className="text-right">{formatPercent(reportData.asset_approach_weight)}</td>
                  <td className="text-right font-semibold">
                    {formatCurrency(reportData.asset_approach_value * reportData.asset_approach_weight)}
                  </td>
                </tr>
                <tr>
                  <td className="font-semibold">Income Approach</td>
                  <td className="text-right">{formatCurrency(reportData.income_approach_value)}</td>
                  <td className="text-right">{formatPercent(reportData.income_approach_weight)}</td>
                  <td className="text-right font-semibold">
                    {formatCurrency(reportData.income_approach_value * reportData.income_approach_weight)}
                  </td>
                </tr>
                <tr>
                  <td className="font-semibold">Market Approach</td>
                  <td className="text-right">{formatCurrency(reportData.market_approach_value)}</td>
                  <td className="text-right">{formatPercent(reportData.market_approach_weight)}</td>
                  <td className="text-right font-semibold">
                    {formatCurrency(reportData.market_approach_value * reportData.market_approach_weight)}
                  </td>
                </tr>
                <tr className="table-total-row">
                  <td colSpan={3} className="font-bold">Final Valuation (Weighted Average)</td>
                  <td className="text-right font-bold text-blue">{formatCurrency(reportData.valuation_amount)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Industry & Multiples */}
        {(reportData.industry_name || reportData.revenue_multiple_used || reportData.ebitda_multiple_used) && (
          <div className="pdf-section">
            <h2 className="pdf-subsection-title">Industry Classification & Multiples</h2>
            <div className="info-grid">
              {reportData.industry_name && (
                <div className="info-box">
                  <div className="info-label">Industry</div>
                  <div className="info-value">{reportData.industry_name}</div>
                  {reportData.industry_naics_code && (
                    <div className="info-subtext">NAICS: {reportData.industry_naics_code}</div>
                  )}
                </div>
              )}
              {reportData.revenue_multiple_used && (
                <div className="info-box">
                  <div className="info-label">Revenue Multiple</div>
                  <div className="info-value">{reportData.revenue_multiple_used.toFixed(2)}x</div>
                  {reportData.annual_revenue && (
                    <div className="info-subtext">{formatCurrency(reportData.annual_revenue)} revenue</div>
                  )}
                </div>
              )}
              {reportData.ebitda_multiple_used && (
                <div className="info-box">
                  <div className="info-label">EBITDA Multiple</div>
                  <div className="info-value">{reportData.ebitda_multiple_used.toFixed(2)}x</div>
                  {reportData.normalized_ebitda && (
                    <div className="info-subtext">{formatCurrency(reportData.normalized_ebitda)} EBITDA</div>
                  )}
                </div>
              )}
              {reportData.sde_multiple_used && (
                <div className="info-box">
                  <div className="info-label">SDE Multiple</div>
                  <div className="info-value">{reportData.sde_multiple_used.toFixed(2)}x</div>
                  {reportData.normalized_sde && (
                    <div className="info-subtext">{formatCurrency(reportData.normalized_sde)} SDE</div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Company Profile */}
      {reportData.company_profile && (
        <div className="pdf-page">
          <h1 className="pdf-section-title">Company Profile</h1>
          <div className="pdf-content" dangerouslySetInnerHTML={{ __html: convertMarkdownToHTML(reportData.company_profile) }} />
        </div>
      )}

      {/* Financial Analysis */}
      {reportData.financial_analysis && (
        <div className="pdf-page">
          <h1 className="pdf-section-title">Financial Analysis</h1>
          <div className="pdf-content" dangerouslySetInnerHTML={{ __html: convertMarkdownToHTML(reportData.financial_analysis) }} />
          
          {reportData.industry_analysis && (
            <div className="pdf-section mt-8">
              <h2 className="pdf-subsection-title">Industry Analysis</h2>
              <div className="pdf-content" dangerouslySetInnerHTML={{ __html: convertMarkdownToHTML(reportData.industry_analysis) }} />
            </div>
          )}
        </div>
      )}

      {/* Valuation Analysis - Asset Approach */}
      {reportData.asset_approach_analysis && (
        <div className="pdf-page">
          <h1 className="pdf-section-title">Valuation Analysis</h1>
          <h2 className="pdf-subsection-title">Asset Approach</h2>
          <div className="approach-value-box">
            <span className="approach-label">Indicated Value:</span>
            <span className="approach-value">{formatCurrency(reportData.asset_approach_value)}</span>
          </div>
          <div className="pdf-content" dangerouslySetInnerHTML={{ __html: convertMarkdownToHTML(reportData.asset_approach_analysis) }} />
        </div>
      )}

      {/* Income Approach */}
      {reportData.income_approach_analysis && (
        <div className="pdf-page">
          <h2 className="pdf-subsection-title">Income Approach</h2>
          <div className="approach-value-box">
            <span className="approach-label">Indicated Value:</span>
            <span className="approach-value">{formatCurrency(reportData.income_approach_value)}</span>
          </div>
          <div className="pdf-content" dangerouslySetInnerHTML={{ __html: convertMarkdownToHTML(reportData.income_approach_analysis) }} />
        </div>
      )}

      {/* Market Approach */}
      {reportData.market_approach_analysis && (
        <div className="pdf-page">
          <h2 className="pdf-subsection-title">Market Approach</h2>
          <div className="approach-value-box">
            <span className="approach-label">Indicated Value:</span>
            <span className="approach-value">{formatCurrency(reportData.market_approach_value)}</span>
          </div>
          <div className="pdf-content" dangerouslySetInnerHTML={{ __html: convertMarkdownToHTML(reportData.market_approach_analysis) }} />
        </div>
      )}

      {/* Valuation Reconciliation */}
      {reportData.valuation_reconciliation && (
        <div className="pdf-page">
          <h2 className="pdf-subsection-title">Valuation Reconciliation</h2>
          <div className="pdf-content" dangerouslySetInnerHTML={{ __html: convertMarkdownToHTML(reportData.valuation_reconciliation) }} />
        </div>
      )}

      {/* Discounts and Premiums */}
      {reportData.discounts_and_premiums && (
        <div className="pdf-page">
          <h2 className="pdf-subsection-title">Discounts and Premiums</h2>
          <div className="pdf-content" dangerouslySetInnerHTML={{ __html: convertMarkdownToHTML(reportData.discounts_and_premiums) }} />
        </div>
      )}

      {/* Risk Assessment */}
      {reportData.risk_assessment && (
        <div className="pdf-page">
          <h1 className="pdf-section-title">Risk Assessment</h1>
          <div className="pdf-content" dangerouslySetInnerHTML={{ __html: convertMarkdownToHTML(reportData.risk_assessment) }} />
          
          {reportData.critical_risk_factors && reportData.critical_risk_factors.length > 0 && (
            <div className="pdf-section mt-6">
              <h2 className="pdf-subsection-title">Critical Risk Factors</h2>
              <ul className="pdf-list">
                {reportData.critical_risk_factors.map((risk: string, index: number) => (
                  <li key={index} className="pdf-list-item risk-item">{risk}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Strategic Insights */}
      {reportData.strategic_insights && (
        <div className="pdf-page">
          <h1 className="pdf-section-title">Strategic Insights & Recommendations</h1>
          <div className="pdf-content" dangerouslySetInnerHTML={{ __html: convertMarkdownToHTML(reportData.strategic_insights) }} />
          
          {reportData.value_enhancement_recommendations && reportData.value_enhancement_recommendations.length > 0 && (
            <div className="pdf-section mt-6">
              <h2 className="pdf-subsection-title">Value Enhancement Recommendations</h2>
              <ul className="pdf-list">
                {reportData.value_enhancement_recommendations.map((rec: string, index: number) => (
                  <li key={index} className="pdf-list-item recommendation-item">{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Appendices */}
      <div className="pdf-page">
        <h1 className="pdf-section-title">Appendices</h1>
        
        {reportData.assumptions_and_limiting_conditions && (
          <div className="pdf-section">
            <h2 className="pdf-subsection-title">Assumptions and Limiting Conditions</h2>
            <div className="pdf-content small-text" dangerouslySetInnerHTML={{ __html: convertMarkdownToHTML(reportData.assumptions_and_limiting_conditions) }} />
          </div>
        )}

        {reportData.data_sources && (
          <div className="pdf-section mt-6">
            <h2 className="pdf-subsection-title">Data Sources</h2>
            <div className="pdf-content small-text" dangerouslySetInnerHTML={{ __html: convertMarkdownToHTML(reportData.data_sources) }} />
          </div>
        )}

        {reportData.methodology_compliance && (
          <div className="pdf-section mt-6">
            <h2 className="pdf-subsection-title">Methodology Compliance</h2>
            <div className="pdf-content small-text" dangerouslySetInnerHTML={{ __html: convertMarkdownToHTML(reportData.methodology_compliance) }} />
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function to convert markdown to HTML (basic implementation)
function convertMarkdownToHTML(markdown: string): string {
  if (!markdown) return '';
  
  let html = markdown;
  
  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
  
  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Italic
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Lists
  html = html.replace(/^\* (.*$)/gim, '<li>$1</li>');
  html = html.replace(/^\- (.*$)/gim, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
  
  // Paragraphs
  html = html.split('\n\n').map(para => {
    if (para.startsWith('<h') || para.startsWith('<ul') || para.startsWith('<li')) {
      return para;
    }
    return `<p>${para}</p>`;
  }).join('\n');
  
  // Line breaks
  html = html.replace(/\n/g, '<br/>');
  
  return html;
}
