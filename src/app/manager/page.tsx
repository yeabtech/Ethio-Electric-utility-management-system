'use client';

import { useState } from 'react';
import Sidebar from './components/sidebar';
import RegisterPage from './register/page';
import EmployeePage from './employee/page';
import "@/app/globals.css"

export default function ManagerPage() {
  const [activePage, setActivePage] = useState('Dashboard');

  const renderContent = () => {
    switch (activePage) {
      case 'Dashboard':
        return (
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-2xl text-black font-semibold mb-4">Manager Dashboard</h2>
            <p className='text-black'>Welcome to your Manager dashboard</p>
          </div>
        );
      case 'Register Employee':
        return <RegisterPage />;
      case 'Employees':
        return <EmployeePage />;
      case 'News':
        return (
          <div className="absolute inset-0 w-full h-full">
            <iframe 
              src="/manager/news" 
              className="w-full h-full border-0" 
              title="News Management"
              style={{ overflow: 'hidden' }}
            />
          </div>
        );
      case 'Office Management':
        return (
          <div className="absolute inset-0 w-full h-full">
            <iframe 
              src="/manager/officeManagment" 
              className="w-full h-full border-0" 
              title="Office Management"
              style={{ overflow: 'hidden' }}
             
            />
          </div>
        );
      default:
        return (
          <div className="bg-white p-8 rounded-lg shadow-md">
            <p className="text-lg text-black">Welcome to your Manager dashboard</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex relative" style={{ backgroundImage: 'url(/bg.png)', backgroundSize: 'cover', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' }}>
      {/* Sidebar */}
      <Sidebar onPageChange={setActivePage} />
      
      {/* Main Content */}
      <div className="flex-1 p-12 ml-72 relative overflow-hidden">
        {renderContent()}
      </div>
    </div>
  );
}
