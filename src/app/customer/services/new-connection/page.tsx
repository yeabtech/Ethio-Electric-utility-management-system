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
import { useLanguage } from '@/app/context/LanguageContext'

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

// Translation object for new connection page
const t = {
  title: { en: 'New Electricity Connection', am: 'አዲስ የኤሌክትሪክ ግንኙነት' },
  subtitle: { en: 'Apply for a new electricity connection to your property', am: 'ለአዲስ የኤሌክትሪክ ግንኙነት ያመልክቱ' },
  pendingTitle: { en: 'Pending Application Exists', am: 'በመጠባበቅ ላይ ያለ ማመልከቻ አለ' },
  pendingDesc: { en: 'You already have a pending new connection application. Please wait for it to be processed before submitting a new one.', am: 'አዲስ የኤሌክትሪክ ግንኙነት ማመልከቻ በመጠባበቅ ላይ አለ። እባክዎ እስከሚያስተናግዱት ድረስ ይጠብቁ።' },
  error: { en: 'Error', am: 'ስህተት' },
  connectionDetails: { en: 'Connection Details', am: 'የግንኙነት ዝርዝሮች' },
  typeOfConnection: { en: 'Type of Connection *', am: 'የግንኙነት አይነት *' },
  selectConnectionType: { en: 'Select connection type', am: 'የግንኙነት አይነት ይምረጡ' },
  voltageLevel: { en: 'Voltage Level *', am: 'የቮልቴጅ ደረጃ *' },
  selectVoltageLevel: { en: 'Select voltage level', am: 'የቮልቴጅ  ደረጃ ይምረጡ' },
  plotNumber: { en: 'Plot/Land Number *', am: 'የመሬት ቁጥር *' },
  estimatedLoad: { en: 'Estimated Load (kW)', am: 'ተገመተ ጭነት (ኪ.ዋ)' },
  requiredDate: { en: 'Required Date', am: 'የሚያስፈልገው ቀን' },
  requiredDocs: { en: 'Required Documents', am: 'የሚያስፈልጉ ሰነዶች' },
  propertyDoc: { en: 'Property Ownership Document *', am: 'የንብረት መብት ሰነድ *' },
  sitePlan: { en: 'Site Plan *', am: 'የሳይት እቅድ *' },
  idDoc: { en: 'ID Document (From Verification)', am: 'መታወቂያ ሰነድ (ከማረጋገጫ)' },
  costEstimate: { en: 'Cost Estimate', am: 'የወጪ ግምት' },
  baseCost: { en: 'Base Cost', am: 'መሠረታዊ ወጪ' },
  voltageRate: { en: 'Voltage Rate', am: 'የቃውም ክፍያ' },
  tax: { en: 'Tax (15%)', am: 'ታክስ (15%)' },
  total: { en: 'Total', am: 'ድምር' },
  cancel: { en: 'Cancel', am: 'ይቅር' },
  submit: { en: 'Submit Application', am: 'ማመልከቻ ያስገቡ' },
  submitting: { en: 'Submitting...', am: 'በማስገባት ላይ...' },
}

export default function NewConnectionPage() {
  const { user } = useUser()
  const router = useRouter()
  const { startUpload } = useUploadThing('serviceDocuments')
  const { theme } = useTheme()
  const { language } = useLanguage()

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
    <Card className="mt-6 max-w-3xl mx-auto">
      <CardHeader className="border-b">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2 text-black dark:text-black">
            <ReceiptIcon className="w-6 h-6 text-black dark:text-black" />
            <span>New Connection Application Receipt</span>
          </CardTitle>
          <div className="text-sm text-black dark:text-black">
            Date: {new Date().toLocaleDateString()}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Application Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-black dark:text-black">Application Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-black dark:text-black">Connection Type</p>
                <p className="font-medium text-black dark:text-black">{receipt?.connectionType}</p>
              </div>
              <div>
                <p className="text-sm text-black dark:text-black">Voltage Level</p>
                <p className="font-medium text-black dark:text-black">{receipt?.voltageLevel}</p>
              </div>
              <div>
                <p className="text-sm text-black dark:text-black">Plot/Land Number</p>
                <p className="font-medium text-black dark:text-black">{formData.plotNumber}</p>
              </div>
              <div>
                <p className="text-sm text-black dark:text-black">Estimated Load</p>
                <p className="font-medium text-black dark:text-black">{formData.estimatedLoad} kW</p>
              </div>
            </div>
          </div>

          {/* Cost Breakdown */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-black dark:text-black">Cost Breakdown</h3>
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-black dark:text-black">Base Cost:</span>
                <span className="font-medium text-black dark:text-black">{receipt?.baseCost.toLocaleString()} ETB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-black dark:text-black">Voltage Rate:</span>
                <span className="font-medium text-black dark:text-black">{receipt?.voltageRate.toLocaleString()} ETB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-black dark:text-black">Tax (15%):</span>
                <span className="font-medium text-black dark:text-black">{receipt?.tax.toLocaleString()} ETB</span>
              </div>
              <div className="flex justify-between font-bold border-t pt-3">
                <span className="text-black dark:text-black">Total Amount:</span>
                <span className="text-black dark:text-black">{receipt?.total.toLocaleString()} ETB</span>
              </div>
            </div>
          </div>

          {/* Submitted Documents */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-black dark:text-black">Submitted Documents</h3>
            <div className="border rounded-lg p-4">
              <ul className="space-y-2">
                {receipt?.documents.map((doc, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-black dark:text-black">{doc}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Important Notes */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2 text-black dark:text-black">Important Notes</h3>
            <ul className="text-sm space-y-2 text-black dark:text-black">
              <li>• Please keep this receipt for your records</li>
              <li>• Your application will be processed within 5-7 business days</li>
              <li>• You will be notified via email about the status of your application</li>
              <li>• For any queries, please contact our customer service</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-4">
          <Button variant="outline" onClick={() => window.print()}>Print Receipt</Button>
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
          <AlertTitle>{t.pendingTitle[language]}</AlertTitle>
          <AlertDescription>
            {t.pendingDesc[language]}
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
    <div className="p-4 space-y-6 text-black dark:text-black bg-gray-100 dark:bg-transparent">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-black dark:text-white">{t.title[language]}</h1>
        <p className="text-black/70 dark:text-white/70">{t.subtitle[language]}</p>
      </div>

      {error && (
        <Alert variant="warning">
          <XCircle className="h-5 w-5 text-black dark:text-black" />
          <AlertTitle><span className="text-black dark:text-black">{t.error[language]}</span></AlertTitle>
          <AlertDescription><span className="text-black dark:text-black">{error}</span></AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-black dark:text-black">{t.connectionDetails[language]}</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="connectionType">{t.typeOfConnection[language]}</Label>
              <Select onValueChange={handleConnectionTypeChange} value={formData.connectionType} required>
                <SelectTrigger><SelectValue placeholder={t.selectConnectionType[language]} /></SelectTrigger>
                <SelectContent>{CONNECTION_TYPES.map(type => (<SelectItem key={type} value={type}>{type}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="voltageLevel">{t.voltageLevel[language]}</Label>
              <Select onValueChange={handleVoltageLevelChange} value={formData.voltageLevel} required>
                <SelectTrigger><SelectValue placeholder={t.selectVoltageLevel[language]} /></SelectTrigger>
                <SelectContent>{VOLTAGE_LEVELS.map(lvl => (<SelectItem key={lvl} value={lvl}>{lvl}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="plotNumber">{t.plotNumber[language]}</Label>
              <Input id="plotNumber" name="plotNumber" value={formData.plotNumber} onChange={handleInputChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estimatedLoad">{t.estimatedLoad[language]}</Label>
              <Input id="estimatedLoad" name="estimatedLoad" type="number" value={formData.estimatedLoad} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="requiredDate">{t.requiredDate[language]}</Label>
              <Input id="requiredDate" name="requiredDate" type="date" value={formData.requiredDate} onChange={handleInputChange} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-black dark:text-black">{t.requiredDocs[language]}</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>{t.propertyDoc[language]}</Label>
              <Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => e.target.files && handleFileUpload('propertyDoc', Array.from(e.target.files))} required />
              {files.propertyDoc && <p className="text-sm text-black dark:text-black">{files.propertyDoc[0].name} selected</p>}
            </div>
            <div className="space-y-2">
              <Label>{t.sitePlan[language]}</Label>
              <Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => e.target.files && handleFileUpload('sitePlan', Array.from(e.target.files))} required />
              {files.sitePlan && <p className="text-sm text-black dark:text-black">{files.sitePlan[0].name} selected</p>}
            </div>
            <div className="space-y-2">
              <Label>{t.idDoc[language]}</Label>
              <Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => e.target.files && handleFileUpload('idDoc', Array.from(e.target.files))} />
              {files.idDoc && <p className="text-sm text-black dark:text-black">{files.idDoc[0].name} selected</p>}
            </div>
          </CardContent>
        </Card>

        {/* Cost estimate */}
        {estimatedCost && (
          <Card>
            <CardHeader><CardTitle className="text-black dark:text-black">{t.costEstimate[language]}</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-1"><p className="text-sm text-black dark:text-black">{t.baseCost[language]}</p><p className="font-medium text-black dark:text-black">{estimatedCost.baseCost.toLocaleString()} ETB</p></div>
                <div className="space-y-1"><p className="text-sm text-black dark:text-black">{t.voltageRate[language]}</p><p className="font-medium text-black dark:text-black">{estimatedCost.voltageRate.toLocaleString()} ETB</p></div>
                <div className="space-y-1"><p className="text-sm text-black dark:text-black">{t.tax[language]}</p><p className="font-medium text-black dark:text-black">{estimatedCost.tax.toLocaleString()} ETB</p></div>
                <div className="space-y-1"><p className="text-sm text-black dark:text-black">{t.total[language]}</p><p className="font-bold text-black dark:text-black">{estimatedCost.total.toLocaleString()} ETB</p></div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end gap-4">
          <Button type="button" variant="secondary" onClick={() => router.back()} disabled={isSubmitting}>{t.cancel[language]}</Button>
          <Button type="submit" disabled={isSubmitting} variant="outline">
            {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t.submitting[language]}</> : t.submit[language]}
          </Button>
        </div>
      </form>
    </div>
  )
}
