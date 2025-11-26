'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createBrowserClient } from '@/lib/supabase/client';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ReportDisplay } from '@/components/ReportDisplay';
import { EnhancedReportDisplay } from '@/components/EnhancedReportDisplay';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Download, Clock, CheckCircle, XCircle, TrendingUp } from 'lucide-react';
import type { Database } from '@/lib/supabase/types';
import Link from 'next/link';

type Report = Database['public']['Tables']['reports']['Row'];

export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusData, setStatusData] = useState<any>(null);
  const [isPolling, setIsPolling] = useState(false);

  const fetchReportStatus = useCallback(async () => {
    if (!params.id || !user) return;

    try {
      const supabase = createBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) return;

      // Call the process endpoint to advance OpenAI processing
      const processResponse = await fetch(`/api/reports/${params.id}/process`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (processResponse.ok) {
        const processData = await processResponse.json();
        
        // Update status data with process response
        setStatusData({
          status: processData.status,
          progressPercentage: processData.progress || 0,
          estimatedTimeRemaining: processData.message,
        });

        if (processData.status === 'completed' || processData.status === 'failed') {
          setIsPolling(false);
          fetchReport();
        }
      } else {
        // Fallback to status endpoint if process fails
        const statusResponse = await fetch(`/api/reports/${params.id}/status`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (statusResponse.ok) {
          const data = await statusResponse.json();
          setStatusData(data);

          if (data.status === 'completed' || data.status === 'failed') {
            setIsPolling(false);
            fetchReport();
          }
        }
      }
    } catch (error) {
      console.error('Error fetching report status:', error);
    }
  }, [params.id, user]);

  useEffect(() => {
    if (user && params.id) {
      fetchReport();
    }
  }, [user, params.id]);

  useEffect(() => {
    if (!report) return;

    if (report.report_status === 'pending' || report.report_status === 'processing') {
      setIsPolling(true);
      fetchReportStatus();

      const interval = setInterval(() => {
        fetchReportStatus();
      }, 15000);

      return () => clearInterval(interval);
    }
  }, [report, fetchReportStatus]);

  const fetchReport = async () => {
    try {
      const supabase = createBrowserClient();
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('id', params.id as string)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        router.push('/dashboard/reports');
        return;
      }

      setReport(data);
    } catch (error) {
      console.error('Error fetching report:', error);
      router.push('/dashboard/reports');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: Report['report_status']) => {
    const variants: Record<Report['report_status'], { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
      pending: { variant: 'secondary', icon: <Clock className="h-4 w-4 mr-1.5" /> },
      processing: { variant: 'default', icon: <TrendingUp className="h-4 w-4 mr-1.5" /> },
      completed: { variant: 'outline', icon: <CheckCircle className="h-4 w-4 mr-1.5 text-green-600" /> },
      failed: { variant: 'destructive', icon: <XCircle className="h-4 w-4 mr-1.5" /> },
    };

    const { variant, icon } = variants[status];

    return (
      <Badge variant={variant} className="flex items-center w-fit text-sm">
        {icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="space-y-6">
            <Skeleton className="h-10 w-48" />
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-48 mt-2" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (!report) {
    return null;
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" asChild>
              <Link href="/dashboard/reports">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Reports
              </Link>
            </Button>
            {report.report_status === 'completed' && (
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    // Dynamic import of jsPDF
                    const { jsPDF } = await import('jspdf');
                    
                    const supabase = createBrowserClient();
                    const { data: { session } } = await supabase.auth.getSession();
                    const token = session?.access_token;

                    if (!token) {
                      alert('Not authenticated');
                      return;
                    }

                    // Fetch report data
                    const response = await fetch(`/api/reports/${params.id}/export`, {
                      headers: {
                        'Authorization': `Bearer ${token}`,
                      },
                    });

                    if (!response.ok) {
                      throw new Error('Failed to fetch report data');
                    }

                    const responseData = await response.json();
                    console.log('Export API response:', responseData);
                    const { company_name, report_data, created_at } = responseData;
                    console.log('Generating PDF for:', company_name);
                    console.log('Report data keys:', Object.keys(report_data || {}));
                    
                    // Generate PDF using jsPDF
                    const doc = new jsPDF();
                    const pageWidth = doc.internal.pageSize.getWidth();
                    const pageHeight = doc.internal.pageSize.getHeight();
                    const margin = 20;
                    const maxWidth = pageWidth - 2 * margin;
                    let y = margin;

                    // Helper function to add text with word wrap
                    const addText = (text: string, fontSize: number, isBold: boolean = false) => {
                      doc.setFontSize(fontSize);
                      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
                      const lines = doc.splitTextToSize(text || 'N/A', maxWidth);
                      
                      // Check if we need a new page
                      if (y + (lines.length * fontSize * 0.5) > pageHeight - margin) {
                        doc.addPage();
                        y = margin;
                      }
                      
                      doc.text(lines, margin, y);
                      y += lines.length * fontSize * 0.5 + 5;
                    };

                    // Cover Page
                    doc.setFillColor(102, 126, 234);
                    doc.rect(0, 0, pageWidth, pageHeight, 'F');
                    doc.setTextColor(255, 255, 255);
                    doc.setFontSize(32);
                    doc.setFont('helvetica', 'bold');
                    doc.text('Business Valuation Report', pageWidth / 2, 80, { align: 'center' });
                    doc.setFontSize(24);
                    doc.text(company_name, pageWidth / 2, 100, { align: 'center' });
                    
                    // Value box
                    const formatCurrency = (value: number) => {
                      return new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(value);
                    };
                    
                    // Calculate estimated value as average of low and high
                    const estimatedValue = report_data.valuation_range_low && report_data.valuation_range_high 
                      ? (report_data.valuation_range_low + report_data.valuation_range_high) / 2
                      : 0;
                    
                    doc.setFontSize(16);
                    doc.text('Estimated Value', pageWidth / 2, 130, { align: 'center' });
                    doc.setFontSize(36);
                    doc.text(formatCurrency(estimatedValue), pageWidth / 2, 150, { align: 'center' });
                    doc.setFontSize(14);
                    doc.text(`Range: ${formatCurrency(report_data.valuation_range_low || 0)} - ${formatCurrency(report_data.valuation_range_high || 0)}`, pageWidth / 2, 165, { align: 'center' });
                    
                    doc.setFontSize(12);
                    doc.text(`Generated on ${new Date(created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, pageWidth / 2, 190, { align: 'center' });

                    // New page for content
                    doc.addPage();
                    doc.setTextColor(0, 0, 0);
                    y = margin;

                    // Valuation Summary
                    addText('Valuation Summary', 18, true);
                    addText(`Estimated Value: ${formatCurrency(estimatedValue)}`, 12);
                    addText(`Value Range: ${formatCurrency(report_data.valuation_range_low || 0)} - ${formatCurrency(report_data.valuation_range_high || 0)}`, 12);
                    addText(`Valuation Method: ${report_data.valuation_method || 'N/A'}`, 12);
                    addText(`Standard: ${report_data.valuation_standard || 'N/A'}`, 12);
                    addText(`Confidence Level: ${report_data.confidence_level || 'N/A'}`, 12);
                    addText(`Premise: ${report_data.valuation_premise || 'N/A'}`, 12);
                    y += 10;

                    // Executive Summary
                    doc.addPage();
                    y = margin;
                    addText('Executive Summary', 18, true);
                    addText('Company Overview', 14, true);
                    addText(report_data.company_overview, 11);
                    addText('Purpose of Valuation', 14, true);
                    addText(report_data.purpose_of_valuation, 11);
                    addText('Key Findings and Value Conclusion', 14, true);
                    addText(report_data.key_findings_and_value_conclusion, 11);
                    addText('Primary Value Drivers', 14, true);
                    addText(report_data.primary_value_drivers, 11);
                    addText('Critical Risk Factors', 14, true);
                    addText(report_data.critical_risk_factors, 11);

                    // Company Profile
                    doc.addPage();
                    y = margin;
                    addText('Company Profile', 18, true);
                    addText('Business Description', 14, true);
                    addText(report_data.business_description, 11);
                    addText('Products, Services, and Revenue Streams', 14, true);
                    addText(report_data.products_services_and_revenue_streams, 11);
                    addText('Target Markets and Customers', 14, true);
                    addText(report_data.target_markets_and_customers, 11);
                    addText('Competitive Advantages', 14, true);
                    addText(report_data.competitive_advantages, 11);

                    // Financial Analysis
                    doc.addPage();
                    y = margin;
                    addText('Financial Analysis', 18, true);
                    addText('Historical Financial Performance', 14, true);
                    addText(report_data.historical_financial_performance, 11);
                    addText('Revenue and Profitability Analysis', 14, true);
                    addText(report_data.revenue_and_profitability_analysis, 11);

                    // Valuation Analysis
                    doc.addPage();
                    y = margin;
                    addText('Valuation Analysis', 18, true);
                    addText('Valuation Approaches Overview', 14, true);
                    addText(report_data.valuation_approaches_overview, 11);
                    addText('Final Value Conclusion and Reconciliation', 14, true);
                    addText(report_data.final_value_conclusion_and_reconciliation, 11);

                    // Risk Assessment
                    doc.addPage();
                    y = margin;
                    addText('Risk Assessment', 18, true);
                    addText('Key Risks and Challenges', 14, true);
                    addText(report_data.key_risks_and_challenges, 11);
                    addText('Risk Mitigation Strategies', 14, true);
                    addText(report_data.risk_mitigation_strategies, 11);

                    // Strategic Insights & Recommendations
                    doc.addPage();
                    y = margin;
                    addText('Strategic Insights & Recommendations', 18, true);
                    addText('Market Position and Competitive Landscape', 14, true);
                    addText(report_data.market_position_and_competitive_landscape, 11);
                    addText('Growth Opportunities', 14, true);
                    addText(report_data.growth_opportunities, 11);
                    addText('Value Enhancement Recommendations', 14, true);
                    addText(report_data.value_enhancement_recommendations, 11);

                    // Save PDF
                    console.log('Saving PDF...');
                    doc.save(`${company_name.replace(/[^a-z0-9]/gi, '_')}_Valuation_Report.pdf`);
                    console.log('PDF saved successfully');
                  } catch (error) {
                    console.error('Error generating PDF:', error);
                    alert('Failed to generate PDF');
                  }
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                Export PDF
              </Button>
            )}
          </div>

          {/* Report header */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">{report.company_name}</CardTitle>
                  <CardDescription className="mt-2">
                    Created {formatDate(report.created_at)}
                  </CardDescription>
                </div>
                {getStatusBadge(report.report_status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Valuation Amount</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {formatCurrency(report.valuation_amount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-1">Valuation Method</p>
                  <p className="text-lg font-medium text-slate-900">
                    {report.valuation_method || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-1">Status</p>
                  <p className="text-lg font-medium text-slate-900">
                    {report.report_status.charAt(0).toUpperCase() + report.report_status.slice(1)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Report content */}
          {report.report_status === 'completed' ? (
            <>
              {/* Enhanced Comprehensive Report Display */}
              {report.report_data && (
                <EnhancedReportDisplay
                  reportData={report.report_data}
                  companyName={report.company_name}
                />
              )}

              {/* Fallback to Simple Display if Enhanced Data Not Available */}
              {!report.report_data && report.executive_summary && (
                <Card>
                  <CardHeader>
                    <CardTitle>Executive Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                      {report.executive_summary}
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          ) : report.report_status === 'processing' ? (
            <Card>
              <CardContent className="py-12 text-center">
                <TrendingUp className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-pulse" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  Processing Your Report
                </h3>
                <p className="text-slate-600 mb-4">
                  Our AI assistant is analyzing your documents. This typically takes 10-15 minutes.
                </p>
                {statusData && (
                  <div className="max-w-md mx-auto space-y-3">
                    <div className="w-full bg-slate-200 rounded-full h-3">
                      <div
                        className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${statusData.progressPercentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-sm text-slate-600">
                      <span>{statusData.progressPercentage}% complete</span>
                      {statusData.estimatedTimeRemaining && (
                        <span>Est. {statusData.estimatedTimeRemaining} remaining</span>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : report.report_status === 'pending' ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Clock className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">Report Pending</h3>
                <p className="text-slate-600 mb-4">
                  Your report is queued for processing and will begin shortly.
                </p>
                {statusData && statusData.estimatedTimeRemaining && (
                  <p className="text-sm text-slate-500">
                    Estimated time: {statusData.estimatedTimeRemaining}
                  </p>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">Processing Failed</h3>
                <p className="text-slate-600 mb-4">
                  {report.error_message || 'An error occurred while processing your report.'}
                </p>
                <Button asChild>
                  <Link href="/dashboard/upload">Try Again</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
