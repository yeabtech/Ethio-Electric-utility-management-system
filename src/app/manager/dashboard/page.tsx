"use client";
import React, { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Chart from "chart.js/auto";
import type { ChartType } from "chart.js";

const statData = [
  { label: "Lorem Ipsum Sit", value: "98.5%", sub: "", icon: "📊" },
  { label: "Adipiscing Elit", value: "2 481", sub: "", icon: "👤" },
  { label: "Sed Do Eiusmod", value: "31 124", sub: "", icon: "👁️" },
  { label: "Tempor Incididunt", value: "$2 125", sub: "", icon: "🛒" },
];

const chartConfigs: {
  type: ChartType;
  ref: React.RefObject<HTMLCanvasElement | null>;
  data: any;
  options: any;
  title: string;
  centerText?: string;
}[] = [
  {
    type: "bar",
    ref: React.createRef<HTMLCanvasElement>(),
    data: {
      labels: ["VENIAM", "CILLUM", "LABORE", "TEMPOR", "ALIQUA"],
      datasets: [
        {
          label: "Dolor",
          data: [20, 25, 15, 22, 10],
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
    title: "Dolor",
  },
  {
    type: "line",
    ref: React.createRef<HTMLCanvasElement>(),
    data: {
      labels: ["01", "02", "03", "04", "05", "06", "07", "08", "09"],
      datasets: [
        {
          label: "Minim",
          data: [10, 20, 15, 30, 25, 18, 22, 28, 24],
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
    title: "Minim",
  },
  {
    type: "doughnut",
    ref: React.createRef<HTMLCanvasElement>(),
    data: {
      labels: ["$11 300", "$9 500", "$3 700"],
      datasets: [
        {
          data: [11300, 9500, 3700],
          backgroundColor: ["#38bdf8", "#f472b6", "#fbbf24"],
        },
      ],
    },
    options: {
      plugins: { legend: { position: "bottom" as const } },
    },
    title: "Lorem",
  },
  {
    type: "bar",
    ref: React.createRef<HTMLCanvasElement>(),
    data: {
      labels: ["2019", "2020", "2021", "2022"],
      datasets: [
        {
          label: "Lorem",
          data: [3, 5, 7, 6],
          backgroundColor: "#fbbf24",
        },
        {
          label: "Dolor",
          data: [4, 6, 5, 8],
          backgroundColor: "#38bdf8",
        },
        {
          label: "Ipsum",
          data: [2, 4, 6, 7],
          backgroundColor: "#f472b6",
        },
      ],
    },
    options: {
      plugins: { legend: { position: "bottom" as const } },
      scales: { x: { grid: { display: false } }, y: { beginAtZero: true } },
    },
    title: "Velit",
  },
  {
    type: "doughnut",
    ref: React.createRef<HTMLCanvasElement>(),
    data: {
      labels: ["Irure"],
      datasets: [
        {
          data: [180347, 50000],
          backgroundColor: ["#818cf8", "#fbbf24"],
        },
      ],
    },
    options: {
      cutout: "80%",
      plugins: { legend: { display: false } },
    },
    title: "Irure",
    centerText: "$180,347",
  },
  {
    type: "bar",
    ref: React.createRef<HTMLCanvasElement>(),
    data: {
      labels: ["01", "02", "03", "04", "05", "06", "07", "08", "09"],
      datasets: [
        {
          label: "Velit",
          data: [2, 4, 6, 8, 7, 5, 3, 6, 9],
          backgroundColor: "#fbbf24",
        },
      ],
    },
    options: {
      plugins: { legend: { display: false } },
      scales: { x: { grid: { display: false } }, y: { beginAtZero: true } },
    },
    title: "Velit",
  },
  {
    type: "bar",
    ref: React.createRef<HTMLCanvasElement>(),
    data: {
      labels: Array.from({ length: 30 }, (_, i) => (i + 1).toString()),
      datasets: [
        {
          label: "Magna",
          data: Array.from({ length: 30 }, () => Math.floor(Math.random() * 30) + 5),
          backgroundColor: "#38bdf8",
        },
      ],
    },
    options: {
      plugins: { legend: { display: false } },
      scales: { x: { display: false }, y: { beginAtZero: true } },
    },
    title: "Magna",
  },
];

const gaugeData = [
  { label: "Aliqua", value: 68000, color: "#f472b6" },
  { label: "Veniam", value: 33000, color: "#fbbf24" },
  { label: "Cillum", value: 21000, color: "#38bdf8" },
];

export default function ManagerDashboard() {
  // Render all charts after mount
  useEffect(() => {
    chartConfigs.forEach((cfg) => {
      if (cfg.ref.current) {
        new Chart(cfg.ref.current, {
          type: cfg.type,
          data: cfg.data,
          options: cfg.options,
        });
      }
    });
  }, []);

  return (
    <div className="p-6 space-y-8">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statData.map((stat, i) => (
          <Card key={i} className="border shadow-md">
            <CardContent className="flex flex-col items-start py-6">
              <span className="text-2xl font-bold mb-1">{stat.value}</span>
              <span className="text-xs text-gray-500 mb-2">{stat.label}</span>
              <span className="text-3xl">{stat.icon}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Graphs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {chartConfigs.slice(0, 2).map((cfg, i) => (
          <Card key={i} className="border shadow-md">
            <CardHeader>
              <CardTitle>{cfg.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <canvas ref={cfg.ref} height={180}></canvas>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Donut, Bar, Donut */}
        {chartConfigs.slice(2, 5).map((cfg, i) => (
          <Card key={i} className="border shadow-md">
            <CardHeader>
              <CardTitle>{cfg.title}</CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <canvas ref={cfg.ref} height={180}></canvas>
              {cfg.centerText && (
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xl font-bold text-gray-700 pointer-events-none">
                  {cfg.centerText}
                </span>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {chartConfigs.slice(5, 7).map((cfg, i) => (
          <Card key={i} className="border shadow-md">
            <CardHeader>
              <CardTitle>{cfg.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <canvas ref={cfg.ref} height={180}></canvas>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {gaugeData.map((g, i) => (
          <Card key={i} className="border shadow-md flex flex-col items-center justify-center py-8">
            <div className="relative w-24 h-24 flex items-center justify-center mb-2">
              <svg width="96" height="96">
                <circle cx="48" cy="48" r="40" stroke="#e5e7eb" strokeWidth="10" fill="none" />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke={g.color}
                  strokeWidth="10"
                  fill="none"
                  strokeDasharray={2 * Math.PI * 40}
                  strokeDashoffset={2 * Math.PI * 40 * (1 - g.value / 68000)}
                  strokeLinecap="round"
                  transform="rotate(-90 48 48)"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xl font-bold text-gray-700">
                {g.value >= 1000 ? `${Math.round(g.value / 1000)}K` : g.value}
              </span>
            </div>
            <span className="text-sm text-gray-500">{g.label}</span>
          </Card>
        ))}
      </div>
    </div>
  );
}
