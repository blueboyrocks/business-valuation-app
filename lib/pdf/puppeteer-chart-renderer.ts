/**
 * Chart generation using Puppeteer + Chart.js
 * This renders charts as HTML/CSS and captures them as images
 */

import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

export interface ValuationChartData {
  asset: number;
  income: number;
  market: number;
}

export interface FinancialMetricsChartData {
  years: string[];
  revenue: number[];
  cashFlow: number[];
  totalDebt: number[];
}

export interface KPIChartData {
  name: string;
  companyValue: number;
  industryBenchmark: number;
}

export interface KPIComparisonChartData {
  kpiName: string;
  years: string[];
  values: number[];
  benchmark: number;
  format: 'percentage' | 'ratio' | 'times';
  higherIsBetter: boolean;
}

export interface FinancialTrendChartData {
  years: string[];
  datasets: {
    label: string;
    data: number[];
    color: string;
  }[];
}

export interface RiskGaugeData {
  score: number;  // 1-10 scale
  label: string;
}

export interface ValueMapData {
  lowValue: number;
  midValue: number;
  highValue: number;
  companyValue: number;
  industryLow: number;
  industryHigh: number;
}

/**
 * Generate valuation approaches comparison chart
 */
export async function generateValuationChart(data: ValuationChartData): Promise<string> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <style>
    body { margin: 0; padding: 20px; background: white; }
    #chart-container { width: 800px; height: 400px; }
  </style>
</head>
<body>
  <div id="chart-container">
    <canvas id="chart"></canvas>
  </div>
  <script>
    const ctx = document.getElementById('chart').getContext('2d');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Asset Approach', 'Income Approach', 'Market Approach'],
        datasets: [{
          label: 'Valuation Amount',
          data: [${data.asset}, ${data.income}, ${data.market}],
          backgroundColor: [
            'rgba(54, 162, 235, 0.8)',
            'rgba(75, 192, 192, 0.8)',
            'rgba(255, 159, 64, 0.8)'
          ],
          borderColor: [
            'rgba(54, 162, 235, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(255, 159, 64, 1)'
          ],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          title: {
            display: true,
            text: 'Valuation Approaches Comparison',
            font: { size: 20, weight: 'bold' },
            padding: { top: 10, bottom: 20 }
          },
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return '$' + context.parsed.y.toLocaleString();
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                if (value >= 1000000) {
                  return '$' + (value / 1000000).toFixed(1) + 'M';
                } else if (value >= 1000) {
                  return '$' + (value / 1000).toFixed(0) + 'K';
                }
                return '$' + value;
              },
              font: { size: 12 }
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.1)'
            }
          },
          x: {
            ticks: {
              font: { size: 12 }
            },
            grid: {
              display: false
            }
          }
        }
      }
    });
  </script>
</body>
</html>
  `;

  return await renderChartToBase64(html);
}

/**
 * Generate financial metrics trend chart
 */
export async function generateFinancialMetricsChart(data: FinancialMetricsChartData): Promise<string> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <style>
    body { margin: 0; padding: 20px; background: white; }
    #chart-container { width: 800px; height: 400px; }
  </style>
</head>
<body>
  <div id="chart-container">
    <canvas id="chart"></canvas>
  </div>
  <script>
    const ctx = document.getElementById('chart').getContext('2d');
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: ${JSON.stringify(data.years)},
        datasets: [
          {
            label: 'Revenue',
            data: ${JSON.stringify(data.revenue)},
            borderColor: 'rgba(54, 162, 235, 1)',
            backgroundColor: 'rgba(54, 162, 235, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4
          },
          {
            label: 'Cash Flow',
            data: ${JSON.stringify(data.cashFlow)},
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4
          },
          {
            label: 'Total Debt',
            data: ${JSON.stringify(data.totalDebt)},
            borderColor: 'rgba(255, 99, 132, 1)',
            backgroundColor: 'rgba(255, 99, 132, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          title: {
            display: true,
            text: 'Financial Metrics Trend',
            font: { size: 20, weight: 'bold' },
            padding: { top: 10, bottom: 20 }
          },
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              font: { size: 12 },
              padding: 15,
              usePointStyle: true
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return context.dataset.label + ': $' + context.parsed.y.toLocaleString();
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                if (value >= 1000000) {
                  return '$' + (value / 1000000).toFixed(1) + 'M';
                } else if (value >= 1000) {
                  return '$' + (value / 1000).toFixed(0) + 'K';
                }
                return '$' + value;
              },
              font: { size: 12 }
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.1)'
            }
          },
          x: {
            ticks: {
              font: { size: 12 }
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            }
          }
        }
      }
    });
  </script>
</body>
</html>
  `;

  return await renderChartToBase64(html);
}

