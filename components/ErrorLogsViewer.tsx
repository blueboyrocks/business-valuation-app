'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Download, Trash2, RefreshCw } from 'lucide-react';
import { getStoredErrorLogs, clearErrorLogs, exportErrorLogs } from '@/lib/errorLogger';

interface ErrorLog {
  timestamp: Date;
  error: Error | string;
  context: string;
  userId?: string;
  additionalData?: Record<string, any>;
  stackTrace?: string;
}

export function ErrorLogsViewer() {
  const [logs, setLogs] = useState<ErrorLog[]>([]);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const loadLogs = () => {
    const storedLogs = getStoredErrorLogs();
    setLogs(storedLogs);
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const handleClearLogs = () => {
    if (confirm('Are you sure you want to clear all error logs? This cannot be undone.')) {
      clearErrorLogs();
      setLogs([]);
    }
  };

  const handleExportLogs = () => {
    const logsJson = exportErrorLogs();
    const blob = new Blob([logsJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `error-logs-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpanded(newExpanded);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleString();
  };

  if (logs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error Logs</CardTitle>
          <CardDescription>No errors recorded</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-600">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <p>No error logs found. This is good news!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Error Logs</CardTitle>
            <CardDescription>
              {logs.length} error{logs.length !== 1 ? 's' : ''} recorded
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button onClick={loadLogs} variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button onClick={handleExportLogs} variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button onClick={handleClearLogs} variant="outline" size="sm">
              <Trash2 className="mr-2 h-4 w-4" />
              Clear
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {logs.map((log, index) => (
            <div
              key={index}
              className="border border-red-200 bg-red-50 rounded-lg p-4 cursor-pointer hover:bg-red-100 transition-colors"
              onClick={() => toggleExpanded(index)}
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-slate-900">{log.context}</h3>
                    <Badge variant="destructive">Error</Badge>
                  </div>
                  <p className="text-sm text-red-800 mb-2">
                    {typeof log.error === 'string' ? log.error : log.error.toString()}
                  </p>
                  <p className="text-xs text-slate-600">
                    {formatDate(log.timestamp)}
                    {log.userId && ` • User: ${log.userId}`}
                  </p>

                  {expanded.has(index) && (
                    <div className="mt-3 space-y-2">
                      {log.stackTrace && (
                        <div>
                          <p className="text-xs font-semibold text-slate-700 mb-1">Stack Trace:</p>
                          <pre className="text-xs bg-white p-2 rounded border border-red-200 overflow-x-auto">
                            {log.stackTrace}
                          </pre>
                        </div>
                      )}
                      {log.additionalData && Object.keys(log.additionalData).length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-slate-700 mb-1">Additional Data:</p>
                          <pre className="text-xs bg-white p-2 rounded border border-red-200 overflow-x-auto">
                            {JSON.stringify(log.additionalData, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
