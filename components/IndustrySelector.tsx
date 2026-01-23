'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  Search,
  CheckCircle,
  Building2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from 'lucide-react';

interface NAICSSuggestion {
  naics_code: string;
  naics_description: string;
  sector: string;
  match_reason: string;
  confidence: number;
}

interface CommonCode {
  naics_code: string;
  naics_description: string;
  sector: string;
}

interface IndustrySelectorProps {
  onSelect: (industry: { naics_code: string; naics_description: string; sector: string }) => void;
  initialDescription?: string;
  initialNaics?: string;
}

export function IndustrySelector({ onSelect, initialDescription = '', initialNaics = '' }: IndustrySelectorProps) {
  const [description, setDescription] = useState(initialDescription);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<NAICSSuggestion[]>([]);
  const [selectedCode, setSelectedCode] = useState<string>(initialNaics);
  const [error, setError] = useState<string | null>(null);
  const [clarification, setClarification] = useState<string | null>(null);
  const [parsedType, setParsedType] = useState<string | null>(null);
  const [showCommonCodes, setShowCommonCodes] = useState(false);
  const [commonCodes, setCommonCodes] = useState<CommonCode[]>([]);
  const [manualCode, setManualCode] = useState('');
  const [manualDescription, setManualDescription] = useState('');
  const [showManualEntry, setShowManualEntry] = useState(false);

  // Fetch common codes on mount
  useEffect(() => {
    async function fetchCommonCodes() {
      try {
        const response = await fetch('/api/naics-suggest');
        if (response.ok) {
          const data = await response.json();
          setCommonCodes(data.common_codes || []);
        }
      } catch (err) {
        console.error('Failed to fetch common codes:', err);
      }
    }
    fetchCommonCodes();
  }, []);

  const getSuggestions = async () => {
    if (!description || description.length < 10) {
      setError('Please provide a more detailed description (at least 10 characters)');
      return;
    }

    setIsLoading(true);
    setError(null);
    setClarification(null);
    setSuggestions([]);

    try {
      const response = await fetch('/api/naics-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get suggestions');
      }

      setSuggestions(data.suggestions || []);
      setClarification(data.clarification_needed || null);
      setParsedType(data.parsed_business_type || null);

      // Auto-select if high confidence
      if (data.suggestions?.length > 0 && data.suggestions[0].confidence >= 0.9) {
        setSelectedCode(data.suggestions[0].naics_code);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get suggestions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (suggestion: NAICSSuggestion) => {
    setSelectedCode(suggestion.naics_code);
    onSelect({
      naics_code: suggestion.naics_code,
      naics_description: suggestion.naics_description,
      sector: suggestion.sector,
    });
  };

  const handleCommonCodeSelect = (code: CommonCode) => {
    setSelectedCode(code.naics_code);
    onSelect({
      naics_code: code.naics_code,
      naics_description: code.naics_description,
      sector: code.sector,
    });
    setShowCommonCodes(false);
  };

  const handleManualEntry = () => {
    if (!manualCode || !manualDescription) {
      setError('Please enter both NAICS code and description');
      return;
    }
    if (!/^\d{6}$/.test(manualCode)) {
      setError('NAICS code must be exactly 6 digits');
      return;
    }
    setSelectedCode(manualCode);
    onSelect({
      naics_code: manualCode,
      naics_description: manualDescription,
      sector: 'Custom Entry',
    });
    setShowManualEntry(false);
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.9) return <Badge className="bg-green-500">Excellent Match</Badge>;
    if (confidence >= 0.7) return <Badge className="bg-blue-500">Good Match</Badge>;
    if (confidence >= 0.5) return <Badge className="bg-yellow-500">Possible Match</Badge>;
    return <Badge variant="secondary">Low Confidence</Badge>;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Industry Classification
        </CardTitle>
        <CardDescription>
          Describe what this business does and we&apos;ll suggest the appropriate industry classification.
          This is critical for accurate valuation multiples and benchmarks.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Business Description Input */}
        <div className="space-y-2">
          <Label htmlFor="business-description">
            What does this business do? <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="business-description"
            placeholder="e.g., We provide mechanical and electrical engineering design services for commercial buildings, including HVAC systems, plumbing, and electrical layouts..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="resize-none"
          />
          <p className="text-xs text-slate-500">
            Be specific about the products/services, target customers, and how the business generates revenue.
          </p>
        </div>

        {/* Get Suggestions Button */}
        <Button
          onClick={getSuggestions}
          disabled={isLoading || description.length < 10}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Get Industry Suggestions
            </>
          )}
        </Button>

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Clarification Needed */}
        {clarification && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
            <p className="font-medium">Need more information:</p>
            <p>{clarification}</p>
          </div>
        )}

        {/* Parsed Understanding */}
        {parsedType && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">
            <p className="font-medium">Our understanding:</p>
            <p>{parsedType}</p>
          </div>
        )}

        {/* AI Suggestions */}
        {suggestions.length > 0 && (
          <div className="space-y-3">
            <Label>Suggested Industry Classifications</Label>
            <div className="space-y-2">
              {suggestions.map((suggestion, index) => (
                <div
                  key={suggestion.naics_code}
                  onClick={() => handleSelect(suggestion)}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedCode === suggestion.naics_code
                      ? 'border-green-500 bg-green-50 ring-2 ring-green-200'
                      : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-lg">{suggestion.naics_code}</span>
                        {getConfidenceBadge(suggestion.confidence)}
                        {index === 0 && <Badge variant="outline">Best Match</Badge>}
                      </div>
                      <p className="font-medium text-slate-900 mt-1">{suggestion.naics_description}</p>
                      <p className="text-sm text-slate-500">{suggestion.sector}</p>
                      <p className="text-sm text-slate-600 mt-2 italic">&quot;{suggestion.match_reason}&quot;</p>
                    </div>
                    {selectedCode === suggestion.naics_code && (
                      <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Common Codes Dropdown */}
        <div className="border-t pt-4">
          <button
            type="button"
            onClick={() => setShowCommonCodes(!showCommonCodes)}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
          >
            {showCommonCodes ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            <Search className="h-4 w-4" />
            Browse common industry codes
          </button>

          {showCommonCodes && (
            <div className="mt-3 max-h-64 overflow-y-auto border rounded-lg">
              {commonCodes.map((code) => (
                <div
                  key={code.naics_code}
                  onClick={() => handleCommonCodeSelect(code)}
                  className={`p-3 border-b last:border-b-0 cursor-pointer hover:bg-slate-50 ${
                    selectedCode === code.naics_code ? 'bg-green-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono font-medium">{code.naics_code}</span>
                      <span className="mx-2">-</span>
                      <span>{code.naics_description}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">{code.sector}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Manual Entry Option */}
        <div className="border-t pt-4">
          <button
            type="button"
            onClick={() => setShowManualEntry(!showManualEntry)}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
          >
            {showManualEntry ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            Enter NAICS code manually
          </button>

          {showManualEntry && (
            <div className="mt-3 p-4 border rounded-lg bg-slate-50 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="manual-code">NAICS Code (6 digits)</Label>
                  <Input
                    id="manual-code"
                    placeholder="541330"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    className="font-mono"
                  />
                </div>
                <div>
                  <Label htmlFor="manual-desc">Industry Description</Label>
                  <Input
                    id="manual-desc"
                    placeholder="Engineering Services"
                    value={manualDescription}
                    onChange={(e) => setManualDescription(e.target.value)}
                  />
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualEntry}
                disabled={!manualCode || !manualDescription}
              >
                Use This Code
              </Button>
            </div>
          )}
        </div>

        {/* Selected Industry Summary */}
        {selectedCode && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Selected Industry:</span>
            </div>
            <p className="mt-1 text-green-900">
              <span className="font-mono font-bold">{selectedCode}</span>
              {suggestions.find(s => s.naics_code === selectedCode)?.naics_description && (
                <span> - {suggestions.find(s => s.naics_code === selectedCode)?.naics_description}</span>
              )}
              {commonCodes.find(c => c.naics_code === selectedCode)?.naics_description && (
                <span> - {commonCodes.find(c => c.naics_code === selectedCode)?.naics_description}</span>
              )}
              {manualCode === selectedCode && manualDescription && (
                <span> - {manualDescription}</span>
              )}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