/**
 * Generate KPI performance chart
 */
export async function generateKPIChart(kpis: KPIChartData[]): Promise<string> {
  const labels = kpis.map(k => k.name);
  const companyValues = kpis.map(k => k.companyValue);
  const benchmarkValues = kpis.map(k => k.industryBenchmark);

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <style>
    body { margin: 0; padding: 20px; background: white; }
    #chart-container { width: 800px; height: 500px; }
  </style>
</head>
<body>
  <div id="chart-container">
    <canvas id="chart"></canvas>
  </div>
  <script>
    const ctx = document.getElementById('chart').getContext('2d');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ${JSON.stringify(labels)},
        datasets: [
          {
            label: 'Company',
            data: ${JSON.stringify(companyValues)},
            backgroundColor: 'rgba(54, 162, 235, 0.8)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 2
          },
          {
            label: 'Industry Benchmark',
            data: ${JSON.stringify(benchmarkValues)},
            backgroundColor: 'rgba(255, 159, 64, 0.8)',
            borderColor: 'rgba(255, 159, 64, 1)',
            borderWidth: 2
          }
        ]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          title: {
            display: true,
            text: 'KPI Performance vs Industry Benchmarks',
            font: { size: 20, weight: 'bold' },
            padding: { top: 10, bottom: 20 }
          },
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              font: { size: 12 },
              padding: 15,
              usePointStyle: true
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return context.dataset.label + ': ' + context.parsed.x.toFixed(1) + '%';
              }
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return value + '%';
              },
              font: { size: 11 }
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.1)'
            }
          },
          y: {
            ticks: {
              font: { size: 10 }
            },
            grid: {
              display: false
            }
          }
        }
      }
    });
  </script>
