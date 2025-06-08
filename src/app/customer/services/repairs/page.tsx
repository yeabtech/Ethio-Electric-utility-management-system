'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/lable'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useUploadThing } from '@/lib/uploadthing'
import { Loader2, CheckCircle2, XCircle, ActivitySquare, RotateCw, Receipt, FileText } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { useTheme } from '@/app/context/ThemeContext'
import '@/app/globals.css'

const SERVICE_TYPES = [
  { value: 'METER_MALFUNCTION', label: '🧮 Meter not working' },
  { value: 'METER_REPLACEMENT', label: '🔁 Meter replacement (damaged/expired)' },
  { value: 'BILL_DISPUTE', label: '🧾 Dispute a bill' },
  { value: 'DUPLICATE_BILL', label: '💸 Request duplicate bill' },
]

const METER_TYPES = [
  { value: 'postpaid', label: 'Postpaid' },
  { value: 'prepaid', label: 'Prepaid' },
  { value: 'smart_meter', label: 'Smart Meter' },
]

export default function RepairsPage() {
  const { user } = useUser()
  const router = useRouter()
  const { startUpload } = useUploadThing('serviceDocuments')
  const { theme } = useTheme()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [files, setFiles] = useState<Record<string, File[]>>({})
  const [hasPendingApplication, setHasPendingApplication] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const [serviceType, setServiceType] = useState('')
  const [formData, setFormData] = useState({
    meterNumber: '',
    description: '',
    newMeterType: '',
  })

  // Check pending apps
  useEffect(() => {
    const checkPending = async () => {
      if (!user?.id) return
      try {
        const res = await fetch(`/api/customer/services/repairs?userId=${user.id}`)
        if (res.ok) {
          const data = await res.json()
          if (data.applications?.length > 0) setHasPendingApplication(true)
        }
      } catch {
        // ignore
      } finally {
        setIsLoading(false)
      }
    }
    checkPending()
  }, [user?.id])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleFileUpload = (field: string, selected: FileList | null) => {
    if (selected && selected.length > 0) {
      const filesArray = Array.from(selected)
      setFiles(prev => ({ ...prev, [field]: filesArray }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    try {
      if (!serviceType) throw new Error('Please select a service type')
      
      // Validate form based on service type
      if (!formData.meterNumber) throw new Error('Meter number is required')
      
      if (serviceType === 'METER_MALFUNCTION' && !formData.description) {
        throw new Error('Description is required for meter malfunction')
      }
      
      if (serviceType === 'METER_REPLACEMENT' && !formData.newMeterType) {
        throw new Error('New meter type is required for meter replacement')
      }
      
      if (serviceType === 'BILL_DISPUTE') {
        if (!formData.description) throw new Error('Dispute description is required')
        if (!files.billPhoto || files.billPhoto.length === 0) {
          throw new Error('Bill photo is required for bill disputes')
        }
      }

      // Upload docs if needed
      const uploadedDocs: string[] = []
      if (files.billPhoto && files.billPhoto.length > 0) {
        try {
          const uploadResults = await startUpload(files.billPhoto)
          if (uploadResults?.[0]?.url) {
            uploadedDocs.push(uploadResults[0].url)
          }
        } catch (err) {
          console.error('Error uploading files:', err)
          throw new Error('Failed to upload bill photo')
        }
      }
      
      // Submit the form
      const res = await fetch('/api/customer/services/repairs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          category: 'NETWORK_OPERATIONS',
          serviceType,
          metadata: {
            ...formData,
            documents: uploadedDocs,
          }
        }),
      })
      
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.message || 'Failed to submit application')
      }
      
      setSuccess(true)
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Failed to submit application')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderForm = () => {
    switch (serviceType) {
      case 'METER_MALFUNCTION':
        return (
          <>
            <div className="space-y-4 md:space-y-6">
              <div>
                <Label htmlFor="meterNumber" className={`text-sm md:text-base ${theme === 'dark' ? 'text-gray-300' : 'text-black'}`}>Meter Number</Label>
                <Input
                  id="meterNumber"
                  name="meterNumber"
                  value={formData.meterNumber}
                  onChange={handleInputChange}
                  placeholder="Enter your meter number"
                  required
                  className={`mt-1 md:mt-2 md:text-lg md:p-6 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300 text-black'}`}
                />
              </div>
              <div>
                <Label htmlFor="description" className={`text-sm md:text-base ${theme === 'dark' ? 'text-gray-300' : 'text-black'}`}>Description of the Issue</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe the meter issue in detail"
                  rows={4}
                  required
                  className={`mt-1 md:mt-2 md:text-lg md:p-6 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300 text-black'}`}
                />
              </div>
            </div>
          </>
        )
      
      case 'METER_REPLACEMENT':
        return (
          <>
            <div className="space-y-4 md:space-y-6">
              <div>
                <Label htmlFor="meterNumber" className={`text-sm md:text-base ${theme === 'dark' ? 'text-gray-300' : 'text-black'}`}>Meter Number</Label>
                <Input
                  id="meterNumber"
                  name="meterNumber"
                  value={formData.meterNumber}
                  onChange={handleInputChange}
                  placeholder="Enter your meter number"
                  required
                  className={`mt-1 md:mt-2 md:text-lg md:p-6 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300 text-black'}`}
                />
              </div>
              <div>
                <Label htmlFor="newMeterType" className={`text-sm md:text-base ${theme === 'dark' ? 'text-gray-300' : 'text-black'}`}>New Meter Type</Label>
                <Select
                  value={formData.newMeterType}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, newMeterType: value }))}
                >
                  <SelectTrigger className={`mt-1 md:mt-2 md:text-lg md:p-6 ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300 text-black'}`}>
                    <SelectValue placeholder="Select meter type" />
                  </SelectTrigger>
                  <SelectContent className={theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}>
                    {METER_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </>
        )
      
      case 'BILL_DISPUTE':
        return (
          <>
            <div className="space-y-4 md:space-y-6">
              <div>
                <Label htmlFor="meterNumber" className={`text-sm md:text-base ${theme === 'dark' ? 'text-gray-300' : 'text-black'}`}>Meter Number</Label>
                <Input
                  id="meterNumber"
                  name="meterNumber"
                  value={formData.meterNumber}
                  onChange={handleInputChange}
                  placeholder="Enter your meter number"
                  required
                  className={`mt-1 md:mt-2 md:text-lg md:p-6 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300 text-black'}`}
                />
              </div>
              <div>
                <Label htmlFor="billPhoto" className={`text-sm md:text-base ${theme === 'dark' ? 'text-gray-300' : 'text-black'}`}>Upload Bill Photo</Label>
                <Input
                  id="billPhoto"
                  type="file"
                  onChange={(e) => handleFileUpload('billPhoto', e.target.files)}
                  accept="image/*"
                  required
                  className={`mt-1 md:mt-2 md:text-lg ${theme === 'dark' ? 'text-gray-300 file:bg-gray-700 file:text-gray-300 file:border-gray-600' : 'text-black file:bg-gray-200 file:text-black file:border-gray-300'}`}
                />
              </div>
              <div>
                <Label htmlFor="description" className={`text-sm md:text-base ${theme === 'dark' ? 'text-gray-300' : 'text-black'}`}>Dispute Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe your dispute in detail"
                  rows={4}
                  required
                  className={`mt-1 md:mt-2 md:text-lg md:p-6 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300 text-black'}`}
                />
              </div>
            </div>
          </>
        )
      
      case 'DUPLICATE_BILL':
        return (
          <>
            <div className="space-y-4 md:space-y-6">
              <div>
                <Label htmlFor="meterNumber" className={`text-sm md:text-base ${theme === 'dark' ? 'text-gray-300' : 'text-black'}`}>Meter Number</Label>
                <Input
                  id="meterNumber"
                  name="meterNumber"
                  value={formData.meterNumber}
                  onChange={handleInputChange}
                  placeholder="Enter your meter number"
                  required
                  className={`mt-1 md:mt-2 md:text-lg md:p-6 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300 text-black'}`}
                />
              </div>
            </div>
          </>
        )
      
      default:
        return null
    }
  }

  if (!user || isLoading) {
    return (
      <div className={`flex justify-center items-center h-64 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    )
  }

  if (hasPendingApplication) {
    const alertClasses = theme === 'dark' ? 'bg-blue-900 text-blue-100' : 'bg-blue-100 text-black';
    
    return (
      <div className={`max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto p-4 ${theme === 'dark' ? 'text-gray-100' : 'text-black'}`}>
        <div className={`rounded-md border p-4 ${theme === 'dark' ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-100'}`}>
          <div className={alertClasses}>
            <h3 className={`font-semibold ${theme === 'dark' ? '' : 'text-black'}`}>Pending Application Exists</h3>
            <p className="text-sm">
              You already have a pending repair application. Please wait for it to be processed before submitting a new one.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (success) {
    const alertClasses = theme === 'dark' ? 'bg-green-900/20 text-green-100' : 'bg-green-100 text-black';
    
    return (
      <div className={`max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto p-4 ${theme === 'dark' ? 'text-gray-100' : 'text-black'}`}>
        <div className={`rounded-md border p-4 ${theme === 'dark' ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-100'}`}>
          <div className={`flex items-center space-x-3 ${alertClasses}`}>
            <CheckCircle2 className={`h-5 w-5 ${theme === 'dark' ? 'text-green-400' : 'text-green-500'}`} />
            <div>
              <h3 className={`font-semibold ${theme === 'dark' ? '' : 'text-black'}`}>Application Submitted Successfully</h3>
              <p className="text-sm">
                Your repair service request has been submitted. We will process your application shortly.
              </p>
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <Button 
            onClick={() => router.push('/customer/dashboard')} 
            className={`md:text-lg md:px-8 md:py-6 ${theme === 'dark' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'}`}
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={`max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto p-4 ${theme === 'dark' ? 'text-gray-100' : 'text-black'}`}>
      <Card className={`md:p-4 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
        <CardHeader className={`border-b md:py-6 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <CardTitle className={`text-xl md:text-2xl font-bold ${theme === 'dark' ? '' : 'text-black'}`}>Repairs & Maintenance Services</CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-8">
          {error && (
            <div className={`rounded-md border p-4 mb-4 ${theme === 'dark' ? 'bg-red-900/20 border-red-800 text-red-100' : 'bg-red-50 border-red-100 text-black'}`}>
              <div className="flex items-center space-x-3">
                <XCircle className={`h-5 w-5 ${theme === 'dark' ? 'text-red-400' : 'text-red-500'}`} />
                <div>
                  <h3 className={`font-semibold ${theme === 'dark' ? '' : 'text-black'}`}>Error</h3>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-6 md:space-y-8">
              <div>
                <Label htmlFor="serviceType" className={`text-sm md:text-base ${theme === 'dark' ? 'text-gray-300' : 'text-black'}`}>Service Type</Label>
                <Select
                  value={serviceType}
                  onValueChange={setServiceType}
                >
                  <SelectTrigger className={`mt-1 md:mt-2 md:text-lg md:p-6 ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300 text-black'}`}>
                    <SelectValue placeholder="Select service type" />
                  </SelectTrigger>
                  <SelectContent className={theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 text-black'}>
                    {SERVICE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value} className={theme === 'dark' ? '' : 'text-black'}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {serviceType && (
                <>
                  <div className={`border-t pt-6 md:pt-8 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                    {renderForm()}
                  </div>
                  
                  <div className="pt-4 md:pt-6 flex justify-end">
                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                      className={`md:text-lg md:px-8 md:py-6 ${theme === 'dark' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'}`}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 md:h-5 md:w-5 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        'Submit Application'
                      )}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}