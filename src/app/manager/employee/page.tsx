'use client';

import { useState, useEffect } from 'react';
import { Trash2, Search } from 'lucide-react';

interface Employee {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
  employeeInfo: {
    subCity: string;
    woreda: string;
  } | null;
}

export default function EmployeePage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteStatus, setDeleteStatus] = useState<{ [key: string]: boolean }>({});

  // Fetch employees data
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/employees');
        const data = await response.json();
        
        if (response.ok && data.success) {
          setEmployees(data.employees);
          setFilteredEmployees(data.employees);
        } else {
          setError(data.error || 'Failed to fetch employees');
        }
      } catch (err) {
        setError('An error occurred while fetching employees');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEmployees();
  }, []);

  // Filter employees when search query changes
  useEffect(() => {
    const filtered = employees.filter(employee =>
      employee.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredEmployees(filtered);
  }, [searchQuery, employees]);

  const handleDelete = async (employeeId: string) => {
    if (!confirm('Are you sure you want to delete this employee?')) {
      return;
    }

    try {
      setDeleteStatus(prev => ({ ...prev, [employeeId]: true }));
      
      const response = await fetch(`/api/employees/${employeeId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setEmployees(prev => prev.filter(emp => emp.id !== employeeId));
      } else {
        setError(data.error || 'Failed to delete employee');
      }
    } catch (err) {
      setError('An error occurred while deleting the employee');
    } finally {
      setDeleteStatus(prev => ({ ...prev, [employeeId]: false }));
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get role badge color
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'estimator':
        return 'bg-blue-100 text-blue-800';
      case 'cso':
        return 'bg-green-100 text-green-800';
      case 'technician':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-semibold mb-6 text-black">Employee Management</h2>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-600" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-600 focus:outline-none focus:placeholder-gray-600 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black"
            placeholder="Search by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 text-red-800 p-3 rounded-lg">
          {error}
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="bg-gray-100 p-4 rounded-lg text-center text-black">
          {searchQuery ? 'No employees found matching your search' : 'No employees found'}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                  Role
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                  Location
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                  Date Added
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEmployees.map((employee) => (
                <tr key={employee.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-black">
                    {employee.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-black">
                    {employee.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(employee.role)}`}>
                      {employee.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                    {employee.employeeInfo ? 
                      `${employee.employeeInfo.subCity}, Woreda ${employee.employeeInfo.woreda}` : 
                      'Not assigned'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                    {formatDate(employee.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                    <button
                      onClick={() => handleDelete(employee.id)}
                      disabled={deleteStatus[employee.id]}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deleteStatus[employee.id] ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
                      ) : (
                        <Trash2 className="h-5 w-5" />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