</body>
</html>
  `;

  return await renderChartToBase64(html);
}

/**
 * Generate KPI comparison bar chart with 3-year data and benchmark line
 */
export async function generateKPIComparisonChart(data: KPIComparisonChartData): Promise<string> {
  // Determine colors based on performance vs benchmark
  const getBarColor = (value: number, benchmark: number, higherIsBetter: boolean): string => {
    const ratio = value / benchmark;
    if (higherIsBetter) {
      if (ratio > 1.10) return 'rgba(76, 175, 80, 0.8)';   // Green - outperforming
      if (ratio < 0.90) return 'rgba(244, 67, 54, 0.8)';   // Red - underperforming
      return 'rgba(255, 193, 7, 0.8)';                      // Yellow - meeting
    } else {
      if (ratio < 0.90) return 'rgba(76, 175, 80, 0.8)';
      if (ratio > 1.10) return 'rgba(244, 67, 54, 0.8)';
      return 'rgba(255, 193, 7, 0.8)';
    }
  };

  const barColors = data.values.map(v => getBarColor(v, data.benchmark, data.higherIsBetter));

  const formatValue = (v: number): string => {
    switch (data.format) {
      case 'percentage': return (v * 100).toFixed(1) + '%';
      case 'ratio': return v.toFixed(2);
      case 'times': return v.toFixed(1) + 'x';
      default: return v.toString();
    }
  };

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-annotation@3.0.1/dist/chartjs-plugin-annotation.min.js"></script>
  <style>
    body { margin: 0; padding: 20px; background: white; font-family: 'Helvetica Neue', Arial, sans-serif; }
    #chart-container { width: 500px; height: 300px; }
  </style>
</head>
<body>
  <div id="chart-container">
    <canvas id="chart"></canvas>
  </div>
  <script>
    const ctx = document.getElementById('chart').getContext('2d');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ${JSON.stringify(data.years)},
        datasets: [{
          label: '${data.kpiName}',
          data: ${JSON.stringify(data.values.map(v => data.format === 'percentage' ? v * 100 : v))},
          backgroundColor: ${JSON.stringify(barColors)},
          borderColor: ${JSON.stringify(barColors.map(c => c.replace('0.8', '1')))},
          borderWidth: 2,
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          title: {
            display: true,
            text: '${data.kpiName}',
            font: { size: 16, weight: 'bold' },
            padding: { bottom: 20 }
          },
          legend: { display: false },
          annotation: {
            annotations: {
              benchmarkLine: {
                type: 'line',
                yMin: ${data.format === 'percentage' ? data.benchmark * 100 : data.benchmark},
                yMax: ${data.format === 'percentage' ? data.benchmark * 100 : data.benchmark},
                borderColor: 'rgba(33, 150, 243, 1)',
                borderWidth: 2,
                borderDash: [6, 4],
                label: {
                  display: true,
                  content: 'Industry Benchmark (${formatValue(data.benchmark)})',
                  position: 'end',
                  backgroundColor: 'rgba(33, 150, 243, 0.8)',
                  font: { size: 10 }
                }
              }
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const val = context.parsed.y;
                return '${data.format === 'percentage' ? '' : ''}' + val.toFixed(1) + '${data.format === 'percentage' ? '%' : data.format === 'times' ? 'x' : ''}';
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return value${data.format === 'percentage' ? " + '%'" : data.format === 'times' ? " + 'x'" : ''};
              }
            },
            grid: { color: 'rgba(0, 0, 0, 0.1)' }
          },
          x: {
            grid: { display: false }
          }
        }
      }
    });
  </script>
</body>
</html>
  `;

  return await renderChartToBase64(html, 540, 340);
}

/**
 * Generate financial trend line chart
 */
export async function generateFinancialTrendChart(data: FinancialTrendChartData): Promise<string> {
  const datasets = data.datasets.map(ds => ({
    label: ds.label,
    data: ds.data,
    borderColor: ds.color,
    backgroundColor: ds.color.replace('1)', '0.1)'),
    borderWidth: 3,
    fill: true,
    tension: 0.4,
    pointRadius: 6,
    pointHoverRadius: 8
  }));

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <style>
    body { margin: 0; padding: 20px; background: white; }
    #chart-container { width: 700px; height: 400px; }
  </style>
</head>
<body>
  <div id="chart-container">
    <canvas id="chart"></canvas>
  </div>
  <script>
    const ctx = document.getElementById('chart').getContext('2d');
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: ${JSON.stringify(data.years)},
        datasets: ${JSON.stringify(datasets)}
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          title: {
            display: true,
            text: 'Financial Performance Trends',
            font: { size: 20, weight: 'bold' },
            padding: { top: 10, bottom: 20 }
          },
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              font: { size: 12 },
              padding: 15,
              usePointStyle: true
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return context.dataset.label + ': $' + context.parsed.y.toLocaleString();
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: false,
            ticks: {
              callback: function(value) {
                if (value >= 1000000) return '$' + (value / 1000000).toFixed(1) + 'M';
                if (value >= 1000) return '$' + (value / 1000).toFixed(0) + 'K';
                return '$' + value;
              },
              font: { size: 12 }
            },
            grid: { color: 'rgba(0, 0, 0, 0.1)' }
          },
          x: {
            ticks: { font: { size: 12 } },
            grid: { color: 'rgba(0, 0, 0, 0.05)' }
          }
        }
      }
    });
  </script>
