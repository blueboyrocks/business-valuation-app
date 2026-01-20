'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { createBrowserClient } from '@/lib/supabase/client';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Upload, TrendingUp, Clock, CheckCircle, XCircle } from 'lucide-react';
import type { Database } from '@/lib/supabase/types';

type Report = Database['public']['Tables']['reports']['Row'];

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    processing: 0,
    pending: 0,
  });

  useEffect(() => {
    if (user) {
      fetchReports();
    }
  }, [user]);

  const fetchReports = async () => {
    try {
      const supabase = createBrowserClient();
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      const reportsData: Report[] = data || [];
      setReports(reportsData);

      const total = reportsData.length;
      const completed = reportsData.filter((r) => r.report_status === 'completed').length;
      const processing = reportsData.filter((r) => r.report_status === 'processing').length;
      const pending = reportsData.filter((r) => r.report_status === 'pending').length;

      setStats({ total, completed, processing, pending });
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: Report['report_status']) => {
    const variants: Record<Report['report_status'], { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
      pending: { variant: 'secondary', icon: <Clock className="h-3 w-3 mr-1" /> },
      processing: { variant: 'default', icon: <TrendingUp className="h-3 w-3 mr-1" /> },
      extracting: { variant: 'default', icon: <TrendingUp className="h-3 w-3 mr-1" /> },
      extraction_complete: { variant: 'default', icon: <TrendingUp className="h-3 w-3 mr-1" /> },
      extraction_partial: { variant: 'default', icon: <TrendingUp className="h-3 w-3 mr-1" /> },
      extraction_failed: { variant: 'destructive', icon: <XCircle className="h-3 w-3 mr-1" /> },
      valuating: { variant: 'default', icon: <TrendingUp className="h-3 w-3 mr-1" /> },
      valuation_failed: { variant: 'destructive', icon: <XCircle className="h-3 w-3 mr-1" /> },
      completed: { variant: 'outline', icon: <CheckCircle className="h-3 w-3 mr-1 text-green-600" /> },
      failed: { variant: 'destructive', icon: <XCircle className="h-3 w-3 mr-1" /> },
      error: { variant: 'destructive', icon: <XCircle className="h-3 w-3 mr-1" /> },
    };

    const { variant, icon } = variants[status] || variants.pending;

    return (
      <Badge variant={variant} className="flex items-center w-fit">
        {icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-8">
          {/* Welcome section */}
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Welcome back, {profile?.full_name?.split(' ')[0] || 'there'}
            </h1>
            <p className="text-slate-600 mt-1">
              Here's an overview of your valuation reports
            </p>
          </div>

          {/* Stats cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
                <FileText className="h-4 w-4 text-slate-600" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{stats.total}</div>
                    <p className="text-xs text-slate-600 mt-1">All time</p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{stats.completed}</div>
                    <p className="text-xs text-slate-600 mt-1">Ready to view</p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Processing</CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{stats.processing}</div>
                    <p className="text-xs text-slate-600 mt-1">In progress</p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <Clock className="h-4 w-4 text-slate-600" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{stats.pending}</div>
                    <p className="text-xs text-slate-600 mt-1">Awaiting analysis</p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Start a new valuation or manage existing reports</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              <Button asChild>
                <Link href="/dashboard/upload">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Documents
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/dashboard/reports">
                  <FileText className="mr-2 h-4 w-4" />
                  View All Reports
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Recent reports */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Reports</CardTitle>
              <CardDescription>Your latest valuation reports</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                      <Skeleton className="h-6 w-20" />
                    </div>
                  ))}
                </div>
              ) : reports.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No reports yet</h3>
                  <p className="text-slate-600 mb-6">
                    Get started by uploading your financial documents
                  </p>
                  <Button asChild>
                    <Link href="/dashboard/upload">
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Documents
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {reports.map((report) => (
                    <Link
                      key={report.id}
                      href={`/dashboard/reports/${report.id}`}
                      className="flex items-center justify-between p-4 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-colors"
                    >
                      <div>
                        <h4 className="font-medium text-slate-900">{report.company_name}</h4>
                        <p className="text-sm text-slate-600 mt-1">
                          Created {formatDate(report.created_at)}
                        </p>
                      </div>
                      {getStatusBadge(report.report_status)}
                    </Link>
                  ))}
                  {reports.length >= 5 && (
                    <Button variant="ghost" className="w-full" asChild>
                      <Link href="/dashboard/reports">View all reports</Link>
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
