"use client";
import React, { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Chart from "chart.js/auto";
import type { ChartType } from "chart.js";

export default function ManagerDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const chartRefs = Array.from({ length: 2 }, () => useRef<HTMLCanvasElement>(null));

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/estimator/statistics");
        if (!res.ok) throw new Error("Failed to fetch dashboard data");
        const data = await res.json();
        setStats(data);
      } catch (err: any) {
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  // Prepare stat cards (recommended for manager)
  const statCards = stats
    ? [
        {
          label: "Total Revenue",
          value: `ETB ${stats.totalRevenue?.toLocaleString() ?? 0}`,
          icon: "💰",
        },
        {
          label: "Total Receipts",
          value: stats.totalReceipts ?? 0,
          icon: "🧾",
        },
        {
          label: "Pending Estimations",
          value: stats.pendingEstimations ?? 0,
          icon: "⏳",
        },
        {
          label: "Completed Estimations",
          value: stats.completedEstimations ?? 0,
          icon: "✅",
        },
      ]
    : [];

  // Prepare chart configs (bar: revenue by category, line: completed estimations by category)
  useEffect(() => {
    if (!stats) return;
    // Bar chart: Revenue by Category
    if (chartRefs[0].current) {
      new Chart(chartRefs[0].current, {
        type: "bar",
        data: {
          labels: Object.keys(stats.revenueByCategory || {}),
          datasets: [
            {
              label: "Revenue (ETB)",
              data: Object.values(stats.revenueByCategory || {}),
              backgroundColor: [
                "#f472b6",
                "#818cf8",
                "#fbbf24",
                "#38bdf8",
                "#a78bfa",
              ],
            },
          ],
        },
        options: {
          plugins: { legend: { display: false } },
          scales: { x: { grid: { display: false } }, y: { beginAtZero: true } },
        },
      });
    }
    // Line chart: Completed estimations by category
    if (chartRefs[1].current) {
      new Chart(chartRefs[1].current, {
        type: "line",
        data: {
          labels: Object.keys(stats.categorySummary || {}),
          datasets: [
            {
              label: "Completed Estimations",
              data: Object.values(stats.categorySummary || {}),
              borderColor: "#818cf8",
              backgroundColor: "rgba(129,140,248,0.2)",
              fill: true,
              tension: 0.4,
            },
          ],
        },
        options: {
          plugins: { legend: { display: false } },
          scales: { x: { grid: { display: false } }, y: { beginAtZero: true } },
        },
      });
    }
  }, [stats, chartRefs]);

  return (
    <div
      className="min-h-screen flex items-start justify-center"
      style={{
        backgroundImage: 'url(/bg.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="flex-1 p-6 space-y-8 ml-0 md:ml-0">
        {loading ? (
          <div className="flex justify-center items-center h-96">
            <span className="text-xl text-black font-semibold">Loading dashboard...</span>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-96">
            <span className="text-xl text-red-600 font-semibold">{error}</span>
          </div>
        ) : (
          <>
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {statCards.map((stat, i) => (
                <Card key={i} className="border shadow-md">
                  <CardContent className="flex flex-col items-start py-6">
                    <span className="text-2xl font-bold mb-1 text-black">{stat.value}</span>
                    <span className="text-xs text-black mb-2">{stat.label}</span>
                    <span className="text-3xl text-black">{stat.icon}</span>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Graphs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border shadow-md col-span-1 md:col-span-2 lg:col-span-2">
                <CardHeader>
                  <CardTitle>Revenue by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <canvas ref={chartRefs[0]} height={180}></canvas>
                </CardContent>
              </Card>
              <Card className="border shadow-md col-span-1 md:col-span-2 lg:col-span-2">
                <CardHeader>
                  <CardTitle>Completed Estimations by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <canvas ref={chartRefs[1]} height={180}></canvas>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
