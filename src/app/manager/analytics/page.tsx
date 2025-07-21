'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  DollarSign, 
  Receipt, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  BarChart3,
  PieChart,
  Calendar,
  Download,
  RefreshCw
} from 'lucide-react';
import Chart from 'chart.js/auto';

interface ReceiptAnalytics {
  summary: {
    totalReceipts: number;
    paidReceipts: number;
    pendingReceipts: number;
    totalRevenue: number;
    pendingRevenue: number;
    totalTaxCollected: number;
    averageReceiptValue: number;
    averagePendingValue: number;
  };
  revenueByCategory: Record<string, number>;
  revenueByServiceType: Record<string, number>;
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
    count: number;
  }>;
  paymentStatusBreakdown: {
    paid: { count: number; revenue: number; percentage: number };
    pending: { count: number; revenue: number; percentage: number };
  };
  topServiceTypes: Array<{
    serviceType: string;
    revenue: number;
    count: number;
  }>;
  recentReceipts: Array<{
    id: string;
    serviceType: string;
    category: string;
    amount: number;
    status: string;
    paymentDate: string | null;
    createdAt: string;
    customerEmail: string;
  }>;
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<ReceiptAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState('all');
  const [status, setStatus] = useState('all');
  
  const revenueChartRef = useRef<HTMLCanvasElement>(null);
  const categoryChartRef = useRef<HTMLCanvasElement>(null);
  const statusChartRef = useRef<HTMLCanvasElement>(null);
  
  const revenueChartInstance = useRef<Chart | null>(null);
  const categoryChartInstance = useRef<Chart | null>(null);
  const statusChartInstance = useRef<Chart | null>(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (period !== 'all') params.append('period', period);
      if (status !== 'all') params.append('status', status);
      
      const response = await fetch(`/api/estimator/receipt-analytics?${params}`);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      
      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period, status]);

  useEffect(() => {
    if (!analytics) return;

    // Revenue Trend Chart
    if (revenueChartRef.current) {
      if (revenueChartInstance.current) {
        revenueChartInstance.current.destroy();
      }

      const ctx = revenueChartRef.current.getContext('2d');
      if (ctx) {
        revenueChartInstance.current = new Chart(ctx, {
          type: 'line',
          data: {
            labels: analytics.monthlyRevenue.map(item => item.month),
            datasets: [{
              label: 'Revenue (ETB)',
              data: analytics.monthlyRevenue.map(item => item.revenue),
              borderColor: 'rgb(59, 130, 246)',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              tension: 0.4,
              fill: true
            }, {
              label: 'Receipt Count',
              data: analytics.monthlyRevenue.map(item => item.count),
              borderColor: 'rgb(34, 197, 94)',
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              tension: 0.4,
              fill: false,
              yAxisID: 'y1'
            }]
          },
          options: {
            responsive: true,
            interaction: {
              mode: 'index' as const,
              intersect: false,
            },
            scales: {
              x: {
                display: true,
                title: {
                  display: true,
                  text: 'Month',
                  color: '#374151'
                },
                ticks: {
                  color: '#6B7280'
                },
                grid: {
                  color: '#E5E7EB'
                }
              },
              y: {
                type: 'linear' as const,
                display: true,
                position: 'left' as const,
                title: {
                  display: true,
                  text: 'Revenue (ETB)',
                  color: '#374151'
                },
                ticks: {
                  color: '#6B7280'
                },
                grid: {
                  color: '#E5E7EB'
                }
              },
              y1: {
                type: 'linear' as const,
                display: true,
                position: 'right' as const,
                title: {
                  display: true,
                  text: 'Receipt Count',
                  color: '#374151'
                },
                ticks: {
                  color: '#6B7280'
                },
                grid: {
                  drawOnChartArea: false,
                  color: '#E5E7EB'
                },
              },
            },
            plugins: {
              title: {
                display: true,
                text: 'Monthly Revenue Trend',
                color: '#111827'
              },
              legend: {
                labels: {
                  color: '#374151'
                }
              }
            }
          }
        });
      }
    }

    // Category Revenue Chart
    if (categoryChartRef.current) {
      if (categoryChartInstance.current) {
        categoryChartInstance.current.destroy();
      }

      const ctx = categoryChartRef.current.getContext('2d');
      if (ctx) {
        const categoryData = Object.entries(analytics.revenueByCategory);
        
        categoryChartInstance.current = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: categoryData.map(([category]) => category.replace('_', ' ')),
            datasets: [{
              data: categoryData.map(([, revenue]) => revenue),
              backgroundColor: [
                'rgba(255, 99, 132, 0.8)',
                'rgba(54, 162, 235, 0.8)',
                'rgba(255, 206, 86, 0.8)',
                'rgba(75, 192, 192, 0.8)',
              ],
              borderWidth: 2
            }]
          },
          options: {
            responsive: true,
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  color: '#374151'
                }
              },
              title: {
                display: true,
                text: 'Revenue by Service Category',
                color: '#111827'
              }
            }
          }
        });
      }
    }

    // Payment Status Chart
    if (statusChartRef.current) {
      if (statusChartInstance.current) {
        statusChartInstance.current.destroy();
      }

      const ctx = statusChartRef.current.getContext('2d');
      if (ctx) {
        statusChartInstance.current = new Chart(ctx, {
          type: 'pie',
          data: {
            labels: ['Paid', 'Pending'],
            datasets: [{
              data: [
                analytics.paymentStatusBreakdown.paid.count,
                analytics.paymentStatusBreakdown.pending.count
              ],
              backgroundColor: [
                'rgba(34, 197, 94, 0.8)',
                'rgba(239, 68, 68, 0.8)'
              ],
              borderWidth: 2
            }]
          },
          options: {
            responsive: true,
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  color: '#374151'
                }
              },
              title: {
                display: true,
                text: 'Payment Status Distribution',
                color: '#111827'
              }
            }
          }
        });
      }
    }

    return () => {
      if (revenueChartInstance.current) revenueChartInstance.current.destroy();
      if (categoryChartInstance.current) categoryChartInstance.current.destroy();
      if (statusChartInstance.current) statusChartInstance.current.destroy();
    };
  }, [analytics]);

  if (loading) {
    return (
      <div className="p-6 bg-white min-h-screen">
        <div className="flex items-center justify-center h-96">
          <div className="text-lg text-gray-600">Loading analytics...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-white min-h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Error: {error}
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-6 bg-white min-h-screen">
        <div className="text-center text-gray-600">No analytics data available</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-white min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Receipt Analytics</h1>
          <p className="text-gray-600">Comprehensive analysis of revenue and payment data</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchAnalytics} className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
         
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="text-sm font-medium text-gray-700 mb-2 block">Time Period</label>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="bg-white border-gray-300 text-gray-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-300">
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="monthly">This Month</SelectItem>
              <SelectItem value="yearly">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <label className="text-sm font-medium text-gray-700 mb-2 block">Payment Status</label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="bg-white border-gray-300 text-gray-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-300">
              <SelectItem value="all">All Receipts</SelectItem>
              <SelectItem value="paid">Paid Only</SelectItem>
              <SelectItem value="pending">Pending Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white border-gray-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">ETB {analytics.summary.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-gray-500">
              {analytics.summary.paidReceipts} paid receipts
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Pending Revenue</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">ETB {analytics.summary.pendingRevenue.toLocaleString()}</div>
            <p className="text-xs text-gray-500">
              {analytics.summary.pendingReceipts} pending receipts
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Total Receipts</CardTitle>
            <Receipt className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{analytics.summary.totalReceipts}</div>
            <p className="text-xs text-gray-500">
              Average: ETB {analytics.summary.averageReceiptValue.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Tax Collected</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">ETB {analytics.summary.totalTaxCollected.toLocaleString()}</div>
            <p className="text-xs text-gray-500">
              15% tax rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white border-gray-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <BarChart3 className="w-5 h-5" />
              Revenue Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <canvas ref={revenueChartRef} height="300"></canvas>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <PieChart className="w-5 h-5" />
              Revenue by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <canvas ref={categoryChartRef} height="300"></canvas>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 bg-white border-gray-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <PieChart className="w-5 h-5" />
              Payment Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <canvas ref={statusChartRef} height="250"></canvas>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 bg-white border-gray-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <TrendingUp className="w-5 h-5" />
              Top Performing Services
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.topServiceTypes.map((service, index) => (
                <div key={service.serviceType} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-semibold text-blue-600">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{service.serviceType.replace(/_/g, ' ')}</p>
                      <p className="text-sm text-gray-500">{service.count} receipts</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">ETB {service.revenue.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">
                      {((service.revenue / analytics.summary.totalRevenue) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Receipts */}
      <Card className="bg-white border-gray-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <Calendar className="w-5 h-5" />
            Recent Receipts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-gray-700 font-medium">Receipt ID</th>
                  <th className="text-left py-3 px-4 text-gray-700 font-medium">Service Type</th>
                  <th className="text-left py-3 px-4 text-gray-700 font-medium">Category</th>
                  <th className="text-left py-3 px-4 text-gray-700 font-medium">Amount</th>
                  <th className="text-left py-3 px-4 text-gray-700 font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-gray-700 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {analytics.recentReceipts.map((receipt) => (
                  <tr key={receipt.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200">
                    <td className="py-3 px-4 font-mono text-sm text-gray-800">
                      {receipt.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="py-3 px-4 text-gray-800">
                      {receipt.serviceType.replace(/_/g, ' ')}
                    </td>
                    <td className="py-3 px-4 text-gray-800">
                      {receipt.category.replace(/_/g, ' ')}
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-900">
                      ETB {receipt.amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={receipt.status === 'paid' ? 'default' : 'outline'} className={receipt.status === 'paid' ? 'bg-green-100 text-green-800 border-green-200 shadow-sm' : 'bg-orange-100 text-orange-800 border-orange-200 shadow-sm'}>
                        {receipt.status === 'paid' ? (
                          <CheckCircle className="w-3 h-3 mr-1" />
                        ) : (
                          <AlertCircle className="w-3 h-3 mr-1" />
                        )}
                        {receipt.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {new Date(receipt.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
