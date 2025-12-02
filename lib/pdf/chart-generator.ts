import { ChartJSNodeCanvas } from 'chartjs-node-canvas';
import { ChartConfiguration } from 'chart.js';

const width = 800;
const height = 400;

/**
 * Generate valuation history chart
 */
export async function generateValuationHistoryChart(
  dates: string[],
  values: number[]
): Promise<Buffer> {
  const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });

  const configuration: ChartConfiguration = {
    type: 'line',
    data: {
      labels: dates,
      datasets: [{
        label: 'Valuation History',
        data: values,
        borderColor: '#0066CC',
        backgroundColor: 'rgba(0, 102, 204, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
      }],
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Valuation History',
          font: { size: 18, weight: 'bold' },
        },
        legend: {
          display: false,
        },
      },
      scales: {
        y: {
          beginAtZero: false,
          ticks: {
            callback: function(value) {
              return '$' + value.toLocaleString();
            },
          },
        },
      },
    },
  };

  return await chartJSNodeCanvas.renderToBuffer(configuration);
}

/**
 * Generate financial metrics comparison chart
 */
export async function generateFinancialMetricsChart(
  years: string[],
  metrics: {
    revenue: number[];
    cashFlow: number[];
    totalDebt: number[];
    inventory: number[];
    receivables: number[];
  }
): Promise<Buffer> {
  const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });

  const configuration: ChartConfiguration = {
    type: 'line',
    data: {
      labels: years,
      datasets: [
        {
          label: 'Revenue',
          data: metrics.revenue,
          borderColor: '#7CB342',
          backgroundColor: 'rgba(124, 179, 66, 0.1)',
          borderWidth: 2,
        },
        {
          label: 'Cash Flow',
          data: metrics.cashFlow,
          borderColor: '#FF9800',
          backgroundColor: 'rgba(255, 152, 0, 0.1)',
          borderWidth: 2,
        },
        {
          label: 'Total Debt',
          data: metrics.totalDebt,
          borderColor: '#333333',
          backgroundColor: 'rgba(51, 51, 51, 0.1)',
          borderWidth: 2,
        },
        {
          label: 'Receivables',
          data: metrics.receivables,
          borderColor: '#42A5F5',
          backgroundColor: 'rgba(66, 165, 245, 0.1)',
          borderWidth: 2,
        },
        {
          label: 'Inventory',
          data: metrics.inventory,
          borderColor: '#7E57C2',
          backgroundColor: 'rgba(126, 87, 194, 0.1)',
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Financial Metrics Compared to Revenue',
          font: { size: 18, weight: 'bold' },
        },
        legend: {
          display: true,
          position: 'bottom',
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return '$' + (value as number).toLocaleString();
            },
          },
        },
      },
    },
  };

  return await chartJSNodeCanvas.renderToBuffer(configuration);
}

/**
 * Generate KPI trend chart
 */
export async function generateKPITrendChart(
  kpiName: string,
  years: string[],
  values: number[],
  industryAverage?: number
): Promise<Buffer> {
  const chartJSNodeCanvas = new ChartJSNodeCanvas({ width: 600, height: 300 });

  const datasets: any[] = [
    {
      label: 'Company',
      data: values,
      borderColor: '#0066CC',
      backgroundColor: 'rgba(0, 102, 204, 0.1)',
      borderWidth: 3,
      fill: true,
    },
  ];

  if (industryAverage !== undefined) {
    datasets.push({
      label: 'Industry Average',
      data: years.map(() => industryAverage),
      borderColor: '#FF6B6B',
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderDash: [5, 5],
      fill: false,
    });
  }

  const configuration: ChartConfiguration = {
    type: 'line',
    data: {
      labels: years,
      datasets,
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: kpiName,
          font: { size: 16, weight: 'bold' },
        },
        legend: {
          display: industryAverage !== undefined,
          position: 'bottom',
        },
      },
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  };

  return await chartJSNodeCanvas.renderToBuffer(configuration);
}

/**
 * Generate valuation approaches comparison chart
 */
export async function generateValuationApproachesChart(
  approaches: {
    asset: number;
    income: number;
    market: number;
  }
): Promise<Buffer> {
  const chartJSNodeCanvas = new ChartJSNodeCanvas({ width: 600, height: 400 });

  const configuration: ChartConfiguration = {
    type: 'bar',
    data: {
      labels: ['Asset Approach', 'Income Approach', 'Market Approach'],
      datasets: [{
        label: 'Valuation Amount',
        data: [approaches.asset, approaches.income, approaches.market],
        backgroundColor: ['#3b82f6', '#10b981', '#f59e0b'],
        borderColor: ['#1e40af', '#059669', '#d97706'],
        borderWidth: 2,
      }],
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Valuation Approaches Comparison',
          font: { size: 18, weight: 'bold' },
        },
        legend: {
          display: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return '$' + (value as number).toLocaleString();
            },
          },
        },
      },
    },
  };

  return await chartJSNodeCanvas.renderToBuffer(configuration);
}

/**
 * Generate KPI gauge chart
 */
export async function generateKPIGaugeChart(
  kpiName: string,
  value: number,
  industryAverage: number,
  unit: string = '%'
): Promise<Buffer> {
  const chartJSNodeCanvas = new ChartJSNodeCanvas({ width: 400, height: 300 });

  // Determine performance color
  const ratio = value / industryAverage;
  let color = '#7CB342'; // Green (good)
  if (ratio < 0.9) color = '#7E57C2'; // Purple (poor)
  else if (ratio < 1.1) color = '#42A5F5'; // Blue (average)

  const configuration: ChartConfiguration = {
    type: 'bar',
    data: {
      labels: ['Company', 'Industry Avg'],
      datasets: [{
        label: kpiName,
        data: [value, industryAverage],
        backgroundColor: [color, '#CCCCCC'],
        borderWidth: 0,
      }],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: kpiName,
          font: { size: 14, weight: 'bold' },
        },
        legend: {
          display: false,
        },
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return value + unit;
            },
          },
        },
      },
    },
  };

  return await chartJSNodeCanvas.renderToBuffer(configuration);
}
