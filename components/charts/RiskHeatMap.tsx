'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface RiskItem {
  category: string;
  impact: number;
  probability: number;
  score: number;
  description: string;
}

interface RiskHeatMapProps {
  title: string;
  description?: string;
  risks: RiskItem[];
}

export function RiskHeatMap({ title, description, risks }: RiskHeatMapProps) {
  const getColorForScore = (score: number) => {
    if (score >= 8) return 'bg-red-500 text-white';
    if (score >= 6) return 'bg-orange-500 text-white';
    if (score >= 4) return 'bg-yellow-500 text-slate-900';
    return 'bg-green-500 text-white';
  };

  const getRiskLevel = (score: number) => {
    if (score >= 8) return 'Critical';
    if (score >= 6) return 'High';
    if (score >= 4) return 'Medium';
    return 'Low';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {risks.map((risk, index) => (
              <div key={index} className="border border-slate-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <h4 className="font-semibold text-slate-900">{risk.category}</h4>
                  <div className={`px-2 py-1 rounded text-xs font-semibold ${getColorForScore(risk.score)}`}>
                    {risk.score.toFixed(1)}
                  </div>
                </div>
                <p className="text-sm text-slate-600 mb-3">{risk.description}</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Impact</p>
                    <div className="flex items-center gap-1">
                      {[...Array(10)].map((_, i) => (
                        <div
                          key={i}
                          className={`h-2 w-2 rounded-full ${
                            i < risk.impact ? 'bg-blue-600' : 'bg-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Probability</p>
                    <div className="flex items-center gap-1">
                      {[...Array(10)].map((_, i) => (
                        <div
                          key={i}
                          className={`h-2 w-2 rounded-full ${
                            i < risk.probability ? 'bg-blue-600' : 'bg-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-200">
                  <p className="text-xs font-medium text-slate-700">
                    Risk Level: <span className={getColorForScore(risk.score)}>{getRiskLevel(risk.score)}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
