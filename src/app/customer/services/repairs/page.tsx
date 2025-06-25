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
]

interface MeterPricing {
  id: string
  meterType: string
  price: number
  description: string | null
}

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
  const [showReceipt, setShowReceipt] = useState(false)
  const [meterPricing, setMeterPricing] = useState<MeterPricing[]>([])

  const [serviceType, setServiceType] = useState('')
  const [formData, setFormData] = useState({
    meterNumber: '',
    description: '',
    newMeterType: '',
  })

  // Fetch meter pricing
  useEffect(() => {
    const fetchMeterPricing = async () => {
      try {
        const res = await fetch('/api/meter-pricing')
        if (res.ok) {
          const data = await res.json()
          setMeterPricing(data)
        }
      } catch (error) {
        console.error('Error fetching meter pricing:', error)
      }
    }
    fetchMeterPricing()
  }, [])

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
                    {meterPricing.map((type) => (
                      <SelectItem key={type.id} value={type.meterType}>
                        {type.meterType} - ETB {type.price}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className={`mt-6 p-6 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>Meter Replacement Receipt</h3>
                  <Receipt className={`w-6 h-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>Meter Type:</span>
                    <span className={theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}>
                      {formData.newMeterType || 'Not selected'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>Meter Price:</span>
                    <span className={theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}>
                      {formData.newMeterType ? `ETB ${meterPricing.find(t => t.meterType === formData.newMeterType)?.price}` : 'ETB 0'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>Installation Fee:</span>
                    <span className={theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}>ETB 500</span>
                  </div>
                  <div className="border-t my-2 pt-2">
                    <div className="flex justify-between">
                      <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>Subtotal:</span>
                      <span className={theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}>
                        ETB {formData.newMeterType ? (meterPricing.find(t => t.meterType === formData.newMeterType)?.price || 0) + 500 : 500}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>Tax (15%):</span>
                      <span className={theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}>
                        ETB {formData.newMeterType ? ((meterPricing.find(t => t.meterType === formData.newMeterType)?.price || 0) + 500) * 0.15 : 75}
                      </span>
                    </div>
                    <div className="border-t my-2 pt-2">
                      <div className="flex justify-between font-semibold">
                        <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>Grand Total:</span>
                        <span className={theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}>
                          ETB {formData.newMeterType ? ((meterPricing.find(t => t.meterType === formData.newMeterType)?.price || 0) + 500) * 1.15 : 575}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
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
                {serviceType === 'METER_REPLACEMENT' && (
                  <span className="block mt-2 font-medium">
                    A receipt has been generated for your meter replacement. You can view and pay for it in your receipts section.
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-4">
          {serviceType === 'METER_REPLACEMENT' && (
            <Button 
              onClick={() => router.push('/customer/receipts')} 
              className={`md:text-lg md:px-8 md:py-6 ${theme === 'dark' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'}`}
            >
              View Receipts
            </Button>
          )}
          <Button 
            onClick={() => router.push('/customer/dashboard')} 
            className={`md:text-lg md:px-8 md:py-6 ${theme === 'dark' ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-500 hover:bg-gray-600'}`}
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={`max-w-4xl sm:max-w-5xl md:max-w-6xl lg:max-w-7xl mx-auto p-8 ${theme === 'dark' ? 'text-gray-100' : 'text-black'}`}>
      <Card className={`md:p-10 shadow-lg ${theme === 'dark' ? 'bg-gray-800/95 border-gray-700' : 'bg-white'}`}>
        <CardHeader className={`border-b md:py-8 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <CardTitle className={`text-xl md:text-2xl font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-black'}`}>
            Repair Service Request
          </CardTitle>
        </CardHeader>
        <CardContent className={`py-8 ${theme === 'dark' ? 'text-gray-300' : 'text-black'}`}>
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-6">
              <div>
                <Label htmlFor="serviceType" className={`text-base md:text-lg font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-black'}`}>Service Type</Label>
                <Select
                  value={serviceType}
                  onValueChange={(value) => setServiceType(value)}
                >
                  <SelectTrigger className={`mt-2 md:mt-3 md:text-lg md:p-6 ${theme === 'dark' ? 'bg-gray-700/50 border-gray-600' : 'bg-white border-gray-300 text-black'}`}>
                    <SelectValue placeholder="Select service type" />
                  </SelectTrigger>
                  <SelectContent className={theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}>
                    {SERVICE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {renderForm()}
            </div>
            <div className="mt-10 flex justify-end">
              <Button 
                type="submit"
                disabled={isSubmitting}
                className={`md:text-lg md:px-10 md:py-6 rounded-lg ${theme === 'dark' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'}`}
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}