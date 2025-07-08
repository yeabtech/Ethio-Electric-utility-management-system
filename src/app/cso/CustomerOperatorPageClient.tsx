"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Sidebar from './components/sidebar';
import Dashboard from './components/dashboard';
import VerificationQueue from './verifications/page';
import CSOServiceApprovalPage from './services/page';
import AssignTasksPage from './tasks/assign/page';
import UsersPage from './users/page';
import CustomerSupportPage from './support/page';
import AnalyticsPage from './analytics/page';
import "@/app/globals.css";

export default function CustomerOperatorPageClient() {
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
      case 'Users':
        return <UsersPage />;
      case 'verfiy users':
        return <VerificationQueue />;
      case 'services':
        return <CSOServiceApprovalPage />;
      case 'Tasks assign':
        return <AssignTasksPage />;
      case 'Support':
        return <CustomerSupportPage />;
      case 'Analytics':
        return <AnalyticsPage />;
      default:
        return <div className="bg-white p-8 rounded-lg shadow-md">
          <p className="text-lg">Welcome to your Customer Service Operator dashboard</p>
        </div>;
    }
  };

  // Helper to check if the current page should be wrapped (iframe-like pages)
  const isIframePage = [
    'Users',
    'verfiy users',
    'services',
    'Tasks assign',
    'Support',
    'Analytics',
  ].includes(activePage);

  return (
    <div className="min-h-screen flex bg-[#E6E6E6]">
      {/* Sidebar */}
      <Sidebar onPageChange={setActivePage} />
      {/* Main Content - Add margin-left to account for sidebar width */}
      <div
        className="flex-1 p-12 ml-72 text-black"
        style={{
          backgroundImage: 'url(/bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {isIframePage ? (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 md:p-8 w-full h-full min-h-[600px] text-black">
            {renderContent()}
          </div>
        ) : (
          renderContent()
        )}
      </div>
    </div>
  );
} 