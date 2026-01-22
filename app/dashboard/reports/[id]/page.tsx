'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createBrowserClient } from '@/lib/supabase/client';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/components/DashboardLayout';
import { EnhancedReportDisplay } from '@/components/EnhancedReportDisplay';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Download, Clock, CheckCircle, XCircle, TrendingUp, RefreshCw, StopCircle, FileText, AlertCircle } from 'lucide-react';
import type { Database } from '@/lib/supabase/types';
import Link from 'next/link';

type Report = Database['public']['Tables']['reports']['Row'];

// Pass descriptions for UI
const PASS_DESCRIPTIONS: Record<number, { name: string; description: string }> = {
  1: { name: 'Document Classification', description: 'Analyzing documents and extracting company profile...' },
  2: { name: 'Income Statement', description: 'Extracting income statement data from tax returns...' },
  3: { name: 'Balance Sheet', description: 'Extracting balance sheet and working capital data...' },
  4: { name: 'Industry Analysis', description: 'Analyzing industry context and benchmarks...' },
  5: { name: 'Earnings Normalization', description: 'Calculating normalized SDE and EBITDA...' },
  6: { name: 'Risk Assessment', description: 'Evaluating business risk factors...' },
  7: { name: 'Asset Approach', description: 'Calculating asset-based valuation...' },
  8: { name: 'Income Approach', description: 'Calculating income-based valuation...' },
  9: { name: 'Market Approach', description: 'Calculating market-based valuation...' },
  10: { name: 'Value Synthesis', description: 'Reconciling valuation approaches...' },
  11: { name: 'Narrative Generation', description: 'Writing executive summary and report narratives...' },
  12: { name: 'Quality Review', description: 'Performing final quality review and corrections...' },
};

interface ProcessingState {
  isProcessing: boolean;
  currentPass: number;
  completedPasses: number[];
  error: string | null;
  canRetry: boolean;
}

interface RegenerationState {
  canRegenerate: boolean;
  isRegenerating: boolean;
  availablePasses: number[];
  missingPasses: number[];
  error: string | null;
}