</body>
</html>
  `;

  return await renderChartToBase64(html, 740, 440);
}

/**
 * Generate risk assessment gauge
 */
export async function generateRiskGauge(data: RiskGaugeData): Promise<string> {
  // Normalize score to 1-10 range
  const score = Math.max(1, Math.min(10, data.score));

  // Calculate gauge angle (-135 to 135 degrees for a semi-circle)
  const normalizedScore = (score - 1) / 9; // 0 to 1
  const angle = -135 + (normalizedScore * 270);

  // Determine color based on score
  const getScoreColor = (s: number): string => {
    if (s <= 3) return '#4CAF50';      // Green - Low risk
    if (s <= 5) return '#8BC34A';      // Light green
    if (s <= 7) return '#FFC107';      // Yellow/Amber - Moderate
    if (s <= 8) return '#FF9800';      // Orange
    return '#F44336';                   // Red - High risk
  };

  const scoreColor = getScoreColor(score);

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { margin: 0; padding: 20px; background: white; font-family: 'Helvetica Neue', Arial, sans-serif; }
    #chart-container { width: 400px; height: 280px; display: flex; flex-direction: column; align-items: center; }
    .gauge-wrapper { position: relative; width: 300px; height: 180px; margin-bottom: 20px; }
    .gauge-bg {
      position: absolute;
      width: 300px;
      height: 150px;
      border-radius: 150px 150px 0 0;
      background: linear-gradient(90deg, #4CAF50 0%, #8BC34A 25%, #FFC107 50%, #FF9800 75%, #F44336 100%);
      overflow: hidden;
    }
    .gauge-inner {
      position: absolute;
      bottom: 0;
      left: 30px;
      width: 240px;
      height: 120px;
      background: white;
      border-radius: 120px 120px 0 0;
    }
    .gauge-needle {
      position: absolute;
      bottom: 0;
      left: 150px;
      width: 4px;
      height: 100px;
      background: #333;
      transform-origin: bottom center;
      transform: rotate(${angle}deg);
      border-radius: 2px;
    }
    .gauge-center {
      position: absolute;
      bottom: -10px;
      left: 140px;
      width: 20px;
      height: 20px;
      background: #333;
      border-radius: 50%;
    }
    .gauge-labels {
      position: absolute;
      bottom: -5px;
      width: 100%;
      display: flex;
      justify-content: space-between;
      padding: 0 10px;
      box-sizing: border-box;
      font-size: 12px;
      color: #666;
    }
    .score-display {
      font-size: 48px;
      font-weight: bold;
      color: ${scoreColor};
    }
    .score-label {
      font-size: 14px;
      color: #666;
      text-transform: uppercase;
    }
    .risk-level {
      font-size: 18px;
      font-weight: 500;
      color: ${scoreColor};
      margin-top: 5px;
    }
  </style>
</head>
<body>
  <div id="chart-container">
    <div class="gauge-wrapper">
      <div class="gauge-bg"></div>
      <div class="gauge-inner"></div>
      <div class="gauge-needle"></div>
      <div class="gauge-center"></div>
      <div class="gauge-labels">
        <span>1</span>
        <span>3</span>
        <span>5</span>
        <span>7</span>
        <span>10</span>
      </div>
    </div>
    <div class="score-display">${score.toFixed(1)}</div>
    <div class="score-label">Risk Score</div>
    <div class="risk-level">${data.label}</div>
  </div>
</body>
</html>
  `;

  return await renderChartToBase64(html, 440, 320);
}

/**
 * Generate performance badge SVG
 */
