"use client";

import { useState, useEffect, useRef } from "react";
import { UserButton, useUser } from "@clerk/nextjs";
import TechnicianSidebar from "./components/TechnicianSidebar";
import dynamic from "next/dynamic";
import Chart from "chart.js/auto";
import { addMonths, format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import Image from "next/image";

export default function TechnicianDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState("Dashboard");
  const { user, isLoaded } = useUser();
  const [taskCounts, setTaskCounts] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    cancelled: 0,
  });
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [monthlyTasks, setMonthlyTasks] = useState<any[]>([]);
  const [completionTimes, setCompletionTimes] = useState<number[]>([]);
  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  const chart1Ref = useRef<any>(null);
  const chart2Ref = useRef<any>(null);
  const chart1Instance = useRef<any>(null);
  const chart2Instance = useRef<any>(null);
  const [showLoader, setShowLoader] = useState(false);

  useEffect(() => {
    if (!isLoaded || !user?.id) return;
    const fetchTasks = async () => {
      try {
        const res = await fetch(`/api/technician/tasks?clerkUserId=${user.id}`);
        if (!res.ok) return;
        const tasks = await res.json();
        let completed = 0, pending = 0, cancelled = 0;
        // Filter for selected month
        const now = selectedMonth;
        const thisMonthTasks = tasks.filter((t: any) => {
          const sched = new Date(t.scheduledAt);
          return sched.getFullYear() === now.getFullYear() && sched.getMonth() === now.getMonth();
        });
        setMonthlyTasks(thisMonthTasks);
        setRecentTasks(tasks); // tasks is already the last 10 from API
        // For completion time chart
        const times = thisMonthTasks
          .filter((t: any) => t.status === "completed" && t.startedAt && t.completedAt)
          .map((t: any) => {
            const start = new Date(t.startedAt);
            const end = new Date(t.completedAt);
            return (end.getTime() - start.getTime()) / (1000 * 60 * 60); // hours
          });
        setCompletionTimes(times);
        for (const t of tasks) {
          if (t.status === "completed") completed++;
          else if (t.status === "cancelled") cancelled++;
          else if (t.status === "assigned" || t.status === "in_progress") pending++;
        }
        setTaskCounts({
          total: tasks.length,
          completed,
          pending,
          cancelled,
        });
      } catch (e) {
        // Optionally handle error
      }
    };
    fetchTasks();
  }, [isLoaded, user?.id, selectedMonth]);

  // Draw charts when data changes
  useEffect(() => {
    if (!chart1Ref.current || !chart2Ref.current) return;
    // Destroy previous
    if (chart1Instance.current) (chart1Instance.current as any).destroy();
    if (chart2Instance.current) (chart2Instance.current as any).destroy();
    // Chart 1: Completed vs Cancelled
    const completedCount = monthlyTasks.filter((t: any) => t.status === "completed").length;
    const cancelledCount = monthlyTasks.filter((t: any) => t.status === "cancelled").length;
    chart1Instance.current = new Chart(chart1Ref.current, {
      type: "bar",
      data: {
        labels: ["Completed", "Cancelled"],
        datasets: [{
          label: "Tasks this month",
          data: [completedCount, cancelledCount],
          backgroundColor: ["#4F46E5", "#F87171"],
        }],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          title: { display: true, text: "Completed vs Cancelled (This Month)" },
        },
        scales: {
          y: { beginAtZero: true, title: { display: true, text: "Count" }, suggestedMin: 0, suggestedMax: Math.max(1, completedCount, cancelledCount) },
        },
      },
    });
    // Chart 2: Completion time histogram
    // Bin by 0-2, 2-4, 4-8, 8-16, 16+ hours
    const bins = [2, 4, 8, 16];
    const binLabels = ["0-2h", "2-4h", "4-8h", "8-16h", "16h+"];
    const binCounts = [0, 0, 0, 0, 0];
    completionTimes.forEach(h => {
      if (h < 2) binCounts[0]++;
      else if (h < 4) binCounts[1]++;
      else if (h < 8) binCounts[2]++;
      else if (h < 16) binCounts[3]++;
      else binCounts[4]++;
    });
    chart2Instance.current = new Chart(chart2Ref.current, {
      type: "bar",
      data: {
        labels: binLabels,
        datasets: [{
          label: "Task Completion Time (hours)",
          data: binCounts,
          backgroundColor: "#38BDF8",
        }],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          title: { display: true, text: "Task Completion Time (This Month)" },
        },
        scales: {
          y: { beginAtZero: true, title: { display: true, text: "# Tasks" }, suggestedMin: 0, suggestedMax: Math.max(1, ...binCounts) },
          x: { title: { display: true, text: "Completion Time (hours)" } },
        },
      },
    });
    return () => {
      if (chart1Instance.current) (chart1Instance.current as any).destroy();
      if (chart2Instance.current) (chart2Instance.current as any).destroy();
    };
  }, [monthlyTasks, completionTimes]);

  return (
    <div className="flex min-h-screen" style={{ backgroundImage: 'url(/bg.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
      {/* Sidebar */}
      <TechnicianSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        onMenuSelect={(label) => {
          if (label === "Dashboard") {
            setShowLoader(false);
          } else {
            setShowLoader(true);
          }
          setSelectedMenu(label);
        }}
        activeMenu={selectedMenu}
      />
      {/* Loader overlay */}
      {showLoader && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none">
          <Image src="/loader.gif" alt="Loading..." width={80} height={80} style={{ background: 'transparent' }} />
        </div>
      )}
      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-4 md:p-8">
         
          {/* Show iframe for My Tasks, else show dashboard widgets */}
          {selectedMenu === "Pending Tasks" ? (
            <iframe
              src="/technician/pendingTasks"
              title="Pending Tasks"
              className="w-full h-screen min-h-[600px] md:h-full rounded-none border-0"
              style={{ minHeight: '100vh' }}
              onLoad={() => setShowLoader(false)}
            />
          ) : selectedMenu === "Completed Tasks" ? (
            <iframe
              src="/technician/completedTasks"
              title="Completed Tasks"
              className="w-full h-screen min-h-[600px] md:h-full rounded-none border-0"
              style={{ minHeight: '100vh' }}
              onLoad={() => setShowLoader(false)}
            />
          ) : selectedMenu === "Canceled Tasks" ? (
            <iframe
              src="/technician/cancledTasks"
              title="Canceled Tasks"
              className="w-full h-screen min-h-[600px] md:h-full rounded-none border-0"
              style={{ minHeight: '100vh' }}
              onLoad={() => setShowLoader(false)}
            />
          ) : selectedMenu === "Reports" ? (
            <iframe
              src="/technician/report"
              title="Report"
              className="w-full h-screen min-h-[600px] md:h-full rounded-none border-0"
              style={{ minHeight: '100vh' }}
              onLoad={() => setShowLoader(false)}
            />
          ) : (
            
            <div className="space-y-6">
               <h1 className="text-2xl font-bold mb-4 text-black text-center">Technician Dashboard</h1>
              {/* Top Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Services Card */}
                <div className="bg-white rounded-2xl p-6 shadow-lg flex flex-col items-start border border-gray-200 transition-transform hover:scale-105 relative">
                  <span className="absolute top-4 right-4">
                    {/* Clipboard Icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5h6M9 3h6a2 2 0 012 2v1a2 2 0 002 2v11a2 2 0 01-2 2H7a2 2 0 01-2-2V8a2 2 0 002-2V5a2 2 0 012-2z" /></svg>
                  </span>
                  <span className="text-gray-700 text-sm font-semibold mb-1">Total Services</span>
                  <span className="text-3xl font-extrabold text-gray-900 mt-1 mb-2">{taskCounts.total}</span>
                  <span className="text-gray-500 text-xs">
                    {taskCounts.total === 0 ? "No tasks assigned yet" : `You have handled ${taskCounts.total} tasks`}
                  </span>
                </div>
                {/* Completed Card */}
                <div className="bg-white rounded-2xl p-6 shadow-lg flex flex-col items-start border border-gray-200 transition-transform hover:scale-105 relative">
                  <span className="absolute top-4 right-4">
                    {/* Check Circle Icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2l4-4m5 2a9 9 0 11-18 0a9 9 0 0118 0z" /></svg>
                  </span>
                  <span className="text-gray-700 text-sm font-semibold mb-1">Completed</span>
                  <span className="text-3xl font-extrabold text-gray-900 mt-1 mb-2">{taskCounts.completed}</span>
                  <span className="text-gray-500 text-xs">
                    {taskCounts.completed === 0 ? "No tasks completed yet" : `You've completed ${taskCounts.completed} tasks`}
                  </span>
                </div>
                {/* Pending Card */}
                <div className="bg-white rounded-2xl p-6 shadow-lg flex flex-col items-start border border-gray-200 transition-transform hover:scale-105 relative">
                  <span className="absolute top-4 right-4">
                    {/* Clock Icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0a9 9 0 0118 0z" /></svg>
                  </span>
                  <span className="text-gray-700 text-sm font-semibold mb-1">Pending</span>
                  <span className="text-3xl font-extrabold text-gray-900 mt-1 mb-2">{taskCounts.pending}</span>
                  <span className="text-gray-500 text-xs">
                    {taskCounts.pending === 0 ? "No pending tasks" : `You have ${taskCounts.pending} pending tasks`}
                  </span>
                </div>
                {/* Cancelled Card */}
                <div className="bg-white rounded-2xl p-6 shadow-lg flex flex-col items-start border border-gray-200 transition-transform hover:scale-105 relative">
                  <span className="absolute top-4 right-4">
                    {/* X Circle Icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12m6-6a9 9 0 11-18 0a9 9 0 0118 0z" /></svg>
                  </span>
                  <span className="text-gray-700 text-sm font-semibold mb-1">Cancelled</span>
                  <span className="text-3xl font-extrabold text-gray-900 mt-1 mb-2">{taskCounts.cancelled}</span>
                  <span className="text-gray-500 text-xs">
                    {taskCounts.cancelled === 0 ? "No tasks cancelled" : `${taskCounts.cancelled} tasks were cancelled`}
                  </span>
                </div>
              </div>
              {/* Metrics Graph (placeholder) */}
              <div className="bg-[#23243a] rounded-xl p-6 shadow mt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-white text-lg font-semibold">Metrics</span>
                  <span className="text-gray-400 text-sm">{format(selectedMonth, 'MMMM yyyy')}</span>
                </div>
                {/* Month selector */}
                <div className="flex flex-wrap gap-2 mb-4 justify-center">
                  {Array.from({ length: 6 }).map((_, i) => {
                    const month = subMonths(new Date(), i);
                    return (
                      <button
                        key={i}
                        className={`px-3 py-1 rounded-lg border text-sm font-medium transition-colors duration-150 ${selectedMonth.getFullYear() === month.getFullYear() && selectedMonth.getMonth() === month.getMonth() ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-100'}`}
                        onClick={() => setSelectedMonth(month)}
                      >
                        {format(month, 'MMM yyyy')}
                      </button>
                    );
                  })}
                </div>
                <div className="flex flex-col md:flex-row gap-4 items-center justify-center">
                  {monthlyTasks.length === 0 ? (
                    <div className="text-gray-400 w-full text-center py-8">No tasks for this month.</div>
                  ) : (
                    <>
                      <div className="w-full md:w-1/2 h-64 flex items-center justify-center">
                        <canvas ref={chart1Ref} className="w-full h-full" />
                      </div>
                      <div className="w-full md:w-1/2 h-64 flex items-center justify-center">
                        <canvas ref={chart2Ref} className="w-full h-full" />
                      </div>
                    </>
                  )}
                </div>
              </div>
              {/* Order History & Notifications */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="md:col-span-2 bg-[#23243a] rounded-xl p-6 shadow">
                  <span className="text-white text-lg font-semibold mb-2 block">Tasks history</span>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left text-gray-400">
                      <thead>
                        <tr>
                          <th className="py-2 px-2">Task id</th>
                          <th className="py-2 px-2">Customer</th>
                          <th className="py-2 px-2">Started at</th>
                          <th className="py-2 px-2">Assigned by</th>
                          <th className="py-2 px-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentTasks.length === 0 ? (
                          <tr><td colSpan={5} className="py-4 text-center text-gray-500">No recent tasks found.</td></tr>
                        ) : (
                          recentTasks.map((task, idx) => {
                            const customer = task.customer?.verification?.[0];
                            const customerName = customer ? `${customer.firstName} ${customer.lastName}` : task.customer?.email || "-";
                            return (
                              <tr key={task.id || idx}>
                                <td className="py-2 px-2 text-pink-400">{task.id}</td>
                                <td className="py-2 px-2">{customerName}</td>
                                <td className="py-2 px-2">{task.startedAt ? new Date(task.startedAt).toLocaleString() : "-"}</td>
                                <td className="py-2 px-2">{(() => {
                                  if (task.assignedByFirstName || task.assignedByLastName) {
                                    return `${task.assignedByFirstName || ''} ${task.assignedByLastName || ''}`.trim();
                                  }
                                  const ab = task.assignedBy;
                                  return ab?.email || "-";
                                })()}</td>
                                <td className={`py-2 px-2 ${task.status === "completed" ? "text-green-400" : task.status === "cancelled" ? "text-blue-400" : task.status === "in_progress" ? "text-yellow-400" : ""}`}>{task.status}</td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="bg-[#23243a] rounded-xl p-6 shadow">
                  <span className="text-white text-lg font-semibold mb-2 block">Notifications</span>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                      <span className="inline-block h-8 w-8 rounded-full bg-gray-500"></span>
                      <div>
                        <span className="text-white font-medium">David Paul</span>
                        <span className="block text-gray-400 text-xs">requested for a refrigerator repair - Warranty (Y)<br />10 mins ago <button className="text-blue-400 ml-2">Accept</button></span>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="inline-block h-8 w-8 rounded-full bg-gray-500"></span>
                      <div>
                        <span className="text-white font-medium">Immanuel</span>
                        <span className="block text-gray-400 text-xs">ordered a microwave oven recently. Demo requested<br />14 mins ago <button className="text-blue-400 ml-2">Accept</button></span>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="inline-block h-8 w-8 rounded-full bg-gray-500"></span>
                      <div>
                        <span className="text-white font-medium">Sandra As</span>
                        <span className="block text-gray-400 text-xs">requested service help malfunctioning air cooler<br />20 mins ago <button className="text-blue-400 ml-2">Accept</button></span>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}