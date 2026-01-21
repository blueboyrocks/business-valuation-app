'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createBrowserClient } from '@/lib/supabase/client';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, X, Loader2, XCircle, CheckCircle2 } from 'lucide-react';
import { logError } from '@/lib/errorLogger';

interface AnalysisProgress {
  phase: 'uploading' | 'extracting' | 'valuating' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  message: string;
  extractionDetails?: {
    total: number;
    completed: number;
    failed: number;
  };
}

export default function UploadPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [companyName, setCompanyName] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [testResult, setTestResult] = useState<string>('');

  // Analysis progress tracking
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState<AnalysisProgress | null>(null);
  const [currentReportId, setCurrentReportId] = useState<string | null>(null);

  // Cancel handling
  const abortControllerRef = useRef<AbortController | null>(null);
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isCancelledRef = useRef(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      addFiles(selectedFiles);
    }
  };

  const addFiles = (newFiles: File[]) => {
    const pdfFiles = newFiles.filter((file) => file.type === 'application/pdf');

    if (pdfFiles.length !== newFiles.length) {
      toast({
        title: 'Invalid file type',
        description: 'Only PDF files are supported.',
        variant: 'destructive',
      });
    }

    const validFiles = pdfFiles.filter((file) => {
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        toast({
          title: 'File too large',
          description: `${file.name} exceeds the 10MB size limit.`,
          variant: 'destructive',
        });
        return false;
      }
      return true;
    });

    setFiles((prev) => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const testConnection = async () => {
    setTestResult('Testing storage connection...');
    try {
      const supabase = createBrowserClient();

      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        setTestResult('❌ ERROR: You are not logged in\n\n' + (authError?.message || 'No user session'));
        return;
      }

      setTestResult(`✓ Logged in as: ${user.email}\n\nTesting storage upload...`);

      const testFileName = `test-${Date.now()}.txt`;
      const testFilePath = `${user.id}/${testFileName}`;
      const testContent = new Blob(['Test upload'], { type: 'text/plain' });

      const startTime = Date.now();
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(testFilePath, testContent, {
          contentType: 'text/plain',
          upsert: false,
        });
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      if (uploadError) {
        setTestResult(`❌ UPLOAD FAILED (after ${duration}s)\n\nError: ${uploadError.message}\n\nThis is why your uploads are failing. The storage bucket may not be configured correctly or you don't have permission to upload.\n\nError details:\n${JSON.stringify(uploadError, null, 2)}`);
        return;
      }

      setTestResult(`✅ SUCCESS! (${duration}s)\n\nTest file uploaded successfully!\nPath: ${testFilePath}\n\nYour uploads should work now. Try uploading your documents.`);

      await supabase.storage.from('documents').remove([testFilePath]);
    } catch (error: any) {
      setTestResult(`❌ UNEXPECTED ERROR:\n\n${error.message}\n\n${error.stack || ''}`);
    }
  };

  // Poll for analysis status with exponential backoff
  const pollAnalysisStatus = useCallback(async (
    reportId: string,
    token: string,
    attempt: number = 0
  ) => {
    // Check if cancelled
    if (isCancelledRef.current) {
      return;
    }

    const MAX_ATTEMPTS = 60; // ~5 minutes with backoff
    const BASE_DELAY = 2000; // Start at 2 seconds
    const MAX_DELAY = 15000; // Max 15 seconds between polls

    if (attempt >= MAX_ATTEMPTS) {
      setAnalysisProgress({
        phase: 'failed',
        progress: 0,
        message: 'Analysis timed out. Please check your report page for status.',
      });
      setIsAnalyzing(false);
      return;
    }

    try {
      const response = await fetch(`/api/analyze-documents?reportId=${reportId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        signal: abortControllerRef.current?.signal,
      });

      if (!response.ok) {
        throw new Error('Failed to fetch status');
      }

      const status = await response.json();
      console.log('Analysis status:', status);

      // Update progress based on status
      const reportStatus = status.status;
      const progress = status.progress || 0;
      const message = status.message || '';
      const extraction = status.extraction;

      // Determine phase from status
      let phase: AnalysisProgress['phase'] = 'extracting';
      if (reportStatus === 'completed') {
        phase = 'completed';
      } else if (reportStatus === 'failed' || reportStatus === 'error' ||
                 reportStatus === 'extraction_failed' || reportStatus === 'valuation_failed') {
        phase = 'failed';
      } else if (reportStatus === 'valuating' || reportStatus === 'extraction_complete' ||
                 reportStatus === 'extraction_partial') {
        phase = 'valuating';
      } else if (reportStatus === 'extracting' || reportStatus === 'processing') {
        phase = 'extracting';
      }

      setAnalysisProgress({
        phase,
        progress,
        message,
        extractionDetails: extraction ? {
          total: extraction.total || 0,
          completed: extraction.completed || 0,
          failed: extraction.failed || 0,
        } : undefined,
      });

      // Check if we should stop polling
      if (phase === 'completed') {
        toast({
          title: 'Analysis complete!',
          description: 'Your valuation report is ready.',
        });
        setTimeout(() => {
          router.push(`/dashboard/reports/${reportId}`);
        }, 1500);
        setIsAnalyzing(false);
        return;
      }

      if (phase === 'failed') {
        toast({
          title: 'Analysis failed',
          description: status.error || 'An error occurred during analysis.',
          variant: 'destructive',
        });
        setIsAnalyzing(false);
        return;
      }

      // Continue polling with exponential backoff
      const delay = Math.min(BASE_DELAY * Math.pow(1.2, attempt), MAX_DELAY);
      pollingTimeoutRef.current = setTimeout(() => {
        pollAnalysisStatus(reportId, token, attempt + 1);
      }, delay);

    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        // Cancelled by user
        return;
      }

      console.error('Error polling status:', error);

      // Retry on error (network issues, etc.)
      const delay = Math.min(BASE_DELAY * Math.pow(1.5, attempt), MAX_DELAY);
      pollingTimeoutRef.current = setTimeout(() => {
        pollAnalysisStatus(reportId, token, attempt + 1);
      }, delay);
    }
  }, [router, toast]);

  // Cancel analysis
  const handleCancel = async () => {
    isCancelledRef.current = true;

    // Abort any ongoing fetch
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Clear polling timeout
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
    }

    // Update local state
    setAnalysisProgress({
      phase: 'cancelled',
      progress: 0,
      message: 'Analysis cancelled by user',
    });

    // Optionally update report status in database
    if (currentReportId) {
      try {
        const supabase = createBrowserClient();
        // Use type assertion to work around Supabase typing issue
        await (supabase
          .from('reports') as any)
          .update({
            report_status: 'cancelled',
            error_message: 'Cancelled by user',
          })
          .eq('id', currentReportId);
      } catch (error) {
        console.error('Failed to update report status:', error);
      }
    }

    toast({
      title: 'Analysis cancelled',
      description: 'The analysis has been stopped.',
    });

    setIsAnalyzing(false);
    setIsUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!companyName.trim()) {
      toast({
        title: 'Company name required',
        description: 'Please enter a company name.',
        variant: 'destructive',
      });
      return;
    }

    if (files.length === 0) {
      toast({
        title: 'No files selected',
        description: 'Please upload at least one PDF document.',
        variant: 'destructive',
      });
      return;
    }

    if (files.length > 10) {
      toast({
        title: 'Too many files',
        description: 'Maximum 10 files allowed per upload.',
        variant: 'destructive',
      });
      return;
    }

    // Reset cancel state
    isCancelledRef.current = false;
    abortControllerRef.current = new AbortController();

    setIsUploading(true);
    setAnalysisProgress({
      phase: 'uploading',
      progress: 0,
      message: `Uploading ${files.length} document${files.length > 1 ? 's' : ''} to secure storage...`,
    });

    try {
      const supabase = createBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const userId = session?.user?.id;

      if (!token || !userId) {
        throw new Error('Not authenticated');
      }

      console.log(`Starting direct Supabase upload of ${files.length} files...`);

      // Upload files directly to Supabase Storage
      const uploadedFiles: { name: string; path: string; size: number }[] = [];

      for (let i = 0; i < files.length; i++) {
        if (isCancelledRef.current) {
          throw new Error('Cancelled');
        }

        const file = files[i];
        const uploadPercent = Math.round((i / files.length) * 30);
        setAnalysisProgress({
          phase: 'uploading',
          progress: uploadPercent,
          message: `Uploading file ${i + 1} of ${files.length}: ${file.name}...`,
        });

        const timestamp = Date.now();
        const filePath = `${userId}/${timestamp}-${file.name}`;

        console.log(`Uploading ${file.name} to ${filePath}`);

        const { data, error } = await supabase.storage
          .from('documents')
          .upload(filePath, file, {
            contentType: file.type,
            upsert: false,
          });

        if (error) {
          console.error(`Failed to upload ${file.name}:`, error);
          throw new Error(`Failed to upload ${file.name}: ${error.message}`);
        }

        uploadedFiles.push({
          name: file.name,
          path: data.path,
          size: file.size,
        });

        console.log(`Successfully uploaded ${file.name}`);
      }

      if (isCancelledRef.current) {
        throw new Error('Cancelled');
      }

      setAnalysisProgress({
        phase: 'uploading',
        progress: 35,
        message: 'Files uploaded! Creating report...',
      });

      // Call API to create report with file paths
      const uploadResponse = await fetch('/api/upload-documents', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyName,
          files: uploadedFiles,
        }),
        signal: abortControllerRef.current?.signal,
      });

      console.log('Upload response status:', uploadResponse.status);

      if (!uploadResponse.ok) {
        let errorMessage = 'Upload failed';
        try {
          const contentType = uploadResponse.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await uploadResponse.json();
            console.error('Upload error:', errorData);
            errorMessage = errorData.error || 'Upload failed';
          } else {
            const errorText = await uploadResponse.text();
            console.error('Upload error (non-JSON):', errorText);
            errorMessage = errorText || `Upload failed with status ${uploadResponse.status}`;
          }
        } catch (parseError) {
          console.error('Error parsing upload response:', parseError);
          errorMessage = `Upload failed with status ${uploadResponse.status}`;
        }
        throw new Error(errorMessage);
      }

      const { reportId } = await uploadResponse.json();
      setCurrentReportId(reportId);

      if (isCancelledRef.current) {
        throw new Error('Cancelled');
      }

      setAnalysisProgress({
        phase: 'completed',
        progress: 100,
        message: 'Upload complete! Redirecting to analysis...',
      });

      toast({
        title: 'Upload successful',
        description: 'Redirecting to your report...',
      });

      console.log('Upload complete, redirecting to report page:', reportId);

      // Redirect to the report page which will handle the chained pass processing
      // The report page auto-starts processing when status is 'pending'
      setIsUploading(false);

      setTimeout(() => {
        router.push(`/dashboard/reports/${reportId}`);
      }, 1000);

    } catch (error) {
      if ((error as Error).message === 'Cancelled' || (error as Error).name === 'AbortError') {
        // Already handled by handleCancel
        return;
      }

      console.error('Upload error:', error);

      logError(
        error instanceof Error ? error : new Error(String(error)),
        'Document Upload',
        user?.id,
        {
          companyName,
          fileCount: files.length,
          fileNames: files.map(f => f.name),
          timestamp: new Date().toISOString(),
        }
      );

      setAnalysisProgress({
        phase: 'failed',
        progress: 0,
        message: error instanceof Error ? error.message : 'An error occurred',
      });

      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'An error occurred while uploading your documents.',
        variant: 'destructive',
        duration: 10000,
      });
      setIsUploading(false);
      setIsAnalyzing(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const isProcessing = isUploading || isAnalyzing;

  // Render progress component
  const renderProgress = () => {
    if (!analysisProgress) return null;

    const { phase, progress, message, extractionDetails } = analysisProgress;

    // Determine colors based on phase
    let bgColor = 'bg-blue-50 border-blue-200';
    let textColor = 'text-blue-900';
    let progressColor = 'bg-blue-600';
    let icon = <Loader2 className="h-5 w-5 animate-spin text-blue-600" />;

    if (phase === 'completed') {
      bgColor = 'bg-green-50 border-green-200';
      textColor = 'text-green-900';
      progressColor = 'bg-green-600';
      icon = <CheckCircle2 className="h-5 w-5 text-green-600" />;
    } else if (phase === 'failed' || phase === 'cancelled') {
      bgColor = 'bg-red-50 border-red-200';
      textColor = 'text-red-900';
      progressColor = 'bg-red-600';
      icon = <XCircle className="h-5 w-5 text-red-600" />;
    }

    return (
      <div className={`${bgColor} border rounded-lg p-4 mb-4`}>
        <div className="flex items-start gap-3">
          {icon}
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p className={`text-sm font-medium ${textColor}`}>
                {phase === 'uploading' && 'Uploading Documents'}
                {phase === 'extracting' && 'Extracting Financial Data'}
                {phase === 'valuating' && 'Generating Valuation Report'}
                {phase === 'completed' && 'Analysis Complete'}
                {phase === 'failed' && 'Analysis Failed'}
                {phase === 'cancelled' && 'Analysis Cancelled'}
              </p>
              {progress > 0 && (
                <span className={`text-sm font-medium ${textColor}`}>{progress}%</span>
              )}
            </div>

            <p className={`text-sm ${textColor} opacity-80 mt-1`}>{message}</p>

            {/* Extraction details */}
            {extractionDetails && phase === 'extracting' && (
              <p className={`text-sm ${textColor} opacity-80 mt-1`}>
                Documents: {extractionDetails.completed} of {extractionDetails.total} extracted
                {extractionDetails.failed > 0 && ` (${extractionDetails.failed} failed)`}
              </p>
            )}

            {/* Progress bar */}
            {phase !== 'failed' && phase !== 'cancelled' && (
              <div className="w-full bg-white/50 rounded-full h-2 mt-3">
                <div
                  className={`${progressColor} h-2 rounded-full transition-all duration-500`}
                  style={{ width: `${Math.max(progress, phase === 'completed' ? 100 : 5)}%` }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Cancel button */}
        {isProcessing && phase !== 'completed' && phase !== 'failed' && phase !== 'cancelled' && (
          <div className="mt-4 flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCancel}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Cancel Analysis
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Upload Documents</h1>
            <p className="text-slate-600 mt-1">
              Upload financial documents to generate a valuation report
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Company name */}
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
                <CardDescription>Enter the name of the company being valued</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    type="text"
                    placeholder="Acme Corporation"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                    disabled={isProcessing}
                  />
                </div>
              </CardContent>
            </Card>

            {/* File upload */}
            <Card>
              <CardHeader>
                <CardTitle>Financial Documents</CardTitle>
                <CardDescription>
                  Upload PDF files containing financial statements, tax returns, or other relevant
                  documents
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Drop zone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`relative border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                    isDragging
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-300 hover:border-slate-400'
                  } ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    accept=".pdf"
                    multiple
                    onChange={handleFileSelect}
                    disabled={isProcessing}
                  />
                  <Upload
                    className={`h-12 w-12 mx-auto mb-4 ${
                      isDragging ? 'text-blue-500' : 'text-slate-400'
                    }`}
                  />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">
                    Drop your files here, or browse
                  </h3>
                  <p className="text-sm text-slate-600 mb-4">
                    PDF files only, up to 10MB each (max 10 files)
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('file-upload')?.click()}
                    disabled={isProcessing}
                  >
                    Browse Files
                  </Button>
                </div>

                {/* File list */}
                {files.length > 0 && (
                  <div className="space-y-2">
                    <Label>Selected Files ({files.length})</Label>
                    <div className="space-y-2">
                      {files.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-slate-900 truncate">
                                {file.name}
                              </p>
                              <p className="text-xs text-slate-600">
                                {formatFileSize(file.size)}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            disabled={isProcessing}
                            className="ml-2 p-1 hover:bg-slate-200 rounded transition-colors disabled:opacity-50"
                          >
                            <X className="h-4 w-4 text-slate-600" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Submit */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">

                  {!isProcessing && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-slate-700">
                        <strong>Note:</strong> When you submit, your documents will be securely uploaded and then analyzed by our AI assistant to generate a comprehensive valuation report.
                      </p>
                      <p className="text-sm text-slate-700 mt-2">
                        <strong>Upload:</strong> 1-5 minutes (depending on file sizes)<br />
                        <strong>AI Analysis:</strong> 10-15 minutes<br />
                        <strong>Total time:</strong> ~15-20 minutes
                      </p>
                    </div>
                  )}

                  {/* Progress display */}
                  {renderProgress()}

                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        {analysisProgress?.phase === 'uploading' && 'Uploading...'}
                        {analysisProgress?.phase === 'extracting' && 'Extracting...'}
                        {analysisProgress?.phase === 'valuating' && 'Generating Report...'}
                        {!analysisProgress && 'Processing...'}
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-5 w-5" />
                        Upload & Generate Report
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
