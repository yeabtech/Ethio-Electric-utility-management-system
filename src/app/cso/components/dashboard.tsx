import React, { useEffect, useState } from 'react'; 
import { Bell } from 'lucide-react';

interface Customer {
  id: string;
  user: { id: string; email: string; role: string; isVerified: boolean };
  subCity: string;
  woreda: string;
}

interface Technician {
  id: string;
  user: { id: string; email: string };
  subCity: string;
  woreda: string;
  status: string;
}

interface Service {
  id: string;
  createdAt: string;
  // ...other fields
}

interface DashboardProps {
  onNotificationClick?: () => void;
  hasUnreadNotifications?: boolean;
}

const Dashboard = ({ onNotificationClick, hasUnreadNotifications }: DashboardProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userCount, setUserCount] = useState(0);
  const [technicianCount, setTechnicianCount] = useState(0);
  const [todayServiceCount, setTodayServiceCount] = useState(0);
  const [csoLocation, setCsoLocation] = useState<{ subCity: string; woreda: string } | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. Fetch users and get location
        const usersRes = await fetch('/api/users');
        if (!usersRes.ok) throw new Error('Failed to fetch users');
        const usersData = await usersRes.json();
        setUserCount(usersData.customers.length);
        setCsoLocation(usersData.csoLocation);

        if (!usersData.csoLocation) throw new Error('CSO location not found');
        const { subCity, woreda } = usersData.csoLocation;

        // 2. Fetch available technicians in area
        const techRes = await fetch(`/api/technicians?subCity=${encodeURIComponent(subCity)}&woreda=${encodeURIComponent(woreda)}&status=available`);
        if (!techRes.ok) throw new Error('Failed to fetch technicians');
        const techs: Technician[] = await techRes.json();
        setTechnicianCount(techs.length);

        // 3. Fetch all services in area, filter for today
        const servicesRes = await fetch(`/api/cso/services?subCity=${encodeURIComponent(subCity)}&woreda=${encodeURIComponent(woreda)}`);
        if (!servicesRes.ok) throw new Error('Failed to fetch services');
        const services: Service[] = await servicesRes.json();
        // Show all pending services (no date filter)
        setTodayServiceCount(services.length);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  return (
    <div className="relative">
      {/* Notification Icon */}
      <div className="absolute top-0 right-0 mt-2 mr-2">
        <button
          className="relative p-2 rounded-full bg-indigo-500 hover:bg-indigo-600 transition-colors"
          onClick={onNotificationClick}
        >
          <Bell className="w-6 h-6 text-white" />
          {hasUnreadNotifications ? (
            <span className="absolute top-1 right-1 block w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
          ) : null}
        </button>
      </div>
      <h2 className="text-2xl font-bold mb-4 text-black text-center">CSO Dashboard</h2>
      <p className="mb-6 text-center">Welcome to your Customer Service Operator dashboard</p>
      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {/* Users in Area Card */}
        <div className="bg-white rounded-2xl p-6 shadow-lg flex flex-col items-start border border-gray-200 transition-transform hover:scale-105 relative">
          <span className="absolute top-4 right-4">
            {/* Users Icon */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m9-4a4 4 0 10-8 0 4 4 0 008 0zm6 4v2a2 2 0 01-2 2h-4a2 2 0 01-2-2v-2a2 2 0 012-2h4a2 2 0 012 2z" /></svg>
          </span>
          <span className="text-gray-700 text-sm font-semibold mb-1">Users in Area</span>
          <span className="text-3xl font-extrabold text-gray-900 mt-1 mb-2">{loading ? '...' : userCount}</span>
          <span className="text-gray-500 text-xs">
            {userCount === 0 ? "No users found in your area" : `There are ${userCount} users in your area`}
          </span>
        </div>
        {/* Available Technicians Card */}
        <div className="bg-white rounded-2xl p-6 shadow-lg flex flex-col items-start border border-gray-200 transition-transform hover:scale-105 relative">
          <span className="absolute top-4 right-4">
            {/* Technician Icon */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
          </span>
          <span className="text-gray-700 text-sm font-semibold mb-1">Available Technicians</span>
          <span className="text-3xl font-extrabold text-gray-900 mt-1 mb-2">{loading ? '...' : technicianCount}</span>
          <span className="text-gray-500 text-xs">
            {technicianCount === 0 ? "No technicians available" : `${technicianCount} technicians available in your area`}
          </span>
        </div>
        {/* Pending Services Card */}
        <div className="bg-white rounded-2xl p-6 shadow-lg flex flex-col items-start border border-gray-200 transition-transform hover:scale-105 relative">
          <span className="absolute top-4 right-4">
            {/* Services Icon */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a4 4 0 014-4h4m0 0V7a4 4 0 00-4-4H7a4 4 0 00-4 4v10a4 4 0 004 4h4" /></svg>
          </span>
          <span className="text-gray-700 text-sm font-semibold mb-1">Pending Services</span>
          <span className="text-3xl font-extrabold text-gray-900 mt-1 mb-2">{loading ? '...' : todayServiceCount}</span>
          <span className="text-gray-500 text-xs">
            {todayServiceCount === 0 ? "No pending services" : `${todayServiceCount} pending services in your area`}
          </span>
        </div>
      </div>
      {error && <div className="text-red-500 mb-4">Error: {error}</div>}
      {/* Add more dashboard components here */}
    </div>
  );
};

export default Dashboard; 