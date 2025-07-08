"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Sidebar from './components/sidebar';
import Dashboard from './components/dashboard';
import "@/app/globals.css";

export default function EstimatorPageClient() {
  const searchParams = useSearchParams();
  const [activePage, setActivePage] = useState('Dashboard');

  // Set initial active page based on query parameter
  useEffect(() => {
    const activePageParam = searchParams.get('activePage');
    if (activePageParam) {
      setActivePage(activePageParam);
    }
  }, [searchParams]);

  const renderContent = () => {
    switch (activePage) {
      case 'Dashboard':
        return <Dashboard />;
      case 'Connection Pricing':
        return (
          <div className="bg-white rounded-lg shadow-md h-full">
            <iframe 
              src="/estimator/connectionPricing"
              className="w-full h-full min-h-[800px] border-0 rounded-lg"
              title="Pricing Management"
            />
          </div>
        );
      case 'Meter Pricing':
        return (
          <div className="bg-white rounded-lg shadow-md h-full">
            <iframe 
              src="/estimator/meterPricing"
              className="w-full h-full min-h-[800px] border-0 rounded-lg"
              title="Meter Pricing Management"
            />
          </div>
        );
      case 'Estimations':
        return (
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4">Estimations</h2>
            <p className="text-lg">View and manage service estimations</p>
          </div>
        );
      case 'Reports':
        return (
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4">Reports</h2>
            <p className="text-lg">Generate and view estimation reports</p>
          </div>
        );
      case 'Analytics':
        return (
          <div className="bg-white rounded-lg shadow-md h-full">
            <iframe 
              src="/estimator/analytics"
              className="w-full h-full min-h-[800px] border-0 rounded-lg"
              title="Receipt Analytics"
            />
          </div>
        );
      case 'Notifications':
        return (
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4">Notifications</h2>
            <p className="text-lg">View your notifications and alerts</p>
          </div>
        );
      case 'Support':
        return (
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4">Support</h2>
            <p className="text-lg">Get help and support for estimation tasks</p>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundImage: 'url(/bg.png)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
      {/* Sidebar */}
      <Sidebar onPageChange={setActivePage} />
      {/* Main Content - Add margin-left to account for sidebar width */}
      <div className="flex-1 p-12 ml-72">
        {renderContent()}
      </div>
    </div>
  );
} 