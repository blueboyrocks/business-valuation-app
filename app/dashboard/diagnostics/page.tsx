'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createBrowserClient } from '@/lib/supabase/client';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, XCircle, Clock, AlertCircle, RefreshCw, Activity, Database, Cloud, Key, FileText } from 'lucide-react';
import { ErrorLogsViewer } from '@/components/ErrorLogsViewer';

interface HealthCheck {
  name: string;
  status: 'checking' | 'success' | 'error' | 'warning';
  message: string;
  details?: string;
  timestamp?: Date;
}

export default function DiagnosticsPage() {
  const { user, session, profile } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([]);
  const [runningHealthCheck, setRunningHealthCheck] = useState(false);

  const fetchData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const supabase = createBrowserClient();

      const { data: reportsData } = await supabase
        .from('reports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      const { data: docsData } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      setReports(reportsData || []);
      setDocuments(docsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const runHealthChecks = async () => {
    setRunningHealthCheck(true);
    const checks: HealthCheck[] = [];

    const updateCheck = (check: HealthCheck) => {
      checks.push({ ...check, timestamp: new Date() });
      setHealthChecks([...checks]);
    };

    updateCheck({
      name: 'Authentication',
      status: 'checking',
      message: 'Verifying user session...',
    });

    if (!user || !session) {
      updateCheck({
        name: 'Authentication',
        status: 'error',
        message: 'No active user session',
        details: 'User is not authenticated or session has expired',
      });
      setRunningHealthCheck(false);
      return;
    }

    updateCheck({
      name: 'Authentication',
      status: 'success',
      message: 'User authenticated successfully',
      details: `User ID: ${user.id}\nEmail: ${user.email}\nSession expires: ${new Date(session.expires_at! * 1000).toLocaleString()}`,
    });

    updateCheck({
      name: 'Profile Data',
      status: 'checking',
      message: 'Checking profile information...',
    });

    if (!profile) {
      updateCheck({
        name: 'Profile Data',
        status: 'warning',
        message: 'Profile not loaded',
        details: 'User profile data is not available',
      });
    } else {
      updateCheck({
        name: 'Profile Data',
        status: 'success',
        message: 'Profile loaded successfully',
        details: `Name: ${profile.full_name || 'Not set'}\nCompany: ${profile.company || 'Not set'}`,
      });
    }

    updateCheck({
      name: 'Database Connection',
      status: 'checking',
      message: 'Testing database connectivity...',
    });

    try {
      const supabase = createBrowserClient();
      const { data, error } = await supabase
        .from('reports')
        .select('id')
        .limit(1);

      if (error) {
        updateCheck({
          name: 'Database Connection',
          status: 'error',
          message: 'Database query failed',
          details: `Error: ${error.message}\nCode: ${error.code || 'N/A'}`,
        });
      } else {
        updateCheck({
          name: 'Database Connection',
          status: 'success',
          message: 'Database accessible',
          details: 'Successfully queried reports table',
        });
      }
    } catch (error: any) {
      updateCheck({
        name: 'Database Connection',
        status: 'error',
        message: 'Database connection failed',
        details: error.message || 'Unknown error',
      });
    }

    updateCheck({
      name: 'Storage Access',
      status: 'checking',
      message: 'Testing storage permissions...',
    });

    try {
      const supabase = createBrowserClient();
      const testFileName = `test-${Date.now()}.txt`;
      const testFilePath = `${user.id}/${testFileName}`;
      const testContent = new Blob(['Health check test'], { type: 'text/plain' });

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(testFilePath, testContent, {
          contentType: 'text/plain',
          upsert: false,
        });

      if (uploadError) {
        updateCheck({
          name: 'Storage Access',
          status: 'error',
          message: 'Storage upload failed',
          details: `Error: ${uploadError.message}\nThis will prevent document uploads from working.`,
        });
      } else {
        updateCheck({
          name: 'Storage Access',
          status: 'success',
          message: 'Storage accessible',
          details: 'Successfully uploaded and deleted test file',
        });

        await supabase.storage.from('documents').remove([testFilePath]);
      }
    } catch (error: any) {
      updateCheck({
        name: 'Storage Access',
        status: 'error',
        message: 'Storage test failed',
        details: error.message || 'Unknown error',
      });
    }

    updateCheck({
      name: 'API Routes',
      status: 'checking',
      message: 'Testing API connectivity...',
    });

    try {
      const { data: { session: currentSession } } = await createBrowserClient().auth.getSession();
      const token = currentSession?.access_token;

      if (!token) {
        updateCheck({
          name: 'API Routes',
          status: 'error',
          message: 'No access token available',
          details: 'Cannot authenticate API requests',
        });
      } else {
        const response = await fetch('/api/reports/test/status', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok || response.status === 404) {
          updateCheck({
            name: 'API Routes',
            status: 'success',
            message: 'API routes accessible',
            details: 'Successfully connected to API endpoints',
          });
        } else {
          updateCheck({
            name: 'API Routes',
            status: 'warning',
            message: `API responded with status ${response.status}`,
            details: 'API may have connectivity issues',
          });
        }
      }
    } catch (error: any) {
      updateCheck({
        name: 'API Routes',
        status: 'error',
        message: 'API connection failed',
        details: error.message || 'Unknown error',
      });
    }

    updateCheck({
      name: 'Environment Configuration',
      status: 'checking',
      message: 'Verifying environment variables...',
    });

    const missingEnvVars: string[] = [];
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) missingEnvVars.push('NEXT_PUBLIC_SUPABASE_URL');
    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) missingEnvVars.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');

    if (missingEnvVars.length > 0) {
      updateCheck({
        name: 'Environment Configuration',
        status: 'error',
        message: 'Missing environment variables',
        details: `Missing: ${missingEnvVars.join(', ')}`,
      });
    } else {
      updateCheck({
        name: 'Environment Configuration',
        status: 'success',
        message: 'Environment configured correctly',
        details: 'All required environment variables are present',
      });
    }

    updateCheck({
      name: 'OpenAI Connection',
      status: 'checking',
      message: 'Testing OpenAI API and Assistant...',
    });

    try {
      const response = await fetch('/api/test-openai', {
        method: 'GET',
      });

      const result = await response.json();

      if (result.success) {
        updateCheck({
          name: 'OpenAI Connection',
          status: 'success',
          message: 'OpenAI API connected',
          details: `Assistant: ${result.assistant.name || result.assistant.id}\nModel: ${result.assistant.model}\nAssistant ID: ${result.assistant.id}`,
        });
      } else {
        updateCheck({
          name: 'OpenAI Connection',
          status: 'error',
          message: result.error || 'OpenAI connection failed',
          details: result.details || 'Could not connect to OpenAI API',
        });
      }
    } catch (error: any) {
      updateCheck({
        name: 'OpenAI Connection',
        status: 'error',
        message: 'OpenAI test failed',
        details: error.message || 'Unknown error',
      });
    }

    setRunningHealthCheck(false);
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'processing':
        return <Clock className="h-5 w-5 text-blue-600 animate-pulse" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-slate-400" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-slate-400" />;
    }
  };

  const getHealthIcon = (status: HealthCheck['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'checking':
        return <Clock className="h-5 w-5 text-blue-600 animate-spin" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getTimeSince = (dateString: string) => {
    const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">System Diagnostics</h1>
              <p className="text-slate-600 mt-1">Monitor system health and troubleshoot issues</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={runHealthChecks} variant="default" disabled={runningHealthCheck}>
                <Activity className={`mr-2 h-4 w-4 ${runningHealthCheck ? 'animate-pulse' : ''}`} />
                Run Health Checks
              </Button>
              <Button onClick={fetchData} variant="outline" disabled={loading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {user && (
            <Alert>
              <Key className="h-4 w-4" />
              <AlertTitle>Current Session</AlertTitle>
              <AlertDescription>
                <div className="text-sm space-y-1 mt-2">
                  <p><strong>User ID:</strong> {user.id}</p>
                  <p><strong>Email:</strong> {user.email}</p>
                  <p><strong>Name:</strong> {profile?.full_name || 'Not set'}</p>
                  {session && (
                    <p><strong>Session expires:</strong> {new Date(session.expires_at! * 1000).toLocaleString()}</p>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {healthChecks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>System Health Checks</CardTitle>
                <CardDescription>Comprehensive system validation results</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {healthChecks.map((check, index) => (
                    <div
                      key={index}
                      className="border border-slate-200 rounded-lg p-4"
                    >
                      <div className="flex items-start gap-3">
                        {getHealthIcon(check.status)}
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-semibold text-slate-900">{check.name}</h3>
                            <Badge
                              variant={
                                check.status === 'success' ? 'outline' :
                                check.status === 'error' ? 'destructive' :
                                check.status === 'warning' ? 'secondary' : 'default'
                              }
                            >
                              {check.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600 mb-2">{check.message}</p>
                          {check.details && (
                            <pre className="text-xs bg-slate-50 p-2 rounded border border-slate-200 whitespace-pre-wrap">
                              {check.details}
                            </pre>
                          )}
                          {check.timestamp && (
                            <p className="text-xs text-slate-500 mt-2">
                              Checked: {check.timestamp.toLocaleTimeString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Recent Reports</CardTitle>
              <CardDescription>Status of your valuation reports</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-slate-600 text-center py-8">Loading...</p>
              ) : reports.length === 0 ? (
                <p className="text-slate-600 text-center py-8">No reports found</p>
              ) : (
                <div className="space-y-3">
                  {reports.map((report) => (
                    <div
                      key={report.id}
                      className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {getStatusIcon(report.report_status)}
                            <h3 className="font-semibold text-slate-900">{report.company_name}</h3>
                            <Badge variant="outline">{report.report_status}</Badge>
                          </div>
                          <div className="text-sm text-slate-600 space-y-1">
                            <p>ID: {report.id}</p>
                            <p>Created: {formatDate(report.created_at)} ({getTimeSince(report.created_at)})</p>
                            {report.processing_started_at && (
                              <p>
                                Processing started: {formatDate(report.processing_started_at)} (
                                {getTimeSince(report.processing_started_at)})
                              </p>
                            )}
                            {report.processing_completed_at && (
                              <p>
                                Completed: {formatDate(report.processing_completed_at)} (
                                {getTimeSince(report.processing_completed_at)})
                              </p>
                            )}
                            {report.error_message && (
                              <p className="text-red-600 font-medium">Error: {report.error_message}</p>
                            )}
                            {report.valuation_amount && (
                              <p className="text-green-600 font-medium">
                                Valuation: ${report.valuation_amount.toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => (window.location.href = `/dashboard/reports/${report.id}`)}
                        >
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Documents</CardTitle>
              <CardDescription>Uploaded documents</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-slate-600 text-center py-8">Loading...</p>
              ) : documents.length === 0 ? (
                <p className="text-slate-600 text-center py-8">No documents found</p>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 border border-slate-200 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-slate-900">{doc.file_name}</p>
                        <p className="text-sm text-slate-600">
                          Company: {doc.company_name} | Size: {(doc.file_size / 1024 / 1024).toFixed(2)} MB | Uploaded: {getTimeSince(doc.created_at)}
                        </p>
                        <p className="text-xs text-slate-500">Path: {doc.file_path}</p>
                      </div>
                      <Badge variant={doc.upload_status === 'completed' ? 'outline' : 'secondary'}>
                        {doc.upload_status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <ErrorLogsViewer />

          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle>Troubleshooting Guide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="font-semibold text-slate-900 mb-2">Before Reporting an Issue:</p>
                <ol className="list-decimal list-inside text-slate-700 space-y-1 ml-2">
                  <li>Click "Run Health Checks" button above to diagnose system issues</li>
                  <li>Check if all health checks show "success" status</li>
                  <li>Review any error messages in the health check results</li>
                  <li>Check your browser console (F12) for JavaScript errors</li>
                </ol>
              </div>
              <div>
                <p className="font-semibold text-slate-900 mb-2">Common Issues:</p>
                <ul className="list-disc list-inside text-slate-700 space-y-1 ml-2">
                  <li><strong>Storage Access Failed:</strong> This prevents uploads. Try logging out and back in.</li>
                  <li><strong>API Routes Error:</strong> Backend services may be unavailable. Wait a moment and refresh.</li>
                  <li><strong>Database Connection Failed:</strong> Network issue or permissions problem. Check your internet connection.</li>
                  <li><strong>Report Stuck on "Processing":</strong> Analysis takes 10-15 minutes. Check back after that time.</li>
                  <li><strong>Report Status "Failed":</strong> Check the error message above for specific details.</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-slate-900 mb-2">If Issues Persist:</p>
                <ul className="list-disc list-inside text-slate-700 space-y-1 ml-2">
                  <li>Take a screenshot of the health check results</li>
                  <li>Note the Report ID from the "Recent Reports" section</li>
                  <li>Check browser console for errors (Press F12, go to Console tab)</li>
                  <li>Try using a different browser or incognito/private mode</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
