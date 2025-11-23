'use client';

import { useState } from 'react';
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
import { Upload, FileText, X, Loader2 } from 'lucide-react';
import { logError } from '@/lib/errorLogger';

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

    setIsUploading(true);
    setUploadProgress(`Uploading ${files.length} document${files.length > 1 ? 's' : ''} to secure storage...`);

    try {
      const formData = new FormData();
      formData.append('companyName', companyName);

      files.forEach((file) => {
        formData.append('files', file);
      });

      const supabase = createBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('Not authenticated');
      }

      console.log(`Starting upload of ${files.length} files...`);

      const uploadResponse = await fetch('/api/upload-documents', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      console.log('Upload response status:', uploadResponse.status);

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        console.error('Upload error:', errorData);
        throw new Error(errorData.error || 'Upload failed');
      }

      const { reportId } = await uploadResponse.json();

      setUploadProgress('Upload complete! Preparing for AI analysis...');

      toast({
        title: 'Upload successful',
        description: 'Starting AI analysis...',
      });

      console.log('Calling analyze API with reportId:', reportId);
      console.log('Token length:', token?.length);

      const analyzeResponse = await fetch('/api/analyze-documents', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reportId }),
      });

      console.log('Analyze response status:', analyzeResponse.status);

      if (!analyzeResponse.ok) {
        const errorData = await analyzeResponse.json();
        console.error('Analyze error:', errorData);
        throw new Error(errorData.error || 'Analysis failed to start');
      }

      // Trigger OpenAI processing
      console.log('Triggering OpenAI processing for reportId:', reportId);
      
      const processResponse = await fetch(`/api/reports/${reportId}/process`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('Process response status:', processResponse.status);

      if (!processResponse.ok) {
        const errorData = await processResponse.json();
        console.error('Process error:', errorData);
        // Don't throw - let the polling handle retries
        console.warn('OpenAI processing failed to start, will retry via polling');
      }

      setUploadProgress('AI analysis initiated! Redirecting to report...');

      toast({
        title: 'Analysis started',
        description: 'Your documents are being analyzed by AI. This typically takes 10-15 minutes.',
        duration: 5000,
      });

      setTimeout(() => {
        router.push(`/dashboard/reports/${reportId}`);
      }, 1500);
    } catch (error) {
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

      setUploadProgress('');
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'An error occurred while uploading your documents.',
        variant: 'destructive',
        duration: 10000,
      });
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
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
                    disabled={isUploading}
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
                  }`}
                >
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    accept=".pdf"
                    multiple
                    onChange={handleFileSelect}
                    disabled={isUploading}
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
                    disabled={isUploading}
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
                            disabled={isUploading}
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
                  {isUploading && uploadProgress && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-3">
                        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-blue-900">{uploadProgress}</p>
                          <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                            <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '70%' }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <Button type="submit" className="w-full" size="lg" disabled={isUploading}>
                    {isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        {uploadProgress || 'Uploading...'}
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
