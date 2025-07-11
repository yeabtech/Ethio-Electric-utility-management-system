'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Search, 
  Filter, 
  Calendar, 
  User, 
  FileText, 
  Download, 
  ChevronDown, 
  ChevronUp,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Loader2,
  Eye,
  FileImage,
  FileVideo,
  FileAudio,
  File
} from 'lucide-react'

interface Report {
  id: string
  status: string
  priority: string
  submittedAt: string
  template: {
    title: string
    category: string
  }
  technicianName: string
  customerName: string
  customerLocation: string
  data: Array<{
    fieldName: string
    fieldValue: string
  }>
  comments: Array<{
    id: string
    content: string
    createdAt: string
    authorName: string
  }>
  attachments: Array<{
    id: string
    name: string
    url: string
    type: string
  }>
  task?: {
    service: {
      serviceType: string
      category: string
    }
  }
}

export default function CSOReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedReports, setExpandedReports] = useState<Set<string>>(new Set())
  const [exporting, setExporting] = useState(false)
  
  // Filter states
  const [technicianFilter, setTechnicianFilter] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchReports()
  }, [technicianFilter, startDate, endDate])

  const fetchReports = async () => {
    setLoading(true)
    setError('')
    
    try {
      const params = new URLSearchParams()
      if (technicianFilter) params.append('technicianName', technicianFilter)
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)

      const response = await fetch(`/api/cso/reports?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch reports')
      
      const data = await response.json()
      setReports(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch reports')
    } finally {
      setLoading(false)
    }
  }

  const toggleReportExpansion = (reportId: string) => {
    const newExpanded = new Set(expandedReports)
    if (newExpanded.has(reportId)) {
      newExpanded.delete(reportId)
    } else {
      newExpanded.add(reportId)
    }
    setExpandedReports(newExpanded)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-blue-100 text-blue-800'
      case 'in_review':
        return 'bg-yellow-100 text-yellow-800'
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      case 'completed':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800'
      case 'high':
        return 'bg-orange-100 text-orange-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getAttachmentIcon = (type: string) => {
    if (type.startsWith('image/')) return <FileImage className="w-4 h-4" />
    if (type.startsWith('video/')) return <FileVideo className="w-4 h-4" />
    if (type.startsWith('audio/')) return <FileAudio className="w-4 h-4" />
    return <File className="w-4 h-4" />
  }

  const filteredReports = reports.filter(report => {
    if (!searchTerm) return true
    
    const searchLower = searchTerm.toLowerCase()
    return (
      report.technicianName.toLowerCase().includes(searchLower) ||
      report.customerName.toLowerCase().includes(searchLower) ||
      report.template.title.toLowerCase().includes(searchLower) ||
      report.task?.service.serviceType.toLowerCase().includes(searchLower)
    )
  })

  const clearFilters = () => {
    setTechnicianFilter('')
    setStartDate('')
    setEndDate('')
    setSearchTerm('')
  }

  const handleExport = async () => {
    setExporting(true)
    setError('')
    
    try {
      const params = new URLSearchParams()
      if (technicianFilter) params.append('technicianName', technicianFilter)
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)

      const response = await fetch(`/api/cso/reports/export?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to export reports')
      }

      // Create blob and download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `technician-reports-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export reports')
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading reports...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Technician Reports</h1>
            <p className="text-gray-600">View and manage all technician reports</p>
          </div>
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Export Reports
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Technician Filter */}
            <div>
              <Input
                placeholder="Technician name"
                value={technicianFilter}
                onChange={(e) => setTechnicianFilter(e.target.value)}
              />
            </div>

            {/* Start Date */}
            <div>
              <Input
                type="date"
                placeholder="Start date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            {/* End Date */}
            <div>
              <Input
                type="date"
                placeholder="End date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Clear Filters */}
          <div className="mt-4 flex justify-end">
            <Button
              variant="outline"
              onClick={clearFilters}
              className="flex items-center gap-2"
            >
              <XCircle className="w-4 h-4" />
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reports List */}
      <div className="space-y-4">
        {filteredReports.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No reports found</h3>
                <p className="text-gray-600">Try adjusting your filters or search terms</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredReports.map((report) => (
            <Card key={report.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                {/* Report Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {report.template.title}
                      </h3>
                      <Badge className={getStatusColor(report.status)}>
                        {report.status.replace('_', ' ')}
                      </Badge>
                      <Badge className={getPriorityColor(report.priority)}>
                        {report.priority}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>{report.technicianName}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(report.submittedAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{new Date(report.submittedAt).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleReportExpansion(report.id)}
                    className="flex items-center gap-1"
                  >
                    {expandedReports.has(report.id) ? (
                      <>
                        <ChevronUp className="w-4 h-4" />
                        Hide Details
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        View Details
                      </>
                    )}
                  </Button>
                </div>

                {/* Expanded Details */}
                {expandedReports.has(report.id) && (
                  <div className="border-t pt-4 space-y-4">
                    {/* Customer Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Customer Information</h4>
                        <div className="space-y-1 text-sm">
                          <p><span className="font-medium">Name:</span> {report.customerName}</p>
                          <p className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>{report.customerLocation}</span>
                          </p>
                        </div>
                      </div>

                      {report.task && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Service Information</h4>
                          <div className="space-y-1 text-sm">
                            <p><span className="font-medium">Type:</span> {report.task.service.serviceType.replace('_', ' ')}</p>
                            <p><span className="font-medium">Category:</span> {report.task.service.category.replace('_', ' ')}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Report Data */}
                    {report.data.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Report Data</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {report.data.map((item, index) => (
                            <div key={index} className="bg-gray-50 p-3 rounded-lg">
                              <p className="font-medium text-sm text-gray-700 mb-1">
                                {item.fieldName.replace(/_/g, ' ')}
                              </p>
                              <p className="text-sm text-gray-600">{item.fieldValue}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                                         {/* Attachments */}
                     {report.attachments.length > 0 && (
                       <div>
                         <h4 className="font-medium text-gray-900 mb-2">Attachments</h4>
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                           {report.attachments.map((attachment) => (
                             <div
                               key={attachment.id}
                               className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg"
                             >
                               {getAttachmentIcon(attachment.type)}
                               <span className="text-sm text-gray-700 flex-1 truncate">
                                 {attachment.name}
                               </span>
                               <Button
                                 variant="ghost"
                                 size="sm"
                                 onClick={() => window.open(attachment.url, '_blank')}
                                 className="flex items-center gap-1"
                               >
                                 <Eye className="w-4 h-4" />
                                 View
                               </Button>
                             </div>
                           ))}
                         </div>
                       </div>
                     )}

                     {/* Comments */}
                     {report.comments.length > 0 && (
                       <div>
                         <h4 className="font-medium text-gray-900 mb-2">Comments</h4>
                         <div className="space-y-3">
                           {report.comments.map((comment) => (
                             <div
                               key={comment.id}
                               className="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500"
                             >
                               <div className="flex items-center justify-between mb-2">
                                 <span className="font-medium text-sm text-gray-900">
                                   {comment.authorName}
                                 </span>
                                 <span className="text-xs text-gray-500">
                                   {new Date(comment.createdAt).toLocaleDateString()} at{' '}
                                   {new Date(comment.createdAt).toLocaleTimeString()}
                                 </span>
                               </div>
                               <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                 {comment.content}
                               </p>
                             </div>
                           ))}
                         </div>
                       </div>
                     )}
                   </div>
                 )}
               </CardContent>
             </Card>
           ))
         )}
       </div>

      {/* Summary */}
      {filteredReports.length > 0 && (
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {filteredReports.length} of {reports.length} reports
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
