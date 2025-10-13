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
import { Input } from '@/components/ui/input';
import { FileText, Search, Upload, Clock, CheckCircle, XCircle, TrendingUp } from 'lucide-react';
import type { Database } from '@/lib/supabase/types';

type Report = Database['public']['Tables']['reports']['Row'];

export default function ReportsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user) {
      fetchReports();
    }
  }, [user]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredReports(reports);
    } else {
      const filtered = reports.filter((report) =>
        report.company_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredReports(filtered);
    }
  }, [searchQuery, reports]);

  const fetchReports = async () => {
    try {
      const supabase = createBrowserClient();
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const reportsData: Report[] = data || [];
      setReports(reportsData);
      setFilteredReports(reportsData);
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
      completed: { variant: 'outline', icon: <CheckCircle className="h-3 w-3 mr-1 text-green-600" /> },
      failed: { variant: 'destructive', icon: <XCircle className="h-3 w-3 mr-1" /> },
    };

    const { variant, icon } = variants[status];

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

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Valuation Reports</h1>
              <p className="text-slate-600 mt-1">
                View and manage all your business valuation reports
              </p>
            </div>
            <Button asChild>
              <Link href="/dashboard/upload">
                <Upload className="mr-2 h-4 w-4" />
                New Report
              </Link>
            </Button>
          </div>

          {/* Search */}
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by company name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Reports list */}
          <Card>
            <CardHeader>
              <CardTitle>All Reports</CardTitle>
              <CardDescription>
                {loading ? 'Loading...' : `${filteredReports.length} report${filteredReports.length !== 1 ? 's' : ''}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="p-4 border border-slate-200 rounded-lg">
                      <div className="flex items-start justify-between mb-4">
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-5 w-48" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                        <Skeleton className="h-6 w-24" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredReports.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">
                    {searchQuery ? 'No reports found' : 'No reports yet'}
                  </h3>
                  <p className="text-slate-600 mb-6">
                    {searchQuery
                      ? 'Try adjusting your search terms'
                      : 'Get started by uploading your financial documents'}
                  </p>
                  {!searchQuery && (
                    <Button asChild>
                      <Link href="/dashboard/upload">
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Documents
                      </Link>
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredReports.map((report) => (
                    <Link
                      key={report.id}
                      href={`/dashboard/reports/${report.id}`}
                      className="block p-4 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-slate-900 mb-1">
                            {report.company_name}
                          </h3>
                          <p className="text-sm text-slate-600">
                            Created {formatDate(report.created_at)}
                          </p>
                        </div>
                        {getStatusBadge(report.report_status)}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-slate-600">Valuation Amount:</span>
                          <span className="ml-2 font-medium text-slate-900">
                            {formatCurrency(report.valuation_amount)}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-600">Method:</span>
                          <span className="ml-2 font-medium text-slate-900">
                            {report.valuation_method || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
