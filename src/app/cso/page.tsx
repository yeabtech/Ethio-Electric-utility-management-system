'use client';

import { useState } from 'react';
import Sidebar from './components/sidebar';
import Dashboard from './components/dashboard';
import VerificationQueue from './verifications/page';
import CSOServiceApprovalPage from './services/page';
import AssignTasksPage from './tasks/assign/page';
import UsersPage from './users/page';
import "@/app/globals.css"

export default function CustomerOperatorPage() {
  const [activePage, setActivePage] = useState('Dashboard');

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
      default:
        return <div className="bg-white p-8 rounded-lg shadow-md">
          <p className="text-lg">Welcome to your Customer Service Operator dashboard</p>
        </div>;
    }
  };

  return (
    <div className="min-h-screen flex bg-[#E6E6E6]">
      {/* Sidebar */}
      <Sidebar onPageChange={setActivePage} />
      
      {/* Main Content - Add margin-left to account for sidebar width */}
      <div className="flex-1 p-12 ml-72">
        {renderContent()}
      </div>
    </div>
  );
}