'use client'
import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { 
  Loader2, 
  CheckCircle2, 
  Search, 
  Wrench, 
  User, 
  MapPin, 
  Calendar, 
  Phone, 
  Mail, 
  FileText,
  Clock,
  DollarSign,
  Filter,
  Download
} from 'lucide-react'
import "@/app/globals.css"

type Task = {
  id: string
  status: 'assigned' | 'in_progress' | 'completed' | 'cancelled'
  scheduledAt: string
  startedAt?: string
  completedAt?: string
  service?: {
    serviceType: string
    metadata: {
      plotNumber?: string
      voltageLevel?: string
      estimatedCost: {
        tax: number
        total: number
        baseCost: number
        voltageRate: number
      }
      estimatedLoad: string
    }
  }
  customer?: {
    email?: string
    verification: Array<{
      firstName: string
      lastName: string
      subCity: string
      woreda: string
      kebele: string
      homeNumber: string
      mobileNumber: string
    }>
  }
  receipt: {
    grandTotal: number
  }
  report?: {
    id: string
    status: string
    data: Array<{
      fieldName: string
      fieldValue: string
    }>
  }
}

export default function CompletedTasksPage() {
  const { user } = useUser()
  const [tasks, setTasks] = useState<Task[]>([])
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await fetch(`/api/technician/tasks?clerkUserId=${user?.id}`)
        const data = await response.json()
        
        // Filter for completed tasks only
        const completedTasks = data.filter((task: Task) => task.status === 'completed')
        setTasks(completedTasks)
        setFilteredTasks(completedTasks)
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err)
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    if (user) fetchTasks()
  }, [user])

  // Filter tasks based on search term
  useEffect(() => {
    const filtered = tasks.filter(task => {
      const customerName = task.customer?.verification?.[0] 
        ? `${task.customer.verification[0].firstName} ${task.customer.verification[0].lastName}`
        : ''
      const serviceType = task.service?.serviceType || ''
      const location = task.customer?.verification?.[0] 
        ? `${task.customer.verification[0].subCity}, ${task.customer.verification[0].woreda}`
        : ''
      
      const searchLower = searchTerm.toLowerCase()
      return (
        customerName.toLowerCase().includes(searchLower) ||
        serviceType.toLowerCase().includes(searchLower) ||
        location.toLowerCase().includes(searchLower) ||
        task.id.toLowerCase().includes(searchLower)
      )
    })
    setFilteredTasks(filtered)
  }, [searchTerm, tasks])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getServiceTypeLabel = (serviceType: string) => {
    return serviceType.replace(/_/g, ' ').toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const exportToCSV = () => {
    const headers = ['Task ID', 'Customer Name', 'Service Type', 'Location', 'Scheduled Date', 'Completed Date', 'Amount']
    const csvData = filteredTasks.map(task => [
      task.id,
      task.customer?.verification?.[0] ? `${task.customer.verification[0].firstName} ${task.customer.verification[0].lastName}` : 'N/A',
      getServiceTypeLabel(task.service?.serviceType || ''),
      task.customer?.verification?.[0] ? `${task.customer.verification[0].subCity}, ${task.customer.verification[0].woreda}` : 'N/A',
      formatDate(task.scheduledAt),
      task.completedAt ? formatDate(task.completedAt) : 'N/A',
      `$${task.receipt.grandTotal.toFixed(2)}`
    ])

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `completed-tasks-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Completed Tasks</h1>
            <p className="text-gray-600">View and manage your completed service tasks</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button 
              onClick={exportToCSV}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Export CSV</span>
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="error">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Search and Filters */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black h-4 w-4" />
          <Input
            placeholder="Search by customer name, service type, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 !bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        {/* Tasks List */}
        <div className="space-y-4">
          {filteredTasks.length === 0 ? (
            <Card className="bg-white shadow-lg rounded-xl">
              <CardContent className="p-8 text-center">
                <CheckCircle2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm ? 'No tasks found' : 'No completed tasks yet'}
                </h3>
                <p className="text-gray-500">
                  {searchTerm 
                    ? 'Try adjusting your search terms' 
                    : 'Completed tasks will appear here once you finish your assignments'
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredTasks.map((task) => (
              <Card key={task.id} className="bg-white shadow-lg rounded-xl hover:shadow-xl transition-shadow duration-200">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                    {/* Task Info */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {task.customer?.verification?.[0] 
                              ? `${task.customer.verification[0].firstName} ${task.customer.verification[0].lastName}`
                              : 'Customer Name N/A'
                            }
                          </h3>
                          <p className="text-sm text-gray-500">Task ID: {task.id}</p>
                        </div>
                        <Badge className={getStatusColor(task.status)}>
                          {task.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="flex items-center space-x-2">
                          <Wrench className="h-4 w-4 text-blue-500" />
                          <span className="text-sm text-gray-600">
                            {getServiceTypeLabel(task.service?.serviceType || 'N/A')}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-gray-600">
                            {task.customer?.verification?.[0] 
                              ? `${task.customer.verification[0].subCity}, ${task.customer.verification[0].woreda}`
                              : 'Location N/A'
                            }
                          </span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-purple-500" />
                          <span className="text-sm text-gray-600">
                            Completed: {task.completedAt ? formatDate(task.completedAt) : 'N/A'}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <DollarSign className="h-4 w-4 text-green-500" />
                          <span className="text-sm font-medium text-gray-900">
                            ${task.receipt.grandTotal.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col space-y-2 lg:ml-6">
                      {task.report && (
                        <Button variant="outline" size="sm" className="flex items-center space-x-2">
                          <FileText className="h-4 w-4" />
                          <span>View Report</span>
                        </Button>
                      )}
                      <Button variant="outline" size="sm" className="flex items-center space-x-2">
                        <FileText className="h-4 w-4" />
                        <span>My Report</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Pagination Info */}
        {filteredTasks.length > 0 && (
          <div className="text-center text-sm text-gray-500">
            Showing {filteredTasks.length} of {tasks.length} completed tasks
          </div>
        )}
      </div>
    </div>
  )
}
