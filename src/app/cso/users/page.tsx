'use client';

import { useEffect, useState } from 'react';

interface CustomerVerification {
  id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  mobileNumber: string;
  idType: string;
  idNumber: string;
  region: string;
  subCity: string;
  woreda: string;
  kebele: string;
  homeNumber: string;
  nationality: string;
  status: string;
  createdAt: string;
  user: {
    id: string;
    email: string;
    role: string;
    isVerified: boolean;
    employeeInfo: {
      subCity: string;
      woreda: string;
    } | null;
  };
}

interface ApiResponse {
  customers: CustomerVerification[];
  csoLocation: {
    subCity: string;
    woreda: string;
  };
}

export default function UsersPage() {
  const [customers, setCustomers] = useState<CustomerVerification[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<CustomerVerification[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [csoLocation, setCsoLocation] = useState<{ subCity: string; woreda: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch('/api/users');
        if (!response.ok) {
          throw new Error('Failed to fetch customers');
        }
        const data: ApiResponse = await response.json();
        setCustomers(data.customers);
        setFilteredCustomers(data.customers);
        setCsoLocation(data.csoLocation);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  useEffect(() => {
    const filtered = customers.filter(customer => {
      const fullName = `${customer.firstName} ${customer.middleName || ''} ${customer.lastName}`.toLowerCase();
      const phone = customer.mobileNumber.toLowerCase();
      const query = searchQuery.toLowerCase();
      
      return fullName.includes(query) || phone.includes(query);
    });
    setFilteredCustomers(filtered);
  }, [searchQuery, customers]);

  const getFullName = (customer: CustomerVerification) => {
    return `${customer.firstName} ${customer.middleName ? customer.middleName + ' ' : ''}${customer.lastName}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Approved Customers in Your Area</h1>
        {csoLocation && (
          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <p className="text-lg">
              <span className="font-semibold">Your Location:</span>{' '}
              {csoLocation.subCity} - {csoLocation.woreda}
            </p>
          </div>
        )}

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search by name or phone number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
          />
          <div className="absolute right-3 top-2.5 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID Number
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Address
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {getFullName(customer)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{customer.user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{customer.mobileNumber}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{customer.idType}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{customer.idNumber}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {`${customer.subCity}, ${customer.woreda}, ${customer.kebele}`}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Approved
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredCustomers.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500 text-lg">
            {searchQuery 
              ? 'No customers found matching your search.'
              : 'No approved customers found in your area.'}
          </p>
        </div>
      )}
    </div>
  );
}
