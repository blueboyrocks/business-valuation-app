'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Globe, CheckCircle, AlertCircle, Loader2, ChevronDown, ChevronRight, UserCircle } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase/client';

interface PassRerunPanelProps {
  reportId: string;
  onComplete?: () => void;
}

interface PassConfig {
  passNumber: number | string;
  passName: string;
  supportsWebSearch: boolean;
  isNew?: boolean;
  category?: 'core' | 'narrative' | 'research';
  wordCount?: string;
  expert?: string;
}

// Core analysis passes (1-10)
const CORE_PASS_CONFIGS: PassConfig[] = [
  { passNumber: 1, passName: 'Document Classification', supportsWebSearch: false, category: 'core' },
  { passNumber: 2, passName: 'Income Statement', supportsWebSearch: false, category: 'core' },
  { passNumber: 3, passName: 'Balance Sheet', supportsWebSearch: false, category: 'core' },
  { passNumber: 4, passName: 'Industry Analysis', supportsWebSearch: true, category: 'core' },
  { passNumber: 5, passName: 'Earnings Normalization', supportsWebSearch: false, category: 'core' },
  { passNumber: 6, passName: 'Risk Assessment', supportsWebSearch: false, category: 'core' },
  { passNumber: 7, passName: 'Asset Approach', supportsWebSearch: false, category: 'core' },
  { passNumber: 8, passName: 'Income Approach', supportsWebSearch: false, category: 'core' },
  { passNumber: 9, passName: 'Market Approach', supportsWebSearch: true, category: 'core' },
  { passNumber: 10, passName: 'Value Synthesis', supportsWebSearch: false, category: 'core' },
];

// Individual narrative passes (11a-11k)
const NARRATIVE_PASS_CONFIGS: PassConfig[] = [
  { passNumber: '11a', passName: 'Executive Summary', supportsWebSearch: false, category: 'narrative', wordCount: '1,000-1,200', expert: 'Senior Partner', isNew: true },
  { passNumber: '11b', passName: 'Company Overview', supportsWebSearch: false, category: 'narrative', wordCount: '600-800', expert: 'Business Analyst', isNew: true },
  { passNumber: '11c', passName: 'Financial Analysis', supportsWebSearch: false, category: 'narrative', wordCount: '1,000-1,200', expert: 'CFO', isNew: true },
  { passNumber: '11d', passName: 'Industry Analysis', supportsWebSearch: false, category: 'narrative', wordCount: '600-800', expert: 'Research Analyst', isNew: true },
  { passNumber: '11e', passName: 'Risk Assessment', supportsWebSearch: false, category: 'narrative', wordCount: '700-900', expert: 'Due Diligence Expert', isNew: true },
  { passNumber: '11f', passName: 'Asset Approach', supportsWebSearch: false, category: 'narrative', wordCount: '500-600', expert: 'Certified Appraiser', isNew: true },
  { passNumber: '11g', passName: 'Income Approach', supportsWebSearch: false, category: 'narrative', wordCount: '500-600', expert: 'CVA Analyst', isNew: true },
  { passNumber: '11h', passName: 'Market Approach', supportsWebSearch: false, category: 'narrative', wordCount: '500-600', expert: 'M&A Advisor', isNew: true },
  { passNumber: '11i', passName: 'Valuation Synthesis', supportsWebSearch: false, category: 'narrative', wordCount: '700-900', expert: 'Lead Partner', isNew: true },
  { passNumber: '11j', passName: 'Assumptions & Conditions', supportsWebSearch: false, category: 'narrative', wordCount: '400-500', expert: 'Compliance Expert', isNew: true },
  { passNumber: '11k', passName: 'Value Enhancement', supportsWebSearch: false, category: 'narrative', wordCount: '600-800', expert: 'Strategy Consultant', isNew: true },
];

// Research passes with web search (12-13) + legacy pass 11
const RESEARCH_PASS_CONFIGS: PassConfig[] = [
  { passNumber: 11, passName: 'All Narratives (Legacy)', supportsWebSearch: false, category: 'research' },
  { passNumber: 12, passName: 'Economic Conditions', supportsWebSearch: true, isNew: true, category: 'research' },
  { passNumber: 13, passName: 'Comparable Transactions', supportsWebSearch: true, isNew: true, category: 'research' },
];