export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingState, setProcessingState] = useState<ProcessingState>({
    isProcessing: false,
    currentPass: 0,
    completedPasses: [],
    error: null,
    canRetry: false,
  });
  const processingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [regenerationState, setRegenerationState] = useState<RegenerationState>({
    canRegenerate: false,
    isRegenerating: false,
    availablePasses: [],
    missingPasses: [],
    error: null,
  });

  const fetchReport = useCallback(async () => {
    if (!params.id || !user) return;

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

      setReport(data as Report);

      // Check if we need to start or resume processing
      const reportStatus = (data as Report).report_status;
      if (reportStatus === 'pending' ||
          (reportStatus !== 'completed' && reportStatus !== 'error')) {
        // Get processing state from API
        const stateResponse = await fetch(`/api/reports/${params.id}/process-pass`);
        if (stateResponse.ok) {
          const state = await stateResponse.json();
          setProcessingState({
            isProcessing: false,
            currentPass: state.currentPass || 0,
            completedPasses: state.completedPasses || [],
            error: null,
            canRetry: state.canResume,
          });

          // Auto-start processing if pending and not already processing
          if ((reportStatus === 'pending' || state.canResume) && !processingRef.current) {
            startProcessing(state.nextPass || 1);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching report:', error);
      router.push('/dashboard/reports');
    } finally {
      setLoading(false);
    }
  }, [params.id, user, router]);

  // Start or resume processing
  const startProcessing = async (startFromPass: number = 1) => {
    if (processingRef.current) return;
    processingRef.current = true;

    const supabase = createBrowserClient();
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    if (!token) {
      setProcessingState(prev => ({ ...prev, error: 'Not authenticated', canRetry: true }));
      processingRef.current = false;
      return;
    }

    // Create abort controller for this processing session
    abortControllerRef.current = new AbortController();

    setProcessingState(prev => ({
      ...prev,
      isProcessing: true,
      error: null,
      canRetry: false,
    }));

    // Execute passes sequentially
    for (let pass = startFromPass; pass <= 12; pass++) {
      // Check if aborted
      if (abortControllerRef.current?.signal.aborted) {
        console.log('[Frontend] Processing aborted');
        break;
      }

      setProcessingState(prev => ({
        ...prev,
        currentPass: pass,
      }));

      console.log(`[Frontend] Executing Pass ${pass}/12...`);

      try {
        const response = await fetch(`/api/reports/${params.id}/process-pass?pass=${pass}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          signal: abortControllerRef.current?.signal,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Pass ${pass} failed with status ${response.status}`);
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || `Pass ${pass} failed`);
        }

        console.log(`[Frontend] Pass ${pass} complete: ${result.passName}`);

        setProcessingState(prev => ({
          ...prev,
          completedPasses: [...prev.completedPasses.filter(p => p !== pass), pass],
        }));

        // If this was the final pass, we're done
        if (result.isComplete) {
          console.log('[Frontend] All passes complete! Refreshing report...');
          setProcessingState(prev => ({
            ...prev,
            isProcessing: false,
            currentPass: 12,
          }));
          fetchReport();
          break;
        }

        // Small delay between passes to be nice to the API
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          console.log('[Frontend] Processing was cancelled');
          break;
        }

        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[Frontend] Pass ${pass} failed:`, errorMessage);

        setProcessingState(prev => ({
          ...prev,
          isProcessing: false,
          error: `Pass ${pass} (${PASS_DESCRIPTIONS[pass]?.name || 'Unknown'}) failed: ${errorMessage}`,
          canRetry: true,
        }));
        break;
      }
    }

    processingRef.current = false;
    abortControllerRef.current = null;
  };

  // Retry from failed pass
  const retryProcessing = () => {
    const nextPass = processingState.completedPasses.length > 0
      ? Math.max(...processingState.completedPasses) + 1
      : 1;
    startProcessing(nextPass);
  };

  // Cancel processing
  const cancelProcessing = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    processingRef.current = false;
    setProcessingState(prev => ({
      ...prev,
      isProcessing: false,
      error: 'Processing cancelled by user',
      canRetry: true,
    }));
  };

  // Check if report can be regenerated from existing data
  const checkRegenerationEligibility = useCallback(async () => {
    if (!params.id) return;

    try {
      const response = await fetch(`/api/reports/${params.id}/regenerate`);
      if (response.ok) {
        const data = await response.json();
        setRegenerationState(prev => ({
          ...prev,
          canRegenerate: data.canRegenerate,
          availablePasses: data.availablePasses || [],
          missingPasses: data.missingPasses || [],
        }));
      }
    } catch (error) {
      console.error('Error checking regeneration eligibility:', error);
    }
  }, [params.id]);

  // Regenerate report from existing pass outputs
  const regenerateReport = async () => {
    if (!params.id) return;

    const supabase = createBrowserClient();
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    if (!token) {
      setRegenerationState(prev => ({ ...prev, error: 'Not authenticated' }));
      return;
    }

    setRegenerationState(prev => ({ ...prev, isRegenerating: true, error: null }));

    try {
      const response = await fetch(`/api/reports/${params.id}/regenerate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to regenerate report');
      }

      console.log('[Frontend] Report regenerated successfully:', result);

      // Refresh the report data
      fetchReport();

      setRegenerationState(prev => ({
        ...prev,
        isRegenerating: false,
        error: null,
      }));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[Frontend] Regeneration failed:', errorMessage);
      setRegenerationState(prev => ({
        ...prev,
        isRegenerating: false,
        error: errorMessage,
      }));
    }
  };

  useEffect(() => {
    if (user && params.id) {
      fetchReport();
      checkRegenerationEligibility();
    }

    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [user, params.id, fetchReport, checkRegenerationEligibility]);

  const getStatusBadge = (status: Report['report_status']) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
      pending: { variant: 'secondary', icon: <Clock className="h-4 w-4 mr-1.5" /> },
      processing: { variant: 'default', icon: <TrendingUp className="h-4 w-4 mr-1.5" /> },
      completed: { variant: 'outline', icon: <CheckCircle className="h-4 w-4 mr-1.5 text-green-600" /> },
      failed: { variant: 'destructive', icon: <XCircle className="h-4 w-4 mr-1.5" /> },
      error: { variant: 'destructive', icon: <XCircle className="h-4 w-4 mr-1.5" /> },
    };

    // Handle pass-specific statuses
    const baseStatus = status.startsWith('pass_') ? 'processing' : status;
    const { variant, icon } = variants[baseStatus] || variants.pending;

    return (
      <Badge variant={variant} className="flex items-center w-fit text-sm">
        {icon}
        {status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ')}
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

  const calculateProgress = () => {
    if (processingState.completedPasses.length === 0) return 0;
    const progressMap: Record<number, number> = {
      1: 5, 2: 12, 3: 18, 4: 28, 5: 38, 6: 48,
      7: 55, 8: 62, 9: 69, 10: 78, 11: 88, 12: 100
    };
    const maxCompleted = Math.max(...processingState.completedPasses);
    return progressMap[maxCompleted] || 0;
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
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={regenerateReport}
                  disabled={regenerationState.isRegenerating}
                  title="Regenerate report from saved data (no API cost)"
                >
                  {regenerationState.isRegenerating ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  {regenerationState.isRegenerating ? 'Regenerating...' : 'Regenerate'}
                </Button>
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      const supabase = createBrowserClient();
                      const { data: { session } } = await supabase.auth.getSession();
                      const token = session?.access_token;

                      if (!token) {
                        alert('Not authenticated');
                        return;
                      }

                      const response = await fetch(`/api/reports/${params.id}/download-pdf`, {
                        method: 'POST',
                        headers: {
                          'Authorization': `Bearer ${token}`,
                        },
                      });

                      if (!response.ok) {
                        throw new Error('Failed to generate PDF');
                      }

                      const blob = await response.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${report.company_name.replace(/[^a-z0-9]/gi, '_')}_Valuation_Report.pdf`;
                      document.body.appendChild(a);
                      a.click();
                      window.URL.revokeObjectURL(url);
                      document.body.removeChild(a);
                    } catch (error) {
                      console.error('Error generating PDF:', error);
                      alert('Failed to generate PDF');
                    }
                  }}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export PDF
                </Button>
              </div>
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
                    {report.report_status.charAt(0).toUpperCase() + report.report_status.slice(1).replace(/_/g, ' ')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Report content */}
          {report.report_status === 'completed' ? (
            <>
              {report.report_data && (
                <EnhancedReportDisplay
                  reportData={report.report_data}
                  companyName={report.company_name}
                />
              )}
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
          ) : processingState.isProcessing || report.report_status === 'processing' || report.report_status.startsWith('pass_') ? (
            <Card>
              <CardContent className="py-8">
                <div className="max-w-2xl mx-auto">
                  {/* Header */}
                  <div className="text-center mb-8">
                    <TrendingUp className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-pulse" />
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">
                      Processing Valuation Report
                    </h3>
                    <p className="text-slate-600">
                      Each pass analyzes different aspects of your business
                    </p>
                  </div>

                  {/* Progress bar */}
                  <div className="mb-8">
                    <div className="flex justify-between text-sm text-slate-600 mb-2">
                      <span>Pass {processingState.currentPass || 1}/12</span>
                      <span>{calculateProgress()}% complete</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-3">
                      <div
                        className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${calculateProgress()}%` }}
                      />
                    </div>
                  </div>

                  {/* Pass list */}
                  <div className="space-y-2">
                    {Object.entries(PASS_DESCRIPTIONS).map(([passNum, { name, description }]) => {
                      const num = parseInt(passNum);
                      const isCompleted = processingState.completedPasses.includes(num);
                      const isCurrent = processingState.currentPass === num;

                      return (
                        <div
                          key={passNum}
                          className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                            isCurrent ? 'bg-blue-50 border border-blue-200' :
                            isCompleted ? 'bg-green-50' : 'bg-slate-50'
                          }`}
                        >
                          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                            isCompleted ? 'bg-green-500 text-white' :
                            isCurrent ? 'bg-blue-500 text-white animate-pulse' :
                            'bg-slate-300 text-slate-600'
                          }`}>
                            {isCompleted ? <CheckCircle className="h-5 w-5" /> : num}
                          </div>
                          <div className="flex-grow min-w-0">
                            <p className={`font-medium ${isCurrent ? 'text-blue-900' : isCompleted ? 'text-green-900' : 'text-slate-600'}`}>
                              {name}
                            </p>
                            {isCurrent && (
                              <p className="text-sm text-blue-600 truncate">
                                {description}
                              </p>
                            )}
                          </div>
                          {isCurrent && (
                            <div className="flex-shrink-0">
                              <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Cancel button */}
                  <div className="mt-8 text-center">
                    <Button
                      variant="outline"
                      onClick={cancelProcessing}
                      className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                      <StopCircle className="h-4 w-4 mr-2" />
                      Cancel Processing
                    </Button>
                  </div>
                </div>
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
                <Button onClick={() => startProcessing(1)}>
                  Start Processing
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">Processing Failed</h3>
                <p className="text-slate-600 mb-4 max-w-md mx-auto">
                  {processingState.error || report.error_message || 'An error occurred while processing your report.'}
                </p>

                {/* Show regeneration option if all passes are complete */}
                {regenerationState.canRegenerate && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg max-w-md mx-auto">
                    <div className="flex items-center gap-2 text-green-800 mb-2">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">All 12 passes completed!</span>
                    </div>
                    <p className="text-sm text-green-700 mb-3">
                      The report data is saved. You can regenerate the report without calling the API again.
                    </p>
                    <Button
                      onClick={regenerateReport}
                      disabled={regenerationState.isRegenerating}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {regenerationState.isRegenerating ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Regenerating...
                        </>
                      ) : (
                        <>
                          <FileText className="mr-2 h-4 w-4" />
                          Regenerate Report (No API Cost)
                        </>
                      )}
                    </Button>
                    {regenerationState.error && (
                      <p className="text-sm text-red-600 mt-2">{regenerationState.error}</p>
                    )}
                  </div>
                )}

                {/* Show which passes are available */}
                {!regenerationState.canRegenerate && regenerationState.availablePasses.length > 0 && (
                  <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg max-w-md mx-auto">
                    <div className="flex items-center gap-2 text-amber-800 mb-2">
                      <AlertCircle className="h-5 w-5" />
                      <span className="font-medium">Partial Progress Saved</span>
                    </div>
                    <p className="text-sm text-amber-700">
                      Passes {regenerationState.availablePasses.join(', ')} are saved.
                      {regenerationState.missingPasses.length > 0 && (
                        <> Missing: {regenerationState.missingPasses.join(', ')}.</>
                      )}
                    </p>
                  </div>
                )}

                {(processingState.canRetry || processingState.completedPasses.length > 0) && (
                  <div className="flex gap-3 justify-center flex-wrap">
                    <Button onClick={retryProcessing}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Retry from Pass {Math.max(...processingState.completedPasses, 0) + 1}
                    </Button>
                    <Button variant="outline" asChild>
                      <Link href="/dashboard/upload">Start Over</Link>
                    </Button>
                  </div>
                )}
                {!processingState.canRetry && processingState.completedPasses.length === 0 && (
                  <Button asChild>
                    <Link href="/dashboard/upload">Try Again</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
