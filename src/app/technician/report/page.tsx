'use client'
import { useState, useEffect, useRef } from 'react'
import { useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Loader2, 
  FileText, 
  Calendar, 
  User, 
  MapPin, 
  Wrench,
  Upload,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react'
import SignaturePad from 'react-signature-canvas'
import { useUploadThing } from '@/lib/uploadthing'

type Task = {
  id: string
  status: 'assigned' | 'in_progress' | 'completed' | 'cancelled'
  scheduledAt: string
  completedAt?: string
  service?: {
    serviceType: string
    metadata: any
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
  report?: {
    id: string
    status: string
    data: Array<{
      fieldName: string
      fieldValue: string
    }>
    attachments: Array<{
      id: string
      name: string
      url: string
      type: string
    }>
    template: {
      title: string
      fields: any
    }
  }
  customerName: string
}

type ReportTemplate = {
  id: string
  title: string
  description?: string
  fields: any
}

export default function TechnicianReportPage() {
  const { user } = useUser()
  const [tasks, setTasks] = useState<Task[]>([])
  const [templates, setTemplates] = useState<ReportTemplate[]>([])
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null)
  const [reportData, setReportData] = useState<{[key: string]: string}>({})
  const [attachments, setAttachments] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const signaturePadRefs = useRef<{ [key: string]: SignaturePad | null }>({})
  const { startUpload: startSignatureUpload, isUploading: isSignatureUploading } = useUploadThing('serviceDocuments')
  const { startUpload: startAttachmentUpload, isUploading: isAttachmentUploading } = useUploadThing('serviceDocuments')
  const [signatureUploadError, setSignatureUploadError] = useState('')
  const [isSubmittingSignature, setIsSubmittingSignature] = useState(false)
  const [isSubmittingAttachments, setIsSubmittingAttachments] = useState(false)
  const [attachmentUploadError, setAttachmentUploadError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch tasks
        const tasksResponse = await fetch(`/api/technician/tasks/${user?.id}`)
        const tasksData = await tasksResponse.json()
        setTasks(tasksData)

        // Fetch report templates
        const templatesResponse = await fetch('/api/report/templates/task-report')
        const templatesData = await templatesResponse.json()
        setTemplates(templatesData)
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err)
        setError(message)
      }
    }

    if (user) fetchData()
  }, [user])

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    setSelectedTemplate(template || null)
    setReportData({})
  }

  const handleReportDataChange = (fieldName: string, value: string) => {
    setReportData(prev => ({
      ...prev,
      [fieldName]: value
    }))
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setAttachments(prev => [...prev, ...files])
  }

  const handleClearSignature = (fieldName: string) => {
    const pad = signaturePadRefs.current[fieldName]
    if (pad) {
      pad.clear()
      handleReportDataChange(fieldName, '')
    }
  }

  const handleEndSignature = (fieldName: string) => {
    const pad = signaturePadRefs.current[fieldName]
    if (pad && !pad.isEmpty()) {
      const dataUrl = pad.getTrimmedCanvas().toDataURL('image/png')
      handleReportDataChange(fieldName, dataUrl)
    }
  }

  const handleSubmitReport = async () => {
    if (!selectedTask || !selectedTemplate || !user) {
      setError('Please select a task and template')
      return
    }

    setSubmitting(true)
    setIsSubmittingSignature(true)
    setIsSubmittingAttachments(true)
    try {
      // Convert report data to the format expected by the API
      const updatedReportData: {[key: string]: string} = { ...reportData }
      // Check for signature fields that are data URLs and upload them
      for (const field of selectedTemplate.fields || []) {
        if (field.type === 'signature' && updatedReportData[field.name] && updatedReportData[field.name].startsWith('data:image/')) {
          try {
            const res = await fetch(updatedReportData[field.name])
            const blob = await res.blob()
            const file = new File([blob], 'signature.png', { type: 'image/png' })
            const uploadResult = await startSignatureUpload([file])
            if (uploadResult && uploadResult[0]?.url) {
              updatedReportData[field.name] = uploadResult[0].url
            } else {
              throw new Error('Failed to upload signature')
            }
          } catch (err) {
            setSignatureUploadError('Failed to upload signature')
            setSubmitting(false)
            setIsSubmittingSignature(false)
            setIsSubmittingAttachments(false)
            return
          }
        }
      }
      const reportDataArray = Object.entries(updatedReportData).map(([fieldName, fieldValue]) => ({
        fieldName,
        fieldValue
      }))

      // Upload attachments to UploadThing
      let uploadedAttachments: Array<{ url: string, name: string, type: string, size: number }> = []
      if (attachments.length > 0) {
        setAttachmentUploadError('')
        try {
          const uploadResults = await startAttachmentUpload(attachments)
          if (uploadResults && uploadResults.length > 0) {
            uploadedAttachments = uploadResults.map((result, idx) => ({
              url: result.url,
              name: attachments[idx]?.name || 'attachment',
              type: attachments[idx]?.type || '',
              size: attachments[idx]?.size || 0
            }))
          } else {
            throw new Error('Failed to upload attachments')
          }
        } catch (err) {
          setAttachmentUploadError('Failed to upload attachments')
          setSubmitting(false)
          setIsSubmittingSignature(false)
          setIsSubmittingAttachments(false)
          return
        }
      }

      const response = await fetch(`/api/report/task/${selectedTask.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          submittedById: user.id,
          data: reportDataArray,
          attachments: uploadedAttachments
        })
      })

      if (!response.ok) throw new Error('Failed to submit report')

      setSuccess('Report submitted successfully!')
      setSelectedTask(null)
      setSelectedTemplate(null)
      setReportData({})
      setAttachments([])

      // Refresh tasks to get updated report data
      const tasksResponse = await fetch(`/api/technician/tasks/${user.id}`)
      const tasksData = await tasksResponse.json()
      setTasks(tasksData)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      setError(message)
    } finally {
      setSubmitting(false)
      setIsSubmittingSignature(false)
      setIsSubmittingAttachments(false)
    }
  }

  const renderField = (field: any) => {
    const { name, type, label, required, options, placeholder } = field

    switch (type) {
      case 'text':
        return (
          <div key={name} className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              {label} {required && <span className="text-red-500">*</span>}
            </label>
            <Input
              value={reportData[name] || ''}
              onChange={(e) => handleReportDataChange(name, e.target.value)}
              placeholder={placeholder || `Enter ${label.toLowerCase()}`}
              required={required}
            />
          </div>
        )
      case 'textarea':
        return (
          <div key={name} className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              {label} {required && <span className="text-red-500">*</span>}
            </label>
            <Textarea
              value={reportData[name] || ''}
              onChange={(e) => handleReportDataChange(name, e.target.value)}
              placeholder={placeholder || `Enter ${label.toLowerCase()}`}
              required={required}
              rows={4}
            />
          </div>
        )
      case 'select':
        return (
          <div key={name} className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              {label} {required && <span className="text-red-500">*</span>}
            </label>
            <Select
              value={reportData[name] || ''}
              onValueChange={(value) => handleReportDataChange(name, value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {options?.map((option: string) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )
      case 'date':
        return (
          <div key={name} className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              {label} {required && <span className="text-red-500">*</span>}
            </label>
            <Input
              type="date"
              value={reportData[name] || ''}
              onChange={(e) => handleReportDataChange(name, e.target.value)}
              required={required}
            />
          </div>
        )
      case 'file':
        return (
          <div key={name} className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              {label} {required && <span className="text-red-500">*</span>}
            </label>
            <Input
              type="file"
              multiple
              onChange={(e) => handleFileUpload(e)}
            />
          </div>
        )
      case 'signature':
        return (
          <div key={name} className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div className="border border-gray-300 rounded h-32 bg-gray-50 flex flex-col items-center justify-center">
              <SignaturePad
                ref={ref => { signaturePadRefs.current[name] = ref; }}
                penColor="black"
                canvasProps={{
                  width: 400,
                  height: 120,
                  className: 'bg-white rounded',
                  style: { border: '1px solid #d1d5db' }
                }}
                onEnd={() => handleEndSignature(name)}
              />
              <div className="flex space-x-2 mt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => handleClearSignature(name)}>
                  Clear
                </Button>
                {isSubmittingSignature && (
                  <span className="text-xs text-gray-500 ml-2">Uploading signature...</span>
                )}
              </div>
              {signatureUploadError && (
                <div className="text-xs text-red-500 mt-1">{signatureUploadError}</div>
              )}
            </div>
            {reportData[name] && (
              <div className="mt-2">
                <span className="text-xs text-gray-500">Signature Preview:</span>
                <img src={reportData[name]} alt="Signature preview" className="border mt-1 rounded h-16 bg-white" />
              </div>
            )}
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6 bg-white min-h-screen">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Task Reports</h1>
        <Badge variant="outline" className="text-sm bg-white border-gray-300 text-gray-700">
          {tasks.filter(t => t.status === 'completed').length} Completed Tasks
        </Badge>
      </div>

      {error && (
        <Alert variant="error">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert variant="success">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task List */}
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader className="bg-gray-50 border-b border-gray-200">
            <CardTitle className="flex items-center space-x-2 text-gray-900">
              <FileText className="h-5 w-5 text-gray-600" />
              <span>Completed Tasks</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 bg-white">
            {tasks.filter(t => t.status === 'completed')
              .sort((a, b) => {
                const dateA = new Date(a.completedAt || a.scheduledAt).getTime();
                const dateB = new Date(b.completedAt || b.scheduledAt).getTime();
                return dateB - dateA;
              })
              .map(task => (
                <div
                  key={task.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedTask?.id === task.id
                      ? 'border-gray-400 bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                  onClick={() => setSelectedTask(task)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">
                      {task.service?.serviceType || 'Service'}
                    </h3>
                    <Badge variant={task.report ? "default" : "outline"} className={task.report ? "bg-gray-600 text-white" : "bg-red-50 border-red-300 text-red-700"}>
                      {task.report ? 'Completed' : 'No Report'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{task.customerName}</p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(task.completedAt || task.scheduledAt).toLocaleDateString()}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <MapPin className="h-3 w-3" />
                      <span>{task.customer?.verification[0]?.subCity}</span>
                    </span>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>

        {/* Report Form */}
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader className="bg-gray-50 border-b border-gray-200">
            <CardTitle className="flex items-center space-x-2 text-gray-900">
              <FileText className="h-5 w-5 text-gray-600" />
              <span>Submit Report</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 bg-white">
            {selectedTask ? (
              <>
                {/* Task Details */}
                <div className="p-4 bg-gray-50 rounded-lg space-y-3 border border-gray-200">
                  <h3 className="font-semibold text-gray-900">Task Details</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Service:</span>
                      <p className="font-medium text-gray-900">{selectedTask.service?.serviceType}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Customer:</span>
                      <p className="font-medium text-gray-900">{selectedTask.customerName}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Location:</span>
                      <p className="font-medium text-gray-900">
                        {selectedTask.customer?.verification[0]?.subCity}, {selectedTask.customer?.verification[0]?.woreda}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Completed:</span>
                      <p className="font-medium text-gray-900">
                        {selectedTask.completedAt 
                          ? new Date(selectedTask.completedAt).toLocaleDateString()
                          : 'Not completed'
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* Template Selection & Report Form */}
                {selectedTask.report ? (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-400" />
                    <p>This task already has a report submitted.</p>
                  </div>
                ) : (
                  <>
                    {/* Template Selection */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Report Template
                      </label>
                      <Select onValueChange={handleTemplateSelect}>
                        <SelectTrigger className="bg-white border-gray-300">
                          <SelectValue placeholder="Select a report template" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-gray-200">
                          {templates.map(template => (
                            <SelectItem key={template.id} value={template.id} className="text-gray-900">
                              {template.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Report Form Fields */}
                    {selectedTemplate && (
                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-900">{selectedTemplate.title}</h4>
                        {selectedTemplate.description && (
                          <p className="text-sm text-gray-600">{selectedTemplate.description}</p>
                        )}
                        <div className="space-y-4">
                          {selectedTemplate.fields?.map((field: any) => renderField(field))}
                        </div>
                        {/* File Upload */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">
                            Attachments
                          </label>
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
                            <input
                              type="file"
                              multiple
                              onChange={handleFileUpload}
                              className="hidden"
                              id="file-upload"
                            />
                            <label
                              htmlFor="file-upload"
                              className="flex flex-col items-center space-y-2 cursor-pointer"
                            >
                              <Upload className="h-6 w-6 text-gray-400" />
                              <span className="text-sm text-gray-600">
                                Click to upload files
                              </span>
                            </label>
                          </div>
                          {attachments.length > 0 && (
                            <div className="space-y-2">
                              {attachments.map((file, index) => (
                                <div key={index} className="flex items-center space-x-2 text-sm">
                                  <FileText className="h-4 w-4 text-gray-400" />
                                  <span className="text-gray-700">{file.name}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <Button
                          onClick={handleSubmitReport}
                          disabled={submitting}
                          className="w-full bg-gray-600 hover:bg-gray-700 text-white"
                        >
                          {submitting ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              Submitting...
                            </>
                          ) : (
                            'Submit Report'
                          )}
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Select a completed task to submit a report</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
