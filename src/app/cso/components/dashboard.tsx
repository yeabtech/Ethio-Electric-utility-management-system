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

const Dashboard = () => {
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
        <button className="relative p-2 rounded-full bg-indigo-500 hover:bg-indigo-600 transition-colors">
          <Bell className="w-6 h-6 text-white" />
          {/* Optionally, add a red dot for unread notifications */}
          {/* <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span> */}
        </button>
      </div>
      <h2 className="text-2xl font-bold mb-4">Dashboard Overview</h2>
      <p className="mb-6">Welcome to your Customer Service Operator dashboard</p>
      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div
          className="bg-gradient-to-r from-indigo-500 to-purple-400 rounded-xl p-6 shadow flex flex-col items-center"
        >
          <span className="text-4xl mb-2 text-white">👥</span>
          <span className="text-4xl font-bold text-white mt-2">{loading ? '...' : userCount}</span>
          <span className="mt-2 text-lg font-semibold text-white">Users in Area</span>
        </div>
        <div
          className="bg-gradient-to-r from-orange-400 to-yellow-400 rounded-xl p-6 shadow flex flex-col items-center"
        >
          <span className="text-4xl mb-2 text-white">🧑‍🔧</span>
          <span className="text-4xl font-bold text-white mt-2">{loading ? '...' : technicianCount}</span>
          <span className="mt-2 text-lg font-semibold text-white">Available Technicians</span>
        </div>
        <div
          className="bg-gradient-to-r from-cyan-400 to-blue-400 rounded-xl p-6 shadow flex flex-col items-center"
        >
          <span className="text-4xl mb-2 text-white">📝</span>
          <span className="text-4xl font-bold text-white mt-2">{loading ? '...' : todayServiceCount}</span>
          <span className="mt-2 text-lg font-semibold text-white">Pending Services</span>
        </div>
      </div>
      {error && <div className="text-red-500 mb-4">Error: {error}</div>}
      {/* Add more dashboard components here */}
    </div>
  );
};

export default Dashboard; 