// Combined for backward compatibility
const PASS_CONFIGS: PassConfig[] = [
  ...CORE_PASS_CONFIGS,
  ...RESEARCH_PASS_CONFIGS,
];

export function PassRerunPanel({ reportId, onComplete }: PassRerunPanelProps) {
  const [selectedPasses, setSelectedPasses] = useState<(number | string)[]>([]);
  const [useWebSearch, setUseWebSearch] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [currentPass, setCurrentPass] = useState<number | string | null>(null);
  const [completedPasses, setCompletedPasses] = useState<(number | string)[]>([]);
  const [failedPasses, setFailedPasses] = useState<(number | string)[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [availablePasses, setAvailablePasses] = useState<(number | string)[]>([]);
  const [showNarratives, setShowNarratives] = useState(false);

  // Fetch available passes on mount
  useEffect(() => {
    async function fetchAvailablePasses() {
      try {
        const response = await fetch(`/api/reports/${reportId}/rerun-passes`);
        if (response.ok) {
          const data = await response.json();
          setAvailablePasses(data.availablePasses || []);
        }
      } catch (err) {
        console.error('Error fetching available passes:', err);
      }
    }
    fetchAvailablePasses();
  }, [reportId]);

  const togglePass = (passNumber: number | string) => {
    setSelectedPasses(prev =>
      prev.includes(passNumber)
        ? prev.filter(p => p !== passNumber)
        : [...prev, passNumber]
    );
  };

  const selectAll = () => {
    setSelectedPasses([...PASS_CONFIGS.map(p => p.passNumber), ...NARRATIVE_PASS_CONFIGS.map(p => p.passNumber)]);
  };

  const clearAll = () => {
    setSelectedPasses([]);
  };

  const selectNarrativesOnly = () => {
    // Select all individual narrative passes
    setSelectedPasses(NARRATIVE_PASS_CONFIGS.map(p => p.passNumber));
    setShowNarratives(true);
  };

  const selectLegacyNarratives = () => {
    // Select the legacy single pass 11
    setSelectedPasses([11]);
  };

  const selectWebSearchPasses = () => {
    setSelectedPasses([4, 12, 13]);
  };

  const selectAllNarrativePasses = () => {
    setSelectedPasses(prev => {
      const narrativeIds = NARRATIVE_PASS_CONFIGS.map(p => p.passNumber);
      const nonNarrativeSelected = prev.filter(p => typeof p === 'number' && p <= 10 || p === 12 || p === 13);
      return [...nonNarrativeSelected, ...narrativeIds];
    });
  };

  const clearNarrativePasses = () => {
    setSelectedPasses(prev => prev.filter(p => typeof p === 'number' && (p <= 10 || p >= 12)));
  };

  const runSelectedPasses = async () => {
    if (selectedPasses.length === 0) {
      setError('Please select at least one pass to re-run');
      return;
    }

    setIsRunning(true);
    setError(null);
    setCompletedPasses([]);
    setFailedPasses([]);

    const supabase = createBrowserClient();
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    if (!token) {
      setError('Not authenticated');
      setIsRunning(false);
      return;
    }

    try {
      // Separate numeric and narrative passes
      const numericPasses = selectedPasses.filter(p => typeof p === 'number') as number[];
      const narrativePasses = selectedPasses.filter(p => typeof p === 'string') as string[];

      // Sort numeric passes
      const sortedNumericPasses = [...numericPasses].sort((a, b) => a - b);

      const response = await fetch(`/api/reports/${reportId}/rerun-passes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          passes: sortedNumericPasses,
          narrativePasses: narrativePasses,
          options: {
            useWebSearch,
          },
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to re-run passes');
      }

      setCompletedPasses([
        ...(result.passesCompleted || []),
        ...(result.narrativePassesCompleted || [])
      ]);
      setFailedPasses([
        ...(result.passesFailed || []),
        ...(result.narrativePassesFailed || [])
      ]);

      const allFailed = [...(result.passesFailed || []), ...(result.narrativePassesFailed || [])];
      if (allFailed.length > 0) {
        setError(`Some passes failed: ${allFailed.join(', ')}`);
      }

      // Refresh report data
      if (onComplete) {
        onComplete();
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
    } finally {
      setIsRunning(false);
      setCurrentPass(null);
    }
  };

  const webSearchPasses = PASS_CONFIGS.filter(p => p.supportsWebSearch).map(p => p.passNumber);
  const selectedWebSearchCount = selectedPasses.filter(p => typeof p === 'number' && webSearchPasses.includes(p as number)).length;
  const selectedNarrativeCount = selectedPasses.filter(p => typeof p === 'string').length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Re-Run Passes
        </CardTitle>
        <CardDescription>
          Selectively re-run specific passes to improve report quality.
          Web search passes can fetch real-time industry data.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quick Select Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={selectAll}>
            Select All
          </Button>
          <Button variant="outline" size="sm" onClick={clearAll}>
            Clear All
          </Button>
          <Button variant="outline" size="sm" onClick={selectNarrativesOnly}>
            Individual Narratives (11a-11k)
          </Button>
          <Button variant="outline" size="sm" onClick={selectLegacyNarratives}>
            Legacy Narratives (Pass 11)
          </Button>
          <Button variant="outline" size="sm" onClick={selectWebSearchPasses}>
            Web Search Passes (4, 12, 13)
          </Button>
        </div>

        {/* Web Search Toggle */}
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-blue-600" />
            <div>
              <Label htmlFor="web-search" className="text-sm font-medium">
                Enable Web Search
              </Label>
              <p className="text-xs text-slate-500">
                Uses real-time web data for industry analysis, economic conditions, and transactions
              </p>
            </div>
          </div>
          <Switch
            id="web-search"
            checked={useWebSearch}
            onCheckedChange={setUseWebSearch}
          />
        </div>

        {/* Core Analysis Passes */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-slate-700">Core Analysis Passes (1-10)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {CORE_PASS_CONFIGS.map(config => {
              const isSelected = selectedPasses.includes(config.passNumber);
              const isCompleted = completedPasses.includes(config.passNumber);
              const isFailed = failedPasses.includes(config.passNumber);
              const isCurrentlyRunning = currentPass === config.passNumber;
              const isAvailable = availablePasses.includes(config.passNumber);

              return (
                <div
                  key={config.passNumber}
                  className={`flex items-center justify-between p-2 border rounded-lg transition-colors ${
                    isSelected ? 'border-blue-500 bg-blue-50' : 'border-slate-200'
                  } ${isCompleted ? 'bg-green-50 border-green-300' : ''} ${isFailed ? 'bg-red-50 border-red-300' : ''}`}
                >
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`pass-${config.passNumber}`}
                      checked={isSelected}
                      onCheckedChange={() => togglePass(config.passNumber)}
                      disabled={isRunning}
                    />
                    <Label htmlFor={`pass-${config.passNumber}`} className="cursor-pointer text-sm">
                      <span className="font-medium">{config.passNumber}:</span> {config.passName}
                    </Label>
                    {config.supportsWebSearch && (
                      <Badge variant="outline" className="text-xs">
                        <Globe className="h-3 w-3 mr-1" />
                        Web
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {isCurrentlyRunning && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
                    {isCompleted && <CheckCircle className="h-4 w-4 text-green-500" />}
                    {isFailed && <AlertCircle className="h-4 w-4 text-red-500" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Individual Narrative Passes - Collapsible */}
        <div className="space-y-2 border-t pt-4">
          <button
            type="button"
            className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900"
            onClick={() => setShowNarratives(!showNarratives)}
          >
            {showNarratives ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            Individual Narrative Passes (11a-11k) - Expert Personas
            <Badge variant="secondary" className="text-xs">New</Badge>
          </button>

          {showNarratives && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={selectAllNarrativePasses}>
                  Select All Narratives
                </Button>
                <Button variant="outline" size="sm" onClick={clearNarrativePasses}>
                  Clear Narratives
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {NARRATIVE_PASS_CONFIGS.map(config => {
                  const isSelected = selectedPasses.includes(config.passNumber);
                  const isCompleted = completedPasses.includes(config.passNumber);
                  const isFailed = failedPasses.includes(config.passNumber);
                  const isCurrentlyRunning = currentPass === config.passNumber;

                  return (
                    <div
                      key={config.passNumber}
                      className={`flex items-center justify-between p-2 border rounded-lg transition-colors ${
                        isSelected ? 'border-purple-500 bg-purple-50' : 'border-slate-200'
                      } ${isCompleted ? 'bg-green-50 border-green-300' : ''} ${isFailed ? 'bg-red-50 border-red-300' : ''}`}
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <Checkbox
                          id={`pass-${config.passNumber}`}
                          checked={isSelected}
                          onCheckedChange={() => togglePass(config.passNumber)}
                          disabled={isRunning}
                        />
                        <div className="flex-1">
                          <Label htmlFor={`pass-${config.passNumber}`} className="cursor-pointer text-sm flex items-center gap-2">
                            <span className="font-medium">{config.passNumber}:</span> {config.passName}
                          </Label>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                            <UserCircle className="h-3 w-3" />
                            <span>{config.expert}</span>
                            <span className="text-slate-300">|</span>
                            <span>{config.wordCount} words</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {isCurrentlyRunning && <Loader2 className="h-4 w-4 animate-spin text-purple-500" />}
                        {isCompleted && <CheckCircle className="h-4 w-4 text-green-500" />}
                        {isFailed && <AlertCircle className="h-4 w-4 text-red-500" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="text-xs text-slate-500 italic">
                Note: Executive Summary (11a) runs last as it synthesizes all other sections.
                Estimated total: ~8,000 words across all narratives.
              </p>
            </div>
          )}
        </div>

        {/* Research & Legacy Passes */}
        <div className="space-y-2 border-t pt-4">
          <h4 className="text-sm font-medium text-slate-700">Research & Legacy Passes</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {RESEARCH_PASS_CONFIGS.map(config => {
              const isSelected = selectedPasses.includes(config.passNumber);
              const isCompleted = completedPasses.includes(config.passNumber);
              const isFailed = failedPasses.includes(config.passNumber);
              const isCurrentlyRunning = currentPass === config.passNumber;
              const isAvailable = typeof config.passNumber === 'number' && availablePasses.includes(config.passNumber);

              return (
                <div
                  key={config.passNumber}
                  className={`flex items-center justify-between p-2 border rounded-lg transition-colors ${
                    isSelected ? 'border-blue-500 bg-blue-50' : 'border-slate-200'
                  } ${isCompleted ? 'bg-green-50 border-green-300' : ''} ${isFailed ? 'bg-red-50 border-red-300' : ''}`}
                >
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`pass-${config.passNumber}`}
                      checked={isSelected}
                      onCheckedChange={() => togglePass(config.passNumber)}
                      disabled={isRunning}
                    />
                    <Label htmlFor={`pass-${config.passNumber}`} className="cursor-pointer text-sm">
                      <span className="font-medium">{config.passNumber}:</span> {config.passName}
                    </Label>
                    {config.supportsWebSearch && (
                      <Badge variant="outline" className="text-xs">
                        <Globe className="h-3 w-3 mr-1" />
                        Web
                      </Badge>
                    )}
                    {config.isNew && (
                      <Badge variant="secondary" className="text-xs">
                        New
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {isCurrentlyRunning && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
                    {isCompleted && <CheckCircle className="h-4 w-4 text-green-500" />}
                    {isFailed && <AlertCircle className="h-4 w-4 text-red-500" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selection Summary */}
        <div className="flex items-center justify-between text-sm text-slate-600 pt-2 border-t">
          <span>
            {selectedPasses.length} passes selected
            {selectedNarrativeCount > 0 && (
              <span className="text-purple-600">
                {' '}({selectedNarrativeCount} narrative{selectedNarrativeCount !== 1 ? 's' : ''})
              </span>
            )}
            {selectedWebSearchCount > 0 && useWebSearch && (
              <span className="text-blue-600">
                {' '}({selectedWebSearchCount} with web search)
              </span>
            )}
          </span>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <AlertCircle className="h-4 w-4 inline mr-2" />
            {error}
          </div>
        )}

        {/* Run Button */}
        <Button
          onClick={runSelectedPasses}
          disabled={isRunning || selectedPasses.length === 0}
          className="w-full"
        >
          {isRunning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Running Pass {currentPass || '...'}
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Re-Run {selectedPasses.length} Selected Pass{selectedPasses.length !== 1 ? 'es' : ''}
            </>
          )}
        </Button>

        {/* Completion Summary */}
        {completedPasses.length > 0 && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            <CheckCircle className="h-4 w-4 inline mr-2" />
            Successfully completed passes: {completedPasses.join(', ')}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
