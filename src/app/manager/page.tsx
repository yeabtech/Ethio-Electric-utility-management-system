'use client';

import { useState } from 'react';
import Sidebar from './components/sidebar';
import RegisterPage from './register/page';
import "@/app/globals.css"

export default function ManagerPage() {
  const [activePage, setActivePage] = useState('Dashboard');

  const renderContent = () => {
    switch (activePage) {
      case 'Dashboard':
        return (
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4">Manager Dashboard</h2>
            <p>Welcome to your Manager dashboard</p>
          </div>
        );
      case 'Register Employee':
        return <RegisterPage />;
      // Add more cases for other pages as they are implemented
      default:
        return (
          <div className="bg-white p-8 rounded-lg shadow-md">
            <p className="text-lg">Welcome to your Manager dashboard</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex bg-[#E6E6E6]">
      {/* Sidebar */}
      <Sidebar onPageChange={setActivePage} />
      
      {/* Main Content */}
      <div className="flex-1 p-12 ml-72">
        {renderContent()}
      </div>
    </div>
  );
}
