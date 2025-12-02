/**
 * Chart generation using QuickChart.io API
 * This is serverless-friendly and doesn't require Canvas dependencies
 */

export interface ValuationData {
  asset: number;
  income: number;
  market: number;
}

export interface FinancialMetricsData {
  years: string[];
  revenue: number[];
  cashFlow: number[];
  totalDebt: number[];
  receivables: number[];
  inventory: number[];
}

/**
 * Generate valuation approaches comparison chart
 */
export async function generateValuationChart(data: ValuationData): Promise<string> {
  const chartConfig = {
    type: 'bar',
    data: {
      labels: ['Asset Approach', 'Income Approach', 'Market Approach'],
      datasets: [{
        label: 'Valuation Amount',
        data: [data.asset, data.income, data.market],
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
      plugins: {
        title: {
          display: true,
          text: 'Valuation Approaches Comparison',
          font: { size: 18, weight: 'bold' }
        },
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value: any) {
              return '$' + (value / 1000000).toFixed(1) + 'M';
            }
          }
        }
      }
    }
  };

  const url = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartConfig))}&width=800&height=400&format=png`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`QuickChart API error: ${response.statusText}`);
    }
    const buffer = await response.arrayBuffer();
    return `data:image/png;base64,${Buffer.from(buffer).toString('base64')}`;
  } catch (error) {
    console.error('[Chart] Error generating valuation chart:', error);
    return '';
  }
}

/**
 * Generate financial metrics trend chart
 */
export async function generateFinancialMetricsChart(data: FinancialMetricsData): Promise<string> {
  const chartConfig = {
    type: 'line',
    data: {
      labels: data.years,
      datasets: [
        {
          label: 'Revenue',
          data: data.revenue,
          borderColor: 'rgba(54, 162, 235, 1)',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderWidth: 3,
          fill: false
        },
        {
          label: 'Cash Flow',
          data: data.cashFlow,
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderWidth: 3,
          fill: false
        },
        {
          label: 'Total Debt',
          data: data.totalDebt,
          borderColor: 'rgba(255, 99, 132, 1)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          borderWidth: 3,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Financial Metrics Trend',
          font: { size: 18, weight: 'bold' }
        },
        legend: {
          display: true,
          position: 'bottom'
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value: any) {
              if (value >= 1000000) {
                return '$' + (value / 1000000).toFixed(1) + 'M';
              } else if (value >= 1000) {
                return '$' + (value / 1000).toFixed(0) + 'K';
              }
              return '$' + value;
            }
          }
        }
      }
    }
  };

  const url = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartConfig))}&width=800&height=400&format=png`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`QuickChart API error: ${response.statusText}`);
    }
    const buffer = await response.arrayBuffer();
    return `data:image/png;base64,${Buffer.from(buffer).toString('base64')}`;
  } catch (error) {
    console.error('[Chart] Error generating financial metrics chart:', error);
    return '';
  }
}

/**
 * Generate KPI comparison chart
 */
export async function generateKPIChart(kpis: { name: string; value: number; benchmark: number }[]): Promise<string> {
  const chartConfig = {
    type: 'bar',
    data: {
      labels: kpis.map(k => k.name),
      datasets: [
        {
          label: 'Company',
          data: kpis.map(k => k.value),
          backgroundColor: 'rgba(54, 162, 235, 0.8)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 2
        },
        {
          label: 'Industry Benchmark',
          data: kpis.map(k => k.benchmark),
          backgroundColor: 'rgba(255, 159, 64, 0.8)',
          borderColor: 'rgba(255, 159, 64, 1)',
          borderWidth: 2
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'KPI Performance vs Industry Benchmarks',
          font: { size: 18, weight: 'bold' }
        },
        legend: {
          display: true,
          position: 'bottom'
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value: any) {
              return value.toFixed(1) + '%';
            }
          }
        }
      }
    }
  };

  const url = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartConfig))}&width=800&height=400&format=png`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`QuickChart API error: ${response.statusText}`);
    }
    const buffer = await response.arrayBuffer();
    return `data:image/png;base64,${Buffer.from(buffer).toString('base64')}`;
  } catch (error) {
    console.error('[Chart] Error generating KPI chart:', error);
    return '';
  }
}
