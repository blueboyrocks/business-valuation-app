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
 * Render HTML chart to Base64 image using Puppeteer
 */
async function renderChartToBase64(html: string): Promise<string> {
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
    await page.setViewport({ width: 840, height: 600 });
    
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
