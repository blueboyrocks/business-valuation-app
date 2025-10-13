'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

interface WaterfallChartProps {
  title: string;
  description?: string;
  data: Array<{
    name: string;
    value: number;
    isTotal?: boolean;
  }>;
}

export function WaterfallChart({ title, description, data }: WaterfallChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const cumulativeData: Array<{
    name: string;
    value: number;
    isTotal?: boolean;
    start: number;
    end: number;
    cumulative: number;
    displayValue: number;
  }> = [];

  data.forEach((item, index) => {
    const previous = index > 0 ? cumulativeData[index - 1] : { cumulative: 0 };
    const cumulative = previous.cumulative + item.value;
    const start = item.isTotal ? 0 : previous.cumulative;

    cumulativeData.push({
      ...item,
      start,
      end: cumulative,
      cumulative,
      displayValue: item.isTotal ? cumulative : item.value,
    });
  });

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg">
          <p className="font-semibold text-slate-900">{data.name}</p>
          <p className="text-sm text-slate-600">{formatCurrency(data.displayValue)}</p>
          {!data.isTotal && (
            <p className="text-xs text-slate-500">Cumulative: {formatCurrency(data.cumulative)}</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={cumulativeData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
            <YAxis tickFormatter={(value) => formatCurrency(value)} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="displayValue" stackId="a">
              {cumulativeData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.isTotal ? '#3b82f6' : entry.value >= 0 ? '#10b981' : '#ef4444'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
