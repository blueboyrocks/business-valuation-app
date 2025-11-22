import { ChartConfiguration } from 'chart.js';
import { ChartJSNodeCanvas } from 'chartjs-node-canvas';

const width = 800;
const height = 500;

const chartJSNodeCanvas = new ChartJSNodeCanvas({ 
  width, 
  height,
  backgroundColour: 'white'
});

export async function generateRevenueChart(historicalData: any[]): Promise<Buffer> {
  const configuration: ChartConfiguration = {
    type: 'line',
    data: {
      labels: historicalData.map(d => d.year.toString()),
      datasets: [
        {
          label: 'Revenue',
          data: historicalData.map(d => d.revenue),
          borderColor: '#0ea5e9',
          backgroundColor: 'rgba(14, 165, 233, 0.1)',
          borderWidth: 3,
          tension: 0.4,
          fill: true,
        },
        {
          label: 'EBITDA',
          data: historicalData.map(d => d.ebitda),
          borderColor: '#8b5cf6',
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          borderWidth: 3,
          tension: 0.4,
          fill: true,
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            font: {
              size: 14
            }
          }
        },
        title: {
          display: true,
          text: 'Revenue and EBITDA Trend',
          font: {
            size: 18,
            weight: 'bold'
          }
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

  return await chartJSNodeCanvas.renderToBuffer(configuration);
}

export async function generateMarginChart(historicalData: any[]): Promise<Buffer> {
  const configuration: ChartConfiguration = {
    type: 'line',
    data: {
      labels: historicalData.map(d => d.year.toString()),
      datasets: [
        {
          label: 'Gross Margin %',
          data: historicalData.map(d => d.gross_margin_percent),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderWidth: 3,
          tension: 0.4,
          fill: true,
        },
        {
          label: 'EBITDA Margin %',
          data: historicalData.map(d => d.ebitda_margin_percent),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 3,
          tension: 0.4,
          fill: true,
        },
        {
          label: 'Net Margin %',
          data: historicalData.map(d => d.net_margin_percent),
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          borderWidth: 3,
          tension: 0.4,
          fill: true,
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            font: {
              size: 14
            }
          }
        },
        title: {
          display: true,
          text: 'Margin Analysis',
          font: {
            size: 18,
            weight: 'bold'
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            callback: function(value: any) {
              return value + '%';
            }
          }
        }
      }
    }
  };

  return await chartJSNodeCanvas.renderToBuffer(configuration);
}

export async function generateValuationWaterfallChart(approaches: any): Promise<Buffer> {
  const assetValue = approaches.asset_approach?.adjusted_net_asset_value || 0;
  const incomeValue = approaches.income_approach?.income_approach_conclusion || 0;
  const marketValue = approaches.market_approach?.weighted_market_value || 0;
  
  const configuration: ChartConfiguration = {
    type: 'bar',
    data: {
      labels: ['Asset Approach', 'Income Approach', 'Market Approach'],
      datasets: [{
        label: 'Valuation Amount',
        data: [assetValue, incomeValue, marketValue],
        backgroundColor: [
          '#0ea5e9',
          '#10b981',
          '#8b5cf6'
        ],
        borderWidth: 0
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: 'Valuation Approaches Comparison',
          font: {
            size: 18,
            weight: 'bold'
          }
        }
      },
      scales: {
        x: {
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

  return await chartJSNodeCanvas.renderToBuffer(configuration);
}

export async function generateApproachWeightingPieChart(reconciliation: any): Promise<Buffer> {
  const approaches = reconciliation.approach_weighting || [];
  
  const configuration: ChartConfiguration = {
    type: 'pie',
    data: {
      labels: approaches.map((a: any) => a.approach),
      datasets: [{
        data: approaches.map((a: any) => a.weight_assigned),
        backgroundColor: [
          '#0ea5e9',
          '#10b981',
          '#8b5cf6'
        ],
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            font: {
              size: 14
            }
          }
        },
        title: {
          display: true,
          text: 'Valuation Approach Weighting',
          font: {
            size: 18,
            weight: 'bold'
          }
        }
      }
    }
  };

  return await chartJSNodeCanvas.renderToBuffer(configuration);
}

export async function generateRiskGaugeChart(riskScore: number): Promise<Buffer> {
  // Create a doughnut chart to simulate a gauge
  const configuration: ChartConfiguration = {
    type: 'doughnut',
    data: {
      labels: ['Low Risk', 'Medium Risk', 'High Risk'],
      datasets: [{
        data: [3, 4, 3], // Ranges: 0-3, 3-7, 7-10
        backgroundColor: [
          '#10b981',
          '#f59e0b',
          '#ef4444'
        ],
        borderWidth: 0,
        circumference: 180,
        rotation: 270
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: `Overall Risk Score: ${riskScore.toFixed(1)}`,
          font: {
            size: 18,
            weight: 'bold'
          }
        }
      }
    }
  };

  return await chartJSNodeCanvas.renderToBuffer(configuration);
}

export async function generateBenchmarkingRadarChart(benchmarking: any): Promise<Buffer> {
  const rankings = benchmarking.industry_percentile_rankings || {};
  
  const configuration: ChartConfiguration = {
    type: 'radar',
    data: {
      labels: [
        'Revenue Growth',
        'Profitability',
        'Efficiency',
        'Leverage',
        'Overall'
      ],
      datasets: [{
        label: 'Company Percentile',
        data: [
          rankings.revenue_growth_percentile || 50,
          rankings.profitability_percentile || 50,
          rankings.efficiency_percentile || 50,
          rankings.leverage_percentile || 50,
          ((rankings.revenue_growth_percentile || 50) + 
           (rankings.profitability_percentile || 50) + 
           (rankings.efficiency_percentile || 50) + 
           (rankings.leverage_percentile || 50)) / 4
        ],
        borderColor: '#0ea5e9',
        backgroundColor: 'rgba(14, 165, 233, 0.2)',
        borderWidth: 3,
        pointBackgroundColor: '#0ea5e9',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: 'Industry Percentile Rankings',
          font: {
            size: 18,
            weight: 'bold'
          }
        }
      },
      scales: {
        r: {
          beginAtZero: true,
          max: 100,
          ticks: {
            stepSize: 25
          }
        }
      }
    }
  };

  return await chartJSNodeCanvas.renderToBuffer(configuration);
}
