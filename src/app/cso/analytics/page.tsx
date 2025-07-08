"use client";
import React, { useEffect, useState } from "react";
import {
  PieChart, Pie, Cell, Tooltip as PieTooltip, Legend as PieLegend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as BarTooltip, Legend as BarLegend,
  ResponsiveContainer,
  RadialBarChart, RadialBar,
  LineChart, Line, Tooltip as LineTooltip, XAxis as LineXAxis, YAxis as LineYAxis, CartesianGrid as LineCartesianGrid, Legend as LineLegend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

// Utility to fetch data from an endpoint
async function fetchJson(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch " + url);
  return res.json();
}

const COLORS = ["#22c55e", "#ef4444", "#facc15", "#0ea5e9", "#6366f1", "#f59e42", "#fbbf24"];

export default function CSOAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<{ subCity: string; woreda: string } | null>(null);
  const [data, setData] = useState<any>({});

  useEffect(() => {
    async function loadAnalytics() {
      setLoading(true);
      setError(null);
      try {
        // 1. Get CSO location
        const userRes = await fetch("/api/users");
        const userData = await userRes.json();
        if (!userData.csoLocation) throw new Error("CSO location not found");
        setLocation(userData.csoLocation);
        const { subCity, woreda } = userData.csoLocation;

        // 2. Fetch all analytics data in parallel
        const [
          approvedUsersRes,
          pendingVerificationsRes,
          availableTechsRes,
          employeesRes,
          tasksRes,
          pendingServicesRes,
          approvedServicesRes,
        ] = await Promise.all([
          fetchJson("/api/users"),
          fetchJson(`/api/cso/verifications?subCity=${encodeURIComponent(subCity)}&woreda=${encodeURIComponent(woreda)}`),
          fetchJson(`/api/technicians?subCity=${encodeURIComponent(subCity)}&woreda=${encodeURIComponent(woreda)}&status=available`),
          fetchJson("/api/employees"),
          fetchJson(`/api/cso/tasks?subCity=${encodeURIComponent(subCity)}&woreda=${encodeURIComponent(woreda)}`),
          fetchJson(`/api/cso/services?subCity=${encodeURIComponent(subCity)}&woreda=${encodeURIComponent(woreda)}`),
          fetchJson(`/api/cso/services/approved?subCity=${encodeURIComponent(subCity)}&woreda=${encodeURIComponent(woreda)}`),
        ]);

        // 3. Filter employees for CSOs in this location
        const csos = (employeesRes.employees || []).filter(
          (emp: any) =>
            emp.role === "cso" &&
            emp.employeeInfo &&
            emp.employeeInfo.subCity === subCity &&
            emp.employeeInfo.woreda === woreda
        );

        // 4. Count task statuses
        const taskStatusCounts = { assigned: 0, in_progress: 0, completed: 0, cancelled: 0 };
        (tasksRes || []).forEach((task: any) => {
          if (task.status in taskStatusCounts) taskStatusCounts[task.status as keyof typeof taskStatusCounts]++;
        });

        // 5. Count service statuses
        const pendingServices = pendingServicesRes.filter((s: any) => s.status === "pending");
        const rejectedServices = pendingServicesRes.filter((s: any) => s.status === "rejected");
        const approvedServices = approvedServicesRes;

        // 6. Count user statuses
        const approvedUsers = approvedUsersRes.customers || [];
        // For rejected users, fetch verifications with status 'rejected' (no endpoint, so filter from all employees)
        const rejectedUsers = (employeesRes.employees || []).filter(
          (emp: any) =>
            emp.role === "customer" &&
            emp.verification &&
            emp.verification.status === "rejected" &&
            emp.verification.subCity === subCity &&
            emp.verification.woreda === woreda
        );

        setData({
          approvedUsers,
          rejectedUsers,
          pendingVerifications: pendingVerificationsRes,
          availableTechs: availableTechsRes,
          csos,
          taskStatusCounts,
          pendingServices,
          approvedServices,
          rejectedServices,
        });
      } catch (err: any) {
        setError(err.message || "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, []);

  // Chart data
  const userPieData = [
    { name: "Approved", value: data.approvedUsers?.length || 0 },
    { name: "Rejected", value: data.rejectedUsers?.length || 0 },
    { name: "Pending", value: data.pendingVerifications?.length || 0 },
  ];

  const techBarData = [
    { name: "Available Technicians", count: data.availableTechs?.length || 0 },
    { name: "CSOs in Location", count: data.csos?.length || 0 },
  ];

  const taskDoughnutData = [
    { name: "Assigned", value: data.taskStatusCounts?.assigned || 0 },
    { name: "In Progress", value: data.taskStatusCounts?.in_progress || 0 },
    { name: "Completed", value: data.taskStatusCounts?.completed || 0 },
    { name: "Cancelled", value: data.taskStatusCounts?.cancelled || 0 },
  ];

  const serviceRadialData = [
    { name: "Pending", value: data.pendingServices?.length || 0, fill: COLORS[2] },
    { name: "Approved", value: data.approvedServices?.length || 0, fill: COLORS[0] },
    { name: "Rejected", value: data.rejectedServices?.length || 0, fill: COLORS[1] },
  ];

  // Service growth line chart data (show each status separately)
  const currentYear = new Date().getFullYear();
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  // Prepare monthly counts for each status
  const monthlyPending = Array(12).fill(0);
  const monthlyApproved = Array(12).fill(0);
  const monthlyRejected = Array(12).fill(0);
  (data.pendingServices || []).forEach((service: any) => {
    if (service.createdAt) {
      const date = new Date(service.createdAt);
      if (date.getFullYear() === currentYear) {
        monthlyPending[date.getMonth()]++;
      }
    }
  });
  (data.approvedServices || []).forEach((service: any) => {
    if (service.createdAt) {
      const date = new Date(service.createdAt);
      if (date.getFullYear() === currentYear) {
        monthlyApproved[date.getMonth()]++;
      }
    }
  });
  (data.rejectedServices || []).forEach((service: any) => {
    if (service.createdAt) {
      const date = new Date(service.createdAt);
      if (date.getFullYear() === currentYear) {
        monthlyRejected[date.getMonth()]++;
      }
    }
  });
  const lineChartData = months.map((month, idx) => ({
    month,
    Pending: monthlyPending[idx],
    Approved: monthlyApproved[idx],
    Rejected: monthlyRejected[idx],
  }));

  return (
    <div className="container mx-auto py-8 px-4 text-black">
      <h1 className="text-3xl font-bold mb-6 text-center">CSO Analytics Dashboard</h1>
      {location && (
        <div className="mb-6 text-center text-lg font-medium text-blue-700">
          Location: {location.subCity}, Woreda {location.woreda}
        </div>
      )}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="animate-spin w-12 h-12 text-blue-500" />
        </div>
      ) : error ? (
        <div className="text-red-500 text-center">{error}</div>
      ) : (
        <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Card className="shadow-lg border border-gray-200">
            <CardHeader>
              <CardTitle>User Status</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={userPieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    label
                  >
                    {userPieData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <PieTooltip />
                  <PieLegend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="shadow-lg border border-gray-200">
            <CardHeader>
              <CardTitle>Technicians & CSOs</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={techBarData} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <BarTooltip />
                  <BarLegend />
                  <Bar dataKey="count" fill="#6366f1">
                    {techBarData.map((entry, idx) => (
                      <Cell key={`bar-cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="shadow-lg border border-gray-200">
            <CardHeader>
              <CardTitle>Task Status</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={taskDoughnutData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    label
                  >
                    {taskDoughnutData.map((entry, idx) => (
                      <Cell key={`doughnut-cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <PieTooltip />
                  <PieLegend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="shadow-lg border border-gray-200">
            <CardHeader>
              <CardTitle>Service Status</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <RadialBarChart
                  innerRadius="30%"
                  outerRadius="80%"
                  data={serviceRadialData}
                  startAngle={90}
                  endAngle={-270}
                >
                  <RadialBar
                    label={{ position: "insideStart", fill: "#fff" }}
                    background
                    dataKey="value"
                  />
                  <PieTooltip />
                  <PieLegend />
                </RadialBarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
        {/* Service Growth Line Chart */}
        <Card className="shadow-lg border border-gray-200 mt-10">
          <CardHeader>
            <CardTitle>Service Growth by Status (This Year)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={lineChartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <LineCartesianGrid strokeDasharray="3 3" />
                <LineXAxis dataKey="month" />
                <LineYAxis allowDecimals={false} />
                <LineTooltip />
                <LineLegend />
                <Line type="monotone" dataKey="Pending" stroke="#facc15" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="Approved" stroke="#22c55e" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="Rejected" stroke="#ef4444" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        </>
      )}
    </div>
  );
}
