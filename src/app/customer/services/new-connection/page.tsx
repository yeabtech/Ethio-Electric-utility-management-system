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
import { Loader2, CheckCircle2, XCircle, Receipt as ReceiptIcon } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useTheme } from '@/app/context/ThemeContext'
import '@/app/globals.css'

const CONNECTION_TYPES = [
  'Residential',
  'Commercial',
  'Industrial',
  'Agricultural',
  'Temporary Construction',
  'Institutional',
]

const VOLTAGE_LEVELS = [
  'Single Phase (220V)',
  'Three Phase (380V)',
  '11 kV',
  '33 kV',
]

export default function NewConnectionPage() {
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

  const [formData, setFormData] = useState({
    connectionType: '',
    voltageLevel: '',
    plotNumber: '',
    estimatedLoad: '',
    requiredDate: '',
    specialRequirements: '',
  })

  const [estimatedCost, setEstimatedCost] = useState<{
    baseCost: number
    voltageRate: number
    tax: number
    total: number
  } | null>(null)

  const [receipt, setReceipt] = useState<{
    connectionType: string
    voltageLevel: string
    baseCost: number
    voltageRate: number
    tax: number
    total: number
    documents: string[]
  } | null>(null)

  // Check pending apps
  useEffect(() => {
    const checkPending = async () => {
      if (!user?.id) return
      try {
        const res = await fetch(`/api/customer/services/new-connection?userId=${user.id}`)
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

  const calculateEstimate = (type: string, level: string) => {
    const pricingData: Record<string, Record<string, number>> = {
      Residential: { 'Single Phase (220V)': 3000, 'Three Phase (380V)': 8000 },
      Commercial: { 'Single Phase (220V)': 5000, 'Three Phase (380V)': 15000, '11 kV': 50000 },
      Industrial: { 'Three Phase (380V)': 20000, '11 kV': 60000 },
      Agricultural: { 'Single Phase (220V)': 4000 },
      'Temporary Construction': { 'Single Phase (220V)': 3500 },
      Institutional: { 'Three Phase (380V)': 12000 },
    }
    const voltageRates: Record<string, number> = {
      'Single Phase (220V)': 200,
      'Three Phase (380V)': 400,
      '11 kV': 1000,
      '33 kV': 1500,
    }
    const baseCost = pricingData[type]?.[level] || 0
    const voltageRate = voltageRates[level] || 0
    const tax = baseCost * 0.15
    const total = baseCost + voltageRate + tax
    setEstimatedCost({ baseCost, voltageRate, tax, total })
  }

  const handleConnectionTypeChange = (value: string) => {
    setFormData(prev => ({ ...prev, connectionType: value }))
    if (formData.voltageLevel) calculateEstimate(value, formData.voltageLevel)
  }

  const handleVoltageLevelChange = (value: string) => {
    setFormData(prev => ({ ...prev, voltageLevel: value }))
    if (formData.connectionType) calculateEstimate(formData.connectionType, value)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleFileUpload = (field: string, selected: File[]) => {
    setFiles(prev => ({ ...prev, [field]: selected }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    try {
      if (!estimatedCost) throw new Error('Please calculate estimate before submitting')
      // upload docs
      const uploadedDocs: Record<string, string> = {}
    for (const [fieldName, fileList] of Object.entries(files)) {
       if (fileList && fileList.length > 0) {
        try {
          const uploadResults = await startUpload(fileList)
          if (uploadResults?.[0]?.url) {
              uploadedDocs[fieldName] = uploadResults[0].url
          }
        }catch (err) {
          console.error(`Error uploading files for field ${fieldName}:`, err)
          setError('Failed to upload some files')
      }
    }
  }

        
      // submit
      const res = await fetch('/api/customer/services/new-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          connectionType: formData.connectionType,
          voltageLevel: formData.voltageLevel,
          estimatedLoad: formData.estimatedLoad,
          documents: uploadedDocs,
          estimatedCost,
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      setReceipt({
        connectionType: formData.connectionType,
        voltageLevel: formData.voltageLevel,
        ...estimatedCost,
        documents: Object.values(uploadedDocs),
      })
      setSuccess(true)
    }catch (err: any) {
      console.error(err)
      setError(err.message || 'Failed to submit application')
    } finally {
      setIsSubmitting(false)
    }
  }

  const ReceiptPreview = () => (
    <Card className="mt-6">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <ReceiptIcon className="w-6 h-6 text-primary" />
          <span>Payment Receipt</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Connection Type</p>
              <p className="font-medium">{receipt?.connectionType}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Voltage Level</p>
              <p className="font-medium">{receipt?.voltageLevel}</p>
            </div>
          </div>
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between">
              <span>Base Cost:</span>
              <span>{receipt?.baseCost.toLocaleString()} ETB</span>
            </div>
            <div className="flex justify-between">
              <span>Voltage Rate:</span>
              <span>{receipt?.voltageRate.toLocaleString()} ETB</span>
            </div>
            <div className="flex justify-between">
              <span>Tax (15%):</span>
              <span>{receipt?.tax.toLocaleString()} ETB</span>
            </div>
            <div className="flex justify-between font-bold border-t pt-2">
              <span>Total Amount:</span>
              <span>{receipt?.total.toLocaleString()} ETB</span>
            </div>
          </div>
          <div className="pt-4">
            <p className="text-sm text-gray-500">Submitted Documents:</p>
            <ul className="list-disc pl-5">
              {receipt?.documents.map((doc, i) => (<li key={i}>{doc}</li>))}
            </ul>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <Button onClick={() => router.push('/customer/dashboard')}>Back to Dashboard</Button>
        </div>
      </CardContent>
    </Card>
  )

  if (!user || isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin w-8 h-8 text-muted-foreground" /></div>
  }

  if (hasPendingApplication) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <Alert variant="info">
          <AlertTitle>Pending Application Exists</AlertTitle>
          <AlertDescription>
            You already have a pending new connection application. Please wait for it to be processed before submitting a new one.
          </AlertDescription>
        
        </Alert>
      </div>
    )
  }

  if (success && receipt) {
    return (
      <div className="p-4">
        <ReceiptPreview />
      </div>
    )
  }

  return (
    <div className="p-4 space-y-6 text-black dark:text-white bg-gray-100 dark:bg-transparent">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-black dark:text-white">New Electricity Connection</h1>
        <p className="text-black/70 dark:text-white/70">Apply for a new electricity connection to your property</p>
      </div>

      {error && (
        <Alert variant="warning">
          <XCircle className="h-5 w-5" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Connection Details</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="connectionType">Type of Connection *</Label>
              <Select onValueChange={handleConnectionTypeChange} value={formData.connectionType} required>
                <SelectTrigger><SelectValue placeholder="Select connection type" /></SelectTrigger>
                <SelectContent>{CONNECTION_TYPES.map(type => (<SelectItem key={type} value={type}>{type}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="voltageLevel">Voltage Level *</Label>
              <Select onValueChange={handleVoltageLevelChange} value={formData.voltageLevel} required>
                <SelectTrigger><SelectValue placeholder="Select voltage level" /></SelectTrigger>
                <SelectContent>{VOLTAGE_LEVELS.map(lvl => (<SelectItem key={lvl} value={lvl}>{lvl}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="plotNumber">Plot/Land Number *</Label>
              <Input id="plotNumber" name="plotNumber" value={formData.plotNumber} onChange={handleInputChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estimatedLoad">Estimated Load (kW)</Label>
              <Input id="estimatedLoad" name="estimatedLoad" type="number" value={formData.estimatedLoad} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="requiredDate">Required Date</Label>
              <Input id="requiredDate" name="requiredDate" type="date" value={formData.requiredDate} onChange={handleInputChange} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Required Documents</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Property Ownership Document *</Label>
              <Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => e.target.files && handleFileUpload('propertyDoc', Array.from(e.target.files))} required />
              {files.propertyDoc && <p className="text-sm text-green-600">{files.propertyDoc[0].name} selected</p>}
            </div>
            <div className="space-y-2">
              <Label>Site Plan *</Label>
              <Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => e.target.files && handleFileUpload('sitePlan', Array.from(e.target.files))} required />
              {files.sitePlan && <p className="text-sm text-green-600">{files.sitePlan[0].name} selected</p>}
            </div>
            <div className="space-y-2">
              <Label>ID Document (From Verification)</Label>
              <Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => e.target.files && handleFileUpload('idDoc', Array.from(e.target.files))} />
              {files.idDoc && <p className="text-sm text-green-600">{files.idDoc[0].name} selected</p>}
            </div>
          </CardContent>
        </Card>

        {/* Cost estimate */}
        {estimatedCost && (
          <Card>
            <CardHeader><CardTitle>Cost Estimate</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-1"><p className="text-sm text-muted-foreground">Base Cost</p><p className="font-medium">{estimatedCost.baseCost.toLocaleString()} ETB</p></div>
                <div className="space-y-1"><p className="text-sm text-muted-foreground">Voltage Rate</p><p className="font-medium">{estimatedCost.voltageRate.toLocaleString()} ETB</p></div>
                <div className="space-y-1"><p className="text-sm text-muted-foreground">Tax (15%)</p><p className="font-medium">{estimatedCost.tax.toLocaleString()} ETB</p></div>
                <div className="space-y-1"><p className="text-sm text-muted-foreground">Total</p><p className="font-bold">{estimatedCost.total.toLocaleString()} ETB</p></div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end gap-4">
          <Button type="button" variant="secondary" onClick={() => router.back()} disabled={isSubmitting}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting} variant="outline">
            {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting...</> : 'Submit Application'}
          </Button>
        </div>
      </form>
    </div>
  )
}