export function generatePerformanceBadge(
  level: 'outperforming' | 'meeting' | 'underperforming'
): string {
  const colors = {
    outperforming: { bg: '#E8F5E9', border: '#4CAF50', text: '#2E7D32' },
    meeting: { bg: '#FFF8E1', border: '#FFC107', text: '#F57F17' },
    underperforming: { bg: '#FFEBEE', border: '#F44336', text: '#C62828' }
  };

  const labels = {
    outperforming: 'Outperforming Industry',
    meeting: 'Meeting Expectations',
    underperforming: 'Below Industry Average'
  };

  const icons = {
    outperforming: '&#9650;',  // Up triangle
    meeting: '&#9679;',        // Circle
    underperforming: '&#9660;' // Down triangle
  };

  const c = colors[level];
  const label = labels[level];
  const icon = icons[level];

  return `
    <div style="
      display: inline-flex;
      align-items: center;
      padding: 8px 16px;
      background: ${c.bg};
      border: 2px solid ${c.border};
      border-radius: 20px;
      font-family: 'Helvetica Neue', Arial, sans-serif;
      font-size: 14px;
      font-weight: 600;
      color: ${c.text};
    ">
      <span style="margin-right: 8px; font-size: 12px;">${icon}</span>
      ${label}
    </div>
  `;
}

/**
 * Generate value map/mountain visualization
 *
 * PRD-J US-006 fixes:
 * - Increased container height to prevent cutoff
 * - Marker label positioned to not overlap data
 * - Industry Low/High labels properly positioned with connecting lines
 * - Value marker clamped to range scale
 * - Design token colors used consistently
 */
