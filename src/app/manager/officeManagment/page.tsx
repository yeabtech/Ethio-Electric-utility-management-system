'use client'
import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Plus, 
  Trash2, 
  Eye, 
  Edit, 
  Save, 
  X, 
  FileText, 
  Settings,
  Copy,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

type FieldType = 'text' | 'textarea' | 'select' | 'number' | 'date' | 'email' | 'phone' | 'signature' | 'file' | 'checkbox' | 'radio' | 'time' | 'datetime' | 'url' | 'password'

interface FormField {
  name: string
  type: FieldType
  label: string
  required: boolean
  placeholder?: string
  options?: string[]
  validation?: {
    min?: number
    max?: number
    pattern?: string
  }
}

interface ReportTemplate {
  id: string
  title: string
  description?: string
  category: string
  fields: FormField[]
  createdBy: string
  createdAt: string
  updatedAt: string
  creator?: {
    email: string
  }
}

const fieldTypes: { value: FieldType; label: string; icon: string }[] = [
  { value: 'text', label: 'Text Input', icon: '📝' },
  { value: 'textarea', label: 'Text Area', icon: '📄' },
  { value: 'select', label: 'Dropdown', icon: '📋' },
  { value: 'number', label: 'Number', icon: '🔢' },
  { value: 'date', label: 'Date', icon: '📅' },
  { value: 'time', label: 'Time', icon: '⏰' },
  { value: 'datetime', label: 'Date & Time', icon: '📅⏰' },
  { value: 'email', label: 'Email', icon: '📧' },
  { value: 'phone', label: 'Phone', icon: '📞' },
  { value: 'url', label: 'URL', icon: '🔗' },
  { value: 'password', label: 'Password', icon: '🔒' },
  { value: 'checkbox', label: 'Checkbox', icon: '☑️' },
  { value: 'radio', label: 'Radio Buttons', icon: '🔘' },
  { value: 'file', label: 'File Upload', icon: '📎' },
  { value: 'signature', label: 'Signature', icon: '✍️' }
]

const reportCategories = [
  { value: 'daily', label: 'Daily Reports' },
  { value: 'project', label: 'Project Reports' },
  { value: 'technical', label: 'Technical Reports' },
  { value: 'customer', label: 'Customer Reports' },
  { value: 'financial', label: 'Financial Reports' },
  { value: 'inventory', label: 'Inventory Reports' },
  { value: 'hr', label: 'HR Reports' },
  { value: 'other', label: 'Other Reports' }
]

