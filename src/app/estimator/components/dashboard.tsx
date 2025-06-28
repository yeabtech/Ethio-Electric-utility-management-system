import React, { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';

interface ChartDataItem {
  label: string;
  value: number;
  revenue: number;
  color: string;
  category: string;
}

interface StatisticsData {
  chartData: ChartDataItem[];
  categorySummary: {
    'NEW_CONNECTIONS': number;
    'NETWORK_OPERATIONS': number;
    'METERING_BILLING': number;
    'CUSTOMER_SUPPORT': number;
  };
  revenueByCategory: {
    'NEW_CONNECTIONS': number;
    'NETWORK_OPERATIONS': number;
    'METERING_BILLING': number;
    'CUSTOMER_SUPPORT': number;
  };
  pendingEstimations: number;
  completedEstimations: number;
  totalRevenue: number;
  totalReceipts: number;
}

const Dashboard = () => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<StatisticsData | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch statistics for all data
        const statsRes = await fetch('/api/estimator/statistics');
        if (!statsRes.ok) throw new Error('Failed to fetch statistics');
        const statsData: StatisticsData = await statsRes.json();

        setStatistics(statsData);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, []);

  useEffect(() => {
    if (chartRef.current && statistics) {
      const ctx = chartRef.current.getContext('2d');
      if (ctx) {
        // Destroy existing chart if it exists
        if (chartInstance.current) {
          chartInstance.current.destroy();
        }

        // Filter chart data based on selected category
        let filteredData = statistics.chartData;
        if (selectedCategory !== 'all') {
          filteredData = statistics.chartData.filter(item => item.category === selectedCategory);
        }

        // Create new 3D pie chart
        chartInstance.current = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: filteredData.map(item => item.label),
            datasets: [{
              data: filteredData.map(item => item.value),
              backgroundColor: filteredData.map(item => item.color),
              borderColor: filteredData.map(item => item.color.replace('0.8', '1').replace('0.6', '1').replace('0.4', '1')),
              borderWidth: 2,
              hoverOffset: 15
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  padding: 20,
                  usePointStyle: true,
                  font: {
                    size: 12
                  },
                  generateLabels: (chart) => {
                    const data = chart.data;
                    if (data.labels && data.datasets && data.datasets[0]) {
                      const dataset = data.datasets[0];
                      const backgroundColor = Array.isArray(dataset.backgroundColor) ? dataset.backgroundColor : [];
                      const borderColor = Array.isArray(dataset.borderColor) ? dataset.borderColor : [];
                      
                      return data.labels.map((label, i) => ({
                        text: `${label}: ${dataset.data[i]}`,
                        fillStyle: backgroundColor[i] as string || '#000',
                        strokeStyle: borderColor[i] as string || '#000',
                        lineWidth: 0,
                        pointStyle: 'circle',
                        hidden: false,
                        index: i
                      }));
                    }
                    return [];
                  }
                }
              },
              title: {
                display: true,
                text: selectedCategory === 'all' ? 'All Services Distribution' : `${selectedCategory.replace('_', ' ')} Services`,
                font: {
                  size: 18,
                  weight: 'bold'
                },
                padding: {
                  top: 10,
                  bottom: 30
                }
              },
              tooltip: {
                callbacks: {
                  label: (context) => {
                    const label = context.label || '';
                    const value = context.parsed;
                    const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
                    
                    // Find revenue for this service
                    const serviceData = filteredData.find(item => item.label === label);
                    const revenue = serviceData?.revenue || 0;
                    
                    return [
                      `${label}: ${value} (${percentage}%)`,
                      `Revenue: ETB ${revenue.toLocaleString()}`
                    ];
                  }
                }
              }
            },
            elements: {
              arc: {
                borderWidth: 0
              }
            }
          }
        });
      }
    }

    // Cleanup function
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [statistics, selectedCategory]);

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Estimator Dashboard</h1>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-center h-96">
            <div className="text-lg text-gray-600">Loading statistics...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Estimator Dashboard</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Error: {error}
        </div>
      </div>
    );
  }

  if (!statistics) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Estimator Dashboard</h1>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="text-center text-gray-600">No data available</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Estimator Dashboard</h1>
      
      {/* Real Data Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-r from-indigo-400 to-blue-400 rounded-xl p-6 shadow text-white">
          <div className="text-2xl font-bold">{statistics.chartData.reduce((sum, item) => sum + item.value, 0)}</div>
          <div className="text-sm">Total Services</div>
        </div>
        <div className="bg-gradient-to-r from-teal-400 to-cyan-400 rounded-xl p-6 shadow text-white">
          <div className="text-2xl font-bold">ETB {statistics.revenueByCategory.NEW_CONNECTIONS.toLocaleString()}</div>
          <div className="text-sm">New Connections Revenue</div>
        </div>
        <div className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-xl p-6 shadow text-white">
          <div className="text-2xl font-bold">ETB {statistics.revenueByCategory.NETWORK_OPERATIONS.toLocaleString()}</div>
          <div className="text-sm">Network Operations Revenue</div>
        </div>
        <div className="bg-gradient-to-r from-red-400 to-pink-400 rounded-xl p-6 shadow text-white">
          <div className="text-2xl font-bold">ETB {statistics.revenueByCategory.METERING_BILLING.toLocaleString()}</div>
          <div className="text-sm">Metering & Billing Revenue</div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedCategory === 'all'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All Services
          </button>
          {Object.entries(statistics.categorySummary).map(([category, count]) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {category.replace('_', ' ')} ({count})
            </button>
          ))}
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="h-96 mb-6">
          <canvas ref={chartRef}></canvas>
        </div>
        
        {/* Values Display */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
          {statistics.chartData
            .filter(item => selectedCategory === 'all' || item.category === selectedCategory)
            .map((item, index) => (
              <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                <div 
                  className="w-4 h-4 rounded-full mx-auto mb-2"
                  style={{ backgroundColor: item.color }}
                ></div>
                <div className="text-xl font-bold text-gray-800">{item.value}</div>
                <div className="text-sm text-gray-600 mb-1">{item.label}</div>
                <div className="text-xs text-green-600 font-medium">
                  ETB {item.revenue.toLocaleString()}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 