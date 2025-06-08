// src/app/manager/page.tsx
'use client'
import { useState, useEffect } from 'react'
import { UserButton } from '@clerk/nextjs'
import { useUser } from '@clerk/nextjs'

// Subcity and Woreda data
const LOCATION_DATA = [
  { name: 'Addis Ketema', woredas: Array.from({length: 14}, (_, i) => i + 1) },
  { name: 'Akaky Kaliti', woredas: Array.from({length: 13}, (_, i) => i + 1) },
  { name: 'Arada', woredas: Array.from({length: 10}, (_, i) => i + 1) },
  { name: 'Bole', woredas: Array.from({length: 15}, (_, i) => i + 1) },
  { name: 'Gullele', woredas: Array.from({length: 10}, (_, i) => i + 1) },
  { name: 'Kirkos', woredas: Array.from({length: 11}, (_, i) => i + 1) },
  { name: 'Kolfe Keranio', woredas: Array.from({length: 15}, (_, i) => i + 1) },
  { name: 'Lideta', woredas: Array.from({length: 10}, (_, i) => i + 1) },
  { name: 'Nifas Silk-Lafto', woredas: Array.from({length: 15}, (_, i) => i + 1) },
  { name: 'Yeka', woredas: Array.from({length: 13}, (_, i) => i + 1) },
  { name: 'Lemi Kura', woredas: Array.from({length: 14}, (_, i) => i + 1) }
]

interface Employee {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  employeeInfo: {
    subCity: string;
    woreda: string;
  } | null;
}

export default function ManagerPage() {
  const { user } = useUser()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    username: '',
    role: 'estimator',
    subCity: '',
    woreda: ''
  })
  const [message, setMessage] = useState('')
  const [availableWoredas, setAvailableWoredas] = useState<number[]>([])
  const [usernameError, setUsernameError] = useState('')
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  
  // Fetch employees data
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/employees')
        const data = await response.json()
        
        if (response.ok && data.success) {
          setEmployees(data.employees)
        } else {
          setError(data.error || 'Failed to fetch employees')
        }
      } catch (err) {
        setError('An error occurred while fetching employees')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchEmployees()
  }, [message]) // Refetch when message changes (after new registration)

  const handleSubCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedSubCity = e.target.value
    const selectedCityData = LOCATION_DATA.find(city => city.name === selectedSubCity)
    
    setFormData({
      ...formData,
      subCity: selectedSubCity,
      woreda: ''
    })
    
    setAvailableWoredas(selectedCityData?.woredas || [])
  }

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const username = e.target.value
    setFormData({...formData, username})
    
    if (username.length > 0 && username.length < 5) {
      setUsernameError('Username must be at least 5 characters long')
    } else {
      setUsernameError('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.username.length < 5) {
      setUsernameError('Username must be at least 5 characters long')
      return
    }
    
    try {
      setIsSubmitting(true)
      setMessage('')
      setShowSuccess(false)
      
      const response = await fetch('/api/manager-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()
      
      if (response.ok) {
        setMessage(`Employee registered successfully as ${formData.role}`)
        setShowSuccess(true)
        // Reset form
        setFormData({
          email: '',
          password: '',
          firstName: '',
          lastName: '',
          username: '',
          role: 'estimator',
          subCity: '',
          woreda: ''
        })
        
        // Hide success icon after 3 seconds
        setTimeout(() => {
          setShowSuccess(false)
        }, 3000)
      } else {
        setMessage(data.error || 'Failed to register employee')
      }
    } catch (error) {
      setMessage('An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Get role badge color
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'estimator':
        return 'bg-blue-100 text-blue-800'
      case 'cso':
        return 'bg-green-100 text-green-800'
      case 'technician':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 p-4">
      <div className="flex justify-between items-center mb-6 px-4">
        <h1 className="text-2xl font-bold text-black">Manager Dashboard</h1>
        <UserButton afterSignOutUrl="/" />
      </div>
      
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Registration Form */}
        <div className="lg:w-1/2 bg-white rounded-lg shadow-md p-8">
          <h2 className="text-xl font-semibold mb-4 text-black">Register New Employee</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-black mb-1">First Name</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  className="w-full p-2 border rounded-lg text-black bg-white"
                  required
                />
              </div>
              <div>
                <label className="block text-black mb-1">Last Name</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  className="w-full p-2 border rounded-lg text-black bg-white"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-black mb-1">Username</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={handleUsernameChange}
                  className={`w-full p-2 border rounded-lg text-black bg-white ${usernameError ? 'border-red-500' : ''}`}
                  required
                />
                {usernameError && (
                  <p className="text-red-500 text-sm mt-1">{usernameError}</p>
                )}
              </div>
              <div>
                <label className="block text-black mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full p-2 border rounded-lg text-black bg-white"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-black mb-1">Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full p-2 border rounded-lg text-black bg-white"
                  required
                  minLength={8}
                />
              </div>
              <div>
                <label className="block text-black mb-1">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full p-2 border rounded-lg text-black bg-white"
                >
                  <option value="estimator">Estimator</option>
                  <option value="cso">Customer Service Operator (CSO)</option>
                  <option value="technician">Technician</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-black mb-1">Sub-city</label>
                <select
                  value={formData.subCity}
                  onChange={handleSubCityChange}
                  className="w-full p-2 border rounded-lg text-black bg-white"
                  required
                >
                  <option value="">Select Sub-city</option>
                  {LOCATION_DATA.map((city) => (
                    <option key={city.name} value={city.name}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-black mb-1">Woreda</label>
                <select
                  value={formData.woreda}
                  onChange={(e) => setFormData({...formData, woreda: e.target.value})}
                  className="w-full p-2 border rounded-lg text-black bg-white"
                  required
                  disabled={!formData.subCity}
                >
                  <option value="">Select Woreda</option>
                  {availableWoredas.map((woreda) => (
                    <option key={woreda} value={woreda}>
                      {woreda}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition mt-4 flex justify-center items-center"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                'Register Employee'
              )}
            </button>
          </form>

          {showSuccess && (
            <div className="mt-4 p-3 rounded-lg bg-green-100 text-green-800 flex items-center">
              <svg className="h-6 w-6 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              {message}
            </div>
          )}
          
          {!showSuccess && message && (
            <div className={`mt-4 p-3 rounded-lg ${
              message.includes('success') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {message}
            </div>
          )}
        </div>
        
        {/* Employees List */}
        <div className="lg:w-1/2 bg-white rounded-lg shadow-md p-8">
          <h2 className="text-xl font-semibold mb-4 text-black">Employees</h2>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="bg-red-100 text-red-800 p-3 rounded-lg">
              {error}
            </div>
          ) : employees.length === 0 ? (
            <div className="bg-gray-100 p-4 rounded-lg text-center">
              No employees found
            </div>
          ) : (
            <div className="overflow-y-auto max-h-[600px]">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date Added
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {employees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-gray-50">
                      <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {employee.email}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(employee.role)}`}>
                          {employee.role}
                        </span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                        {employee.employeeInfo ? 
                          `${employee.employeeInfo.subCity}, Woreda ${employee.employeeInfo.woreda}` : 
                          'Not assigned'}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(employee.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}