export async function generateValueMap(data: ValueMapData): Promise<string> {
  const formatValue = (v: number): string => {
    if (v >= 1000000) return '$' + (v / 1000000).toFixed(1) + 'M';
    if (v >= 1000) return '$' + (v / 1000).toFixed(0) + 'K';
    return '$' + v.toLocaleString();
  };

  // Calculate position for company value marker (0-100 scale)
  // Clamp to 5-95% to ensure marker stays within visible area
  const range = data.highValue - data.lowValue;
  const rawPosition = range > 0 ? ((data.companyValue - data.lowValue) / range) * 100 : 50;
  const companyPosition = Math.max(5, Math.min(95, rawPosition));

  // Determine marker label position - flip to left/right if near edges
  const labelPosition = companyPosition > 70 ? 'right' : companyPosition < 30 ? 'left' : 'center';
  const labelOffset = labelPosition === 'right' ? 'right: 0; transform: translateX(0);' :
                      labelPosition === 'left' ? 'left: 0; transform: translateX(0);' :
                      'left: 50%; transform: translateX(-50%);';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { margin: 0; padding: 30px; background: white; font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; }
    #chart-container { width: 600px; min-height: 420px; }
    .title {
      font-size: 20px;
      font-weight: bold;
      color: #1E3A5F;
      text-align: center;
      margin-bottom: 30px;
    }
    .chart-area {
      position: relative;
      padding-top: 50px; /* Space for marker label */
    }
    .value-range {
      position: relative;
      height: 180px;
      margin: 0 50px;
    }
    .mountain {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 160px;
      background: linear-gradient(180deg,
        #E8F4FC 0%,
        #B3D9F2 30%,
        #5BA3D9 60%,
        #1E3A5F 100%
      );
      clip-path: polygon(0% 100%, 25% 45%, 50% 5%, 75% 45%, 100% 100%);
      border-radius: 0 0 8px 8px;
    }
    .value-marker {
      position: absolute;
      bottom: 0;
      left: ${companyPosition}%;
      transform: translateX(-50%);
      display: flex;
      flex-direction: column;
      align-items: center;
      z-index: 10;
    }
    .marker-line {
      width: 3px;
      height: 180px;
      background: linear-gradient(180deg, #DC2626 0%, #B91C1C 100%);
      border-radius: 2px;
    }
    .marker-dot {
      width: 18px;
      height: 18px;
      background: #DC2626;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      margin-bottom: -9px;
      z-index: 11;
    }
    .marker-label {
      position: absolute;
      top: -45px;
      ${labelOffset}
      background: #DC2626;
      color: white;
      padding: 8px 14px;
      border-radius: 6px;
      font-weight: bold;
      font-size: 14px;
      white-space: nowrap;
      box-shadow: 0 2px 8px rgba(220, 38, 38, 0.3);
    }
    .marker-label::after {
      content: '';
      position: absolute;
      bottom: -8px;
      ${labelPosition === 'center' ? 'left: 50%; transform: translateX(-50%);' :
        labelPosition === 'right' ? 'right: 20px;' : 'left: 20px;'}
      border: 8px solid transparent;
      border-top-color: #DC2626;
      border-bottom: none;
    }
    .range-labels {
      display: flex;
      justify-content: space-between;
      margin: 0 50px;
      padding-top: 20px;
      border-top: 1px solid #E5E7EB;
    }
    .range-label {
      text-align: center;
    }
    .range-value {
      font-size: 16px;
      font-weight: bold;
      color: #1E3A5F;
    }
    .range-type {
      font-size: 11px;
      color: #6B7280;
      margin-top: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .industry-range {
      display: flex;
      justify-content: center;
      margin-top: 25px;
      padding-top: 20px;
      border-top: 1px solid #E5E7EB;
      gap: 60px;
    }
    .industry-item {
      text-align: center;
      padding: 10px 20px;
      background: #F9FAFB;
      border-radius: 8px;
      border: 1px solid #E5E7EB;
    }
    .industry-label {
      font-size: 11px;
      color: #6B7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    .industry-value {
      font-size: 16px;
      font-weight: 600;
      color: #1E3A5F;
    }
  </style>
</head>
<body>
  <div id="chart-container">
    <div class="title">Valuation Range Overview</div>
    <div class="chart-area">
      <div class="value-range">
        <div class="mountain"></div>
        <div class="value-marker">
          <div class="marker-label">Your Value: ${formatValue(data.companyValue)}</div>
          <div class="marker-dot"></div>
          <div class="marker-line"></div>
        </div>
      </div>
    </div>
    <div class="range-labels">
      <div class="range-label">
        <div class="range-value">${formatValue(data.lowValue)}</div>
        <div class="range-type">Low Estimate</div>
      </div>
      <div class="range-label">
        <div class="range-value">${formatValue(data.midValue)}</div>
        <div class="range-type">Mid Point</div>
      </div>
      <div class="range-label">
        <div class="range-value">${formatValue(data.highValue)}</div>
        <div class="range-type">High Estimate</div>
      </div>
    </div>
    <div class="industry-range">
      <div class="industry-item">
        <div class="industry-label">Industry Low</div>
        <div class="industry-value">${formatValue(data.industryLow)}</div>
      </div>
      <div class="industry-item">
        <div class="industry-label">Industry High</div>
        <div class="industry-value">${formatValue(data.industryHigh)}</div>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  return await renderChartToBase64(html, 660, 480);
}

/**
 * Render HTML chart to Base64 image using Puppeteer
 */
async function renderChartToBase64(html: string, width: number = 840, height: number = 600): Promise<string> {
  let browser;

  try {
    console.log('[Chart] Launching browser for chart rendering...');

    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });

    const page = await browser.newPage();

    // Set viewport size
    await page.setViewport({ width, height });
    
    // Load HTML
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    // Wait for Chart.js to render
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Take screenshot of the chart container
    const element = await page.$('#chart-container');
    if (!element) {
      throw new Error('Chart container not found');
    }
    
    const screenshot = await element.screenshot({ type: 'png' });
    const base64 = Buffer.from(screenshot).toString('base64');
    
    console.log('[Chart] Chart rendered successfully');
    
    return `data:image/png;base64,${base64}`;
    
  } catch (error) {
    console.error('[Chart] Error rendering chart:', error);
    return ''; // Return empty string on error (graceful degradation)
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