export default function OfficeManagementPage() {
  const { user } = useUser()
  const [templates, setTemplates] = useState<ReportTemplate[]>([])
  const [currentTemplate, setCurrentTemplate] = useState<Partial<ReportTemplate>>({
    title: '',
    description: '',
    category: 'technical',
    fields: []
  })
  const [isCreating, setIsCreating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [previewMode, setPreviewMode] = useState(false)
  const [previewData, setPreviewData] = useState<{[key: string]: string}>({})

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/report/templates')
      if (response.ok) {
        const data = await response.json()
        setTemplates(data)
      }
    } catch (err) {
      setError('Failed to fetch templates')
    } finally {
      setLoading(false)
    }
  }

  // Helper to get internal user ID from Clerk user ID
  const getInternalUserId = async (clerkUserId: string) => {
    const res = await fetch(`/api/users?clerkUserId=${clerkUserId}`)
    if (!res.ok) return undefined
    const data = await res.json()
    return data?.id
  }

  const handleCreateNew = () => {
    setCurrentTemplate({
      title: '',
      description: '',
      category: 'technical',
      fields: []
    })
    setIsCreating(true)
    setIsEditing(false)
    setError('')
    setSuccess('')
  }

  const handleEditTemplate = (template: ReportTemplate) => {
    setCurrentTemplate(template)
    setIsEditing(true)
    setIsCreating(false)
    setError('')
    setSuccess('')
  }

  const handleCancel = () => {
    setIsCreating(false)
    setIsEditing(false)
    setCurrentTemplate({
      title: '',
      description: '',
      category: 'technical',
      fields: []
    })
    setError('')
    setSuccess('')
  }

  const addField = () => {
    const newField: FormField = {
      name: `field_${Date.now()}`,
      type: 'text',
      label: 'New Field',
      required: false
    }
    setCurrentTemplate(prev => ({
      ...prev,
      fields: [...(prev.fields || []), newField]
    }))
  }

  const updateField = (index: number, field: Partial<FormField>) => {
    setCurrentTemplate(prev => ({
      ...prev,
      fields: prev.fields?.map((f, i) => i === index ? { ...f, ...field } : f) || []
    }))
  }

  const removeField = (index: number) => {
    setCurrentTemplate(prev => ({
      ...prev,
      fields: prev.fields?.filter((_, i) => i !== index) || []
    }))
  }

  const addOption = (fieldIndex: number) => {
    setCurrentTemplate(prev => ({
      ...prev,
      fields: prev.fields?.map((f, i) => 
        i === fieldIndex 
          ? { ...f, options: [...(f.options || []), 'New Option'] }
          : f
      ) || []
    }))
  }

  const updateOption = (fieldIndex: number, optionIndex: number, value: string) => {
    setCurrentTemplate(prev => ({
      ...prev,
      fields: prev.fields?.map((f, i) => 
        i === fieldIndex 
          ? { 
              ...f, 
              options: f.options?.map((opt, j) => j === optionIndex ? value : opt) 
            }
          : f
      ) || []
    }))
  }

  const removeOption = (fieldIndex: number, optionIndex: number) => {
    setCurrentTemplate(prev => ({
      ...prev,
      fields: prev.fields?.map((f, i) => 
        i === fieldIndex 
          ? { 
              ...f, 
              options: f.options?.filter((_, j) => j !== optionIndex) 
            }
          : f
      ) || []
    }))
  }

  const handleSave = async () => {
    if (!currentTemplate.title?.trim()) {
      setError('Template title is required')
      return
    }

    if (!currentTemplate.fields?.length) {
      setError('At least one field is required')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/report/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: currentTemplate.title,
          description: currentTemplate.description,
          category: currentTemplate.category,
          fields: currentTemplate.fields
        })
      })

      if (response.ok) {
        setSuccess('Template saved successfully!')
        await fetchTemplates()
        handleCancel()
      } else {
        throw new Error('Failed to save template')
      }
    } catch (err) {
      setError('Failed to save template')
    } finally {
      setSaving(false)
    }
  }

  const handlePreview = () => {
    if (!currentTemplate.title?.trim() || !currentTemplate.fields?.length) return;
    setPreviewMode(true)
    setPreviewData({})
  }

  const handlePreviewDataChange = (fieldName: string, value: string) => {
    setPreviewData(prev => ({
      ...prev,
      [fieldName]: value
    }))
  }

  // Simulate signature capture for preview
  const handleSignaturePreview = (fieldName: string) => {
    setPreviewData(prev => ({
      ...prev,
      [fieldName]: prev[fieldName] ? '' : 'signed'
    }))
  }

  const createWorkplaceTemplate = (templateType: string) => {
    let template: Partial<ReportTemplate> = {
      title: '',
      description: '',
      category: 'technical',
      fields: []
    }

    switch (templateType) {
      case 'work_order':
        template = {
          title: 'Work Order Completion Report',
          description: 'Standard work order completion report for technicians',
          category: 'technical',
          fields: [
            { name: 'work_order_number', type: 'text', label: 'Work Order Number', required: true, placeholder: 'WO-2024-001' },
            { name: 'completion_date', type: 'date', label: 'Completion Date', required: true },
            { name: 'work_summary', type: 'textarea', label: 'Work Summary', required: true, placeholder: 'Describe the work completed' },
            { name: 'materials_used', type: 'textarea', label: 'Materials Used', required: false, placeholder: 'List all materials and quantities' },
            { name: 'issues_encountered', type: 'textarea', label: 'Issues Encountered', required: false, placeholder: 'Describe any problems or challenges' },
            { name: 'completion_status', type: 'select', label: 'Completion Status', required: true, options: ['Fully Completed', 'Partially Completed', 'Requires Follow-up'] },
            { name: 'technician_signature', type: 'signature', label: 'Technician Signature', required: true },
            { name: 'photos', type: 'file', label: 'Work Photos', required: false }
          ]
        }
        break
      case 'safety_inspection':
        template = {
          title: 'Safety Inspection Report',
          description: 'Safety inspection checklist for workplace compliance',
          category: 'technical',
          fields: [
            { name: 'inspection_date', type: 'date', label: 'Inspection Date', required: true },
            { name: 'inspector_name', type: 'text', label: 'Inspector Name', required: true },
            { name: 'location', type: 'text', label: 'Inspection Location', required: true },
            { name: 'ppe_compliance', type: 'radio', label: 'PPE Compliance', required: true, options: ['Compliant', 'Non-Compliant', 'Partial'] },
            { name: 'safety_equipment', type: 'checkbox', label: 'Safety Equipment Checked', required: false },
            { name: 'hazards_found', type: 'textarea', label: 'Hazards Found', required: false, placeholder: 'Describe any safety hazards' },
            { name: 'corrective_actions', type: 'textarea', label: 'Corrective Actions Taken', required: false },
            { name: 'next_inspection_date', type: 'date', label: 'Next Inspection Date', required: true },
            { name: 'inspector_signature', type: 'signature', label: 'Inspector Signature', required: true }
          ]
        }
        break
      case 'incident_report':
        template = {
          title: 'Incident Report',
          description: 'Workplace incident reporting form',
          category: 'hr',
          fields: [
            { name: 'incident_date', type: 'datetime', label: 'Incident Date & Time', required: true },
            { name: 'reporter_name', type: 'text', label: 'Reporter Name', required: true },
            { name: 'incident_location', type: 'text', label: 'Incident Location', required: true },
            { name: 'incident_type', type: 'select', label: 'Incident Type', required: true, options: ['Injury', 'Property Damage', 'Near Miss', 'Security Breach', 'Other'] },
            { name: 'severity', type: 'select', label: 'Severity Level', required: true, options: ['Low', 'Medium', 'High', 'Critical'] },
            { name: 'incident_description', type: 'textarea', label: 'Incident Description', required: true, placeholder: 'Provide detailed description of what happened' },
            { name: 'witnesses', type: 'textarea', label: 'Witnesses', required: false, placeholder: 'List any witnesses' },
            { name: 'immediate_actions', type: 'textarea', label: 'Immediate Actions Taken', required: true },
            { name: 'preventive_measures', type: 'textarea', label: 'Preventive Measures', required: false },
            { name: 'photos_evidence', type: 'file', label: 'Photos/Evidence', required: false },
            { name: 'reporter_signature', type: 'signature', label: 'Reporter Signature', required: true }
          ]
        }
        break
      case 'equipment_maintenance':
        template = {
          title: 'Equipment Maintenance Report',
          description: 'Equipment maintenance and service record',
          category: 'technical',
          fields: [
            { name: 'equipment_id', type: 'text', label: 'Equipment ID', required: true },
            { name: 'equipment_name', type: 'text', label: 'Equipment Name', required: true },
            { name: 'maintenance_date', type: 'date', label: 'Maintenance Date', required: true },
            { name: 'maintenance_type', type: 'select', label: 'Maintenance Type', required: true, options: ['Preventive', 'Corrective', 'Emergency', 'Routine'] },
            { name: 'technician_name', type: 'text', label: 'Technician Name', required: true },
            { name: 'work_performed', type: 'textarea', label: 'Work Performed', required: true },
            { name: 'parts_replaced', type: 'textarea', label: 'Parts Replaced', required: false },
            { name: 'next_maintenance', type: 'date', label: 'Next Maintenance Date', required: true },
            { name: 'equipment_condition', type: 'select', label: 'Equipment Condition', required: true, options: ['Excellent', 'Good', 'Fair', 'Poor', 'Critical'] },
            { name: 'technician_signature', type: 'signature', label: 'Technician Signature', required: true }
          ]
        }
        break
      case 'daily_log':
        template = {
          title: 'Daily Work Log',
          description: 'Daily activity and progress report',
          category: 'daily',
          fields: [
            { name: 'log_date', type: 'date', label: 'Date', required: true },
            { name: 'employee_name', type: 'text', label: 'Employee Name', required: true },
            { name: 'shift_start', type: 'time', label: 'Shift Start Time', required: true },
            { name: 'shift_end', type: 'time', label: 'Shift End Time', required: true },
            { name: 'tasks_completed', type: 'textarea', label: 'Tasks Completed', required: true },
            { name: 'ongoing_projects', type: 'textarea', label: 'Ongoing Projects', required: false },
            { name: 'challenges', type: 'textarea', label: 'Challenges Faced', required: false },
            { name: 'tomorrow_plans', type: 'textarea', label: 'Plans for Tomorrow', required: false },
            { name: 'employee_signature', type: 'signature', label: 'Employee Signature', required: true }
          ]
        }
        break
    }

    setCurrentTemplate(template)
    setIsCreating(true)
    setIsEditing(false)
    setError('')
    setSuccess('')
  }

  const renderPreviewField = (field: FormField) => {
    const { name, type, label, required, placeholder, options } = field

    switch (type) {
      case 'text':
      case 'email':
      case 'phone':
      case 'url':
      case 'password':
        return (
          <div key={name} className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              {label} {required && <span className="text-red-500">*</span>}
            </label>
            <Input
              type={type === 'password' ? 'password' : type}
              value={previewData[name] || ''}
              onChange={(e) => handlePreviewDataChange(name, e.target.value)}
              placeholder={placeholder}
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
              value={previewData[name] || ''}
              onChange={(e) => handlePreviewDataChange(name, e.target.value)}
              placeholder={placeholder}
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
            <Select onValueChange={(value) => handlePreviewDataChange(name, value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                {options?.map((option, index) => (
                  <SelectItem key={index} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )
      case 'number':
        return (
          <div key={name} className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              {label} {required && <span className="text-red-500">*</span>}
            </label>
            <Input
              type="number"
              value={previewData[name] || ''}
              onChange={(e) => handlePreviewDataChange(name, e.target.value)}
              placeholder={placeholder}
              required={required}
            />
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
              value={previewData[name] || ''}
              onChange={(e) => handlePreviewDataChange(name, e.target.value)}
              required={required}
            />
          </div>
        )
      case 'time':
        return (
          <div key={name} className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              {label} {required && <span className="text-red-500">*</span>}
            </label>
            <Input
              type="time"
              value={previewData[name] || ''}
              onChange={(e) => handlePreviewDataChange(name, e.target.value)}
              required={required}
            />
          </div>
        )
      case 'datetime':
        return (
          <div key={name} className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              {label} {required && <span className="text-red-500">*</span>}
            </label>
            <Input
              type="datetime-local"
              value={previewData[name] || ''}
              onChange={(e) => handlePreviewDataChange(name, e.target.value)}
              required={required}
            />
          </div>
        )
      case 'checkbox':
        return (
          <div key={name} className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={name}
                checked={previewData[name] === 'true'}
                onChange={(e) => handlePreviewDataChange(name, e.target.checked ? 'true' : 'false')}
                required={required}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor={name} className="text-sm font-medium text-gray-700">
                {label} {required && <span className="text-red-500">*</span>}
              </label>
            </div>
          </div>
        )
      case 'radio':
        return (
          <div key={name} className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div className="space-y-2">
              {options?.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id={`${name}_${index}`}
                    name={name}
                    value={option}
                    checked={previewData[name] === option}
                    onChange={(e) => handlePreviewDataChange(name, e.target.value)}
                    required={required}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <label htmlFor={`${name}_${index}`} className="text-sm text-gray-700">
                    {option}
                  </label>
                </div>
              ))}
            </div>
          </div>
        )
      case 'file':
        return (
          <div key={name} className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
              <input
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    handlePreviewDataChange(name, file.name)
                  }
                }}
                required={required}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                {placeholder || 'Click to upload or drag and drop'}
              </p>
            </div>
          </div>
        )
      case 'signature':
        return (
          <div key={name} className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50 min-h-[120px] flex items-center justify-center cursor-pointer hover:bg-blue-50 transition"
              onClick={() => handleSignaturePreview(name)}
              title="Click to simulate signature capture"
            >
              <div className="text-center">
                <div className="text-4xl mb-2">✍️</div>
                <p className="text-sm text-gray-600">
                  {previewData[name] ? 'Signature captured' : 'Click to add signature'}
                </p>
                {previewData[name] && (
                  <p className="text-xs text-gray-500 mt-1">
                    Signed on: {new Date().toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Report Template Management</h1>
          <p className="text-gray-600">Create and manage report templates for your organization</p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6">
            <Alert variant="error">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}

        {success && (
          <div className="mb-6">
            <Alert variant="success">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Template List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Templates
                  </CardTitle>
                  <Button onClick={handleCreateNew} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    New Template
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Quick Template Creation */}
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-3">Quick Templates</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => createWorkplaceTemplate('work_order')}
                        className="text-xs"
                      >
                        Work Order
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => createWorkplaceTemplate('safety_inspection')}
                        className="text-xs"
                      >
                        Safety Check
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => createWorkplaceTemplate('incident_report')}
                        className="text-xs"
                      >
                        Incident Report
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => createWorkplaceTemplate('equipment_maintenance')}
                        className="text-xs"
                      >
                        Maintenance
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => createWorkplaceTemplate('daily_log')}
                        className="text-xs"
                      >
                        Daily Log
                      </Button>
                    </div>
                  </div>

                  {/* Existing Templates */}
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handleEditTemplate(template)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">{template.title}</h4>
                          <p className="text-sm text-gray-500">{template.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">{template.category}</Badge>
                            <span className="text-xs text-gray-400">
                              {template.fields?.length || 0} fields
                            </span>
                          </div>
                        </div>
                        <Edit className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  ))}
                  {templates.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p>No templates created yet</p>
                      <p className="text-sm">Create your first template to get started</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Template Editor */}
          <div className="lg:col-span-2">
            {(isCreating || isEditing) ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      {isCreating ? 'Create New Template' : 'Edit Template'}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" onClick={handlePreview} size="sm" disabled={!currentTemplate.title?.trim() || !currentTemplate.fields?.length}>
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </Button>
                      <Button onClick={handleSave} disabled={saving} size="sm">
                        {saving ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Save Template
                      </Button>
                      <Button variant="outline" onClick={handleCancel} size="sm">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Template Title</label>
                      <Input
                        value={currentTemplate.title}
                        onChange={(e) => setCurrentTemplate(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Enter template title"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Category</label>
                      <Select 
                        value={currentTemplate.category} 
                        onValueChange={(value) => setCurrentTemplate(prev => ({ ...prev, category: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {reportCategories.map((category) => (
                            <SelectItem key={category.value} value={category.value}>
                              {category.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Description</label>
                    <Textarea
                      value={currentTemplate.description}
                      onChange={(e) => setCurrentTemplate(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter template description"
                      rows={3}
                    />
                  </div>

                  {/* Fields */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900">Form Fields</h3>
                      <Button onClick={addField} variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Field
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {currentTemplate.fields?.map((field, index) => (
                        <div key={index} className="p-4 border rounded-lg bg-gray-50">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700">Field Name</label>
                              <Input
                                value={field.name}
                                onChange={(e) => updateField(index, { name: e.target.value })}
                                placeholder="field_name"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700">Display Label</label>
                              <Input
                                value={field.label}
                                onChange={(e) => updateField(index, { label: e.target.value })}
                                placeholder="Field Label"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700">Field Type</label>
                              <Select 
                                value={field.type} 
                                onValueChange={(value: FieldType) => updateField(index, { type: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {fieldTypes.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>
                                      <span className="flex items-center gap-2">
                                        <span>{type.icon}</span>
                                        {type.label}
                                      </span>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700">Required</label>
                              <Select 
                                value={field.required ? 'true' : 'false'} 
                                onValueChange={(value) => updateField(index, { required: value === 'true' })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="true">Required</SelectItem>
                                  <SelectItem value="false">Optional</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Placeholder</label>
                            <Input
                              value={field.placeholder || ''}
                              onChange={(e) => updateField(index, { placeholder: e.target.value })}
                              placeholder="Enter placeholder text"
                            />
                          </div>

                          {/* Options for select fields */}
                          {(field.type === 'select' || field.type === 'radio') && (
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700">
                                Options {field.type === 'radio' ? '(Radio Choices)' : '(Dropdown Options)'}
                              </label>
                              <div className="space-y-2">
                                {field.options?.map((option, optionIndex) => (
                                  <div key={optionIndex} className="flex items-center gap-2">
                                    <Input
                                      value={option}
                                      onChange={(e) => updateOption(index, optionIndex, e.target.value)}
                                      placeholder="Option text"
                                    />
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => removeOption(index, optionIndex)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => addOption(index)}
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Add Option
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* File upload specific settings */}
                          {field.type === 'file' && (
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700">File Types</label>
                              <Input
                                value={field.validation?.pattern || ''}
                                onChange={(e) => updateField(index, { 
                                  validation: { 
                                    ...field.validation, 
                                    pattern: e.target.value 
                                  } 
                                })}
                                placeholder="e.g., .pdf,.doc,.jpg (leave empty for all files)"
                              />
                              <p className="text-xs text-gray-500">
                                Specify allowed file extensions separated by commas
                              </p>
                            </div>
                          )}

                          {/* Number field validation */}
                          {field.type === 'number' && (
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Min Value</label>
                                <Input
                                  type="number"
                                  value={field.validation?.min || ''}
                                  onChange={(e) => updateField(index, { 
                                    validation: { 
                                      ...field.validation, 
                                      min: e.target.value ? Number(e.target.value) : undefined 
                                    } 
                                  })}
                                  placeholder="Minimum value"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Max Value</label>
                                <Input
                                  type="number"
                                  value={field.validation?.max || ''}
                                  onChange={(e) => updateField(index, { 
                                    validation: { 
                                      ...field.validation, 
                                      max: e.target.value ? Number(e.target.value) : undefined 
                                    } 
                                  })}
                                  placeholder="Maximum value"
                                />
                              </div>
                            </div>
                          )}

                          <div className="flex justify-end mt-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeField(index)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove Field
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : previewMode ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      Template Preview
                    </CardTitle>
                    <Button variant="outline" onClick={() => setPreviewMode(false)} size="sm">
                      <X className="h-4 w-4 mr-2" />
                      Close Preview
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h3 className="font-medium text-blue-900">{currentTemplate.title}</h3>
                      {currentTemplate.description && (
                        <p className="text-sm text-blue-700 mt-1">{currentTemplate.description}</p>
                      )}
                    </div>
                    
                    <div className="space-y-4">
                      {currentTemplate.fields?.map((field) => renderPreviewField(field))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-16 w-16 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Template Selected</h3>
                  <p className="text-gray-500 text-center mb-6">
                    Select a template from the list to edit, or create a new one to get started.
                  </p>
                  <Button onClick={handleCreateNew}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Template
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
