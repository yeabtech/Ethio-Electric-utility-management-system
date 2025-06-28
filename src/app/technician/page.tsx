"use client";

import { useState } from "react";
import { UserButton } from "@clerk/nextjs";
import TechnicianSidebar from "./components/TechnicianSidebar";

export default function TechnicianDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState("Dashboard");

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <TechnicianSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        onMenuSelect={setSelectedMenu}
        activeMenu={selectedMenu}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Mobile menu button */}
        <div className="md:hidden p-2">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-md bg-blue-600 text-white shadow-md"
            aria-label="Open sidebar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        <main className="flex-1 p-4 md:p-8">
         
          {/* Show iframe for My Tasks, else show dashboard widgets */}
          {selectedMenu === "My Tasks" ? (
            <iframe
              src="/technician/tasks"
              title="My Tasks"
              className="w-full h-screen min-h-[600px] md:h-full rounded-none border-0"
              style={{ minHeight: '100vh' }}
            />
          ) : (
            
            <div className="space-y-6">
               <h1 className="text-2xl font-bold mb-4">Technician Dashboard</h1>
              {/* Top Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-400 rounded-xl p-4 shadow flex flex-col">
                  <span className="text-white text-sm font-medium">Total services done</span>
                  <span className="text-2xl font-bold text-white mt-2">140 <span className="text-xs">↓</span></span>
                  <div className="mt-2"><div className="h-6 w-full bg-white/10 rounded" /></div>
                </div>
                <div className="bg-gradient-to-r from-orange-400 to-yellow-400 rounded-xl p-4 shadow flex flex-col">
                  <span className="text-white text-sm font-medium">Resolved cases</span>
                  <span className="text-2xl font-bold text-white mt-2">112 <span className="text-xs">↑</span></span>
                  <div className="mt-2"><div className="h-6 w-full bg-white/10 rounded" /></div>
                </div>
                <div className="bg-gradient-to-r from-cyan-400 to-blue-400 rounded-xl p-4 shadow flex flex-col">
                  <span className="text-white text-sm font-medium">Un-repairable</span>
                  <span className="text-2xl font-bold text-white mt-2">24 <span className="text-xs">↑</span></span>
                  <div className="mt-2"><div className="h-6 w-full bg-white/10 rounded" /></div>
                </div>
                <div className="bg-gradient-to-r from-red-400 to-orange-400 rounded-xl p-4 shadow flex flex-col">
                  <span className="text-white text-sm font-medium">Cancelled</span>
                  <span className="text-2xl font-bold text-white mt-2">04 <span className="text-xs">↓</span></span>
                  <div className="mt-2"><div className="h-6 w-full bg-white/10 rounded" /></div>
                </div>
              </div>
              {/* Metrics Graph (placeholder) */}
              <div className="bg-[#23243a] rounded-xl p-6 shadow mt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-white text-lg font-semibold">Metrics</span>
                  <span className="text-gray-400 text-sm">This year</span>
                </div>
                <div className="h-40 flex items-center justify-center">
                  {/* Placeholder for graph */}
                  <span className="text-gray-400">[Graph coming soon]</span>
                </div>
              </div>
              {/* Order History & Notifications */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="md:col-span-2 bg-[#23243a] rounded-xl p-6 shadow">
                  <span className="text-white text-lg font-semibold mb-2 block">Order history</span>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left text-gray-400">
                      <thead>
                        <tr>
                          <th className="py-2 px-2">Online store</th>
                          <th className="py-2 px-2">Customer</th>
                          <th className="py-2 px-2">Repair date</th>
                          <th className="py-2 px-2">Amount</th>
                          <th className="py-2 px-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="py-2 px-2 text-pink-400">#657946</td>
                          <td className="py-2 px-2">Richard B.</td>
                          <td className="py-2 px-2">17 Feb,2017</td>
                          <td className="py-2 px-2">$897</td>
                          <td className="py-2 px-2 text-green-400">Received</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-2 text-pink-400">#657923</td>
                          <td className="py-2 px-2">Harris J</td>
                          <td className="py-2 px-2">16 Feb,2017</td>
                          <td className="py-2 px-2">$40.90</td>
                          <td className="py-2 px-2 text-green-400">Serviced</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-2 text-pink-400">#657922</td>
                          <td className="py-2 px-2">Jacqueline</td>
                          <td className="py-2 px-2">16 Feb,2017</td>
                          <td className="py-2 px-2">$1460.90</td>
                          <td className="py-2 px-2 text-green-400">Serviced</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-2 text-pink-400">#657919</td>
                          <td className="py-2 px-2">Stephen</td>
                          <td className="py-2 px-2">16 Feb,2017</td>
                          <td className="py-2 px-2">$124.0</td>
                          <td className="py-2 px-2 text-yellow-400">Returned</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-2 text-pink-400">#657902</td>
                          <td className="py-2 px-2">Hawkins</td>
                          <td className="py-2 px-2">15 Feb,2017</td>
                          <td className="py-2 px-2">$33.79</td>
                          <td className="py-2 px-2 text-blue-400">Cancelled</td>
                        </tr>
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