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
import { Loader2, CheckCircle2, XCircle, Receipt, CalendarClock, FileText } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { useTheme } from '@/app/context/ThemeContext'
import '@/app/globals.css'

const SERVICE_TYPES = [
  { value: 'BILL_DISPUTE', label: '🧾 Dispute a bill' },
  { value: 'PAYMENT_EXTENSION', label: '⏰ Request payment extension' },
  { value: 'DUPLICATE_BILL', label: '💸 Request duplicate bill' },
]

export default function BillingPage() {
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
    accountNumber: '',
    description: '',
    extensionDate: '',
  })

  // Check pending apps
  useEffect(() => {
    const checkPending = async () => {
      if (!user?.id) return
      try {
        const res = await fetch(`/api/customer/services/billing?userId=${user.id}`)
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
      
      if (serviceType === 'BILL_DISPUTE') {
        if (!formData.description) throw new Error('Dispute description is required')
        if (!files.billPhoto || files.billPhoto.length === 0) {
          throw new Error('Bill photo is required for bill disputes')
        }
      }
      
      if (serviceType === 'PAYMENT_EXTENSION' && !formData.extensionDate) {
        throw new Error('Extension date is required')
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
      const res = await fetch('/api/customer/services/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          category: 'METERING_BILLING',
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
      case 'BILL_DISPUTE':
        return (
          <>
            <div className="space-y-4">
              <div>
                <Label htmlFor="meterNumber">Meter Number</Label>
                <Input
                  id="meterNumber"
                  name="meterNumber"
                  value={formData.meterNumber}
                  onChange={handleInputChange}
                  placeholder="Enter your meter number"
                  required
                />
              </div>
              <div>
                <Label htmlFor="billPhoto">Upload Bill Photo</Label>
                <Input
                  id="billPhoto"
                  type="file"
                  onChange={(e) => handleFileUpload('billPhoto', e.target.files)}
                  accept="image/*"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Dispute Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe your dispute in detail"
                  rows={4}
                  required
                />
              </div>
            </div>
          </>
        )
      
      case 'PAYMENT_EXTENSION':
        return (
          <>
            <div className="space-y-4">
              <div>
                <Label htmlFor="meterNumber">Meter Number</Label>
                <Input
                  id="meterNumber"
                  name="meterNumber"
                  value={formData.meterNumber}
                  onChange={handleInputChange}
                  placeholder="Enter your meter number"
                  required
                />
              </div>
              <div>
                <Label htmlFor="accountNumber">Account Number</Label>
                <Input
                  id="accountNumber"
                  name="accountNumber"
                  value={formData.accountNumber}
                  onChange={handleInputChange}
                  placeholder="Enter your account number"
                  required
                />
              </div>
              <div>
                <Label htmlFor="extensionDate">Requested Extension Date</Label>
                <Input
                  id="extensionDate"
                  name="extensionDate"
                  type="date"
                  value={formData.extensionDate}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Reason for Extension</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Please explain why you need a payment extension"
                  rows={4}
                  required
                />
              </div>
            </div>
          </>
        )
      
      case 'DUPLICATE_BILL':
        return (
          <>
            <div className="space-y-4">
              <div>
                <Label htmlFor="meterNumber">Meter Number</Label>
                <Input
                  id="meterNumber"
                  name="meterNumber"
                  value={formData.meterNumber}
                  onChange={handleInputChange}
                  placeholder="Enter your meter number"
                  required
                />
              </div>
              <div>
                <Label htmlFor="accountNumber">Account Number</Label>
                <Input
                  id="accountNumber"
                  name="accountNumber"
                  value={formData.accountNumber}
                  onChange={handleInputChange}
                  placeholder="Enter your account number"
                  required
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
    return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin w-8 h-8 text-muted-foreground" /></div>
  }

  if (hasPendingApplication) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <Alert variant="info">
          <AlertTitle>Pending Application Exists</AlertTitle>
          <AlertDescription>
            You already have a pending billing application. Please wait for it to be processed before submitting a new one.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <Alert variant='success'>
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          <AlertTitle>Application Submitted Successfully</AlertTitle>
          <AlertDescription>
            Your billing service request has been submitted. We will process your application shortly.
          </AlertDescription>
        </Alert>
        <div className="mt-6 flex justify-end">
          <Button onClick={() => router.push('/customer/dashboard')}>Back to Dashboard</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-xl font-bold">Billing Support Services</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {error && (
            <Alert variant="error">
              <XCircle className="h-5 w-5" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <Label htmlFor="serviceType">Service Type</Label>
                <Select
                  value={serviceType}
                  onValueChange={setServiceType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select service type" />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {serviceType && (
                <>
                  <div className="border-t pt-6">
                    {renderForm()}
                  </div>
                  
                  <div className="pt-4 flex justify-end">
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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