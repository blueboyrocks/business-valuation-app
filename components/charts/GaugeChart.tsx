'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface GaugeChartProps {
  title: string;
  description?: string;
  value: number;
  maxValue: number;
  label: string;
  thresholds?: {
    low: number;
    medium: number;
    high: number;
  };
}

export function GaugeChart({ title, description, value, maxValue, label, thresholds }: GaugeChartProps) {
  const percentage = (value / maxValue) * 100;
  const rotation = (percentage / 100) * 180 - 90;

  const getColor = () => {
    if (!thresholds) return '#3b82f6';
    if (value >= thresholds.high) return '#10b981';
    if (value >= thresholds.medium) return '#f59e0b';
    return '#ef4444';
  };

  const getStatusText = () => {
    if (!thresholds) return 'Current Value';
    if (value >= thresholds.high) return 'Excellent';
    if (value >= thresholds.medium) return 'Good';
    return 'Needs Improvement';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-6">
          <div className="relative w-64 h-32">
            <svg viewBox="0 0 200 100" className="w-full h-full">
              <path
                d="M 10 90 A 80 80 0 0 1 190 90"
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="12"
                strokeLinecap="round"
              />
              <path
                d="M 10 90 A 80 80 0 0 1 190 90"
                fill="none"
                stroke={getColor()}
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={`${percentage * 2.83} 1000`}
              />
              <line
                x1="100"
                y1="90"
                x2="180"
                y2="90"
                stroke={getColor()}
                strokeWidth="3"
                strokeLinecap="round"
                transform={`rotate(${rotation} 100 90)`}
              />
              <circle cx="100" cy="90" r="8" fill={getColor()} />
            </svg>
          </div>
          <div className="text-center mt-4">
            <p className="text-3xl font-bold text-slate-900">{value.toFixed(1)}</p>
            <p className="text-sm text-slate-600 mt-1">{label}</p>
            <p className={`text-xs font-medium mt-2 px-3 py-1 rounded-full inline-block`} style={{ backgroundColor: `${getColor()}20`, color: getColor() }}>
              {getStatusText()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
