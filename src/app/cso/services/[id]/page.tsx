// src/app/cso/services/[id]/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Loader2, ShieldCheck, XCircle, FileText, Home, Zap, Calendar } from 'lucide-react'
import '@/app/globals.css'
type ServiceApplication = {
  id: string
  category: string
  serviceType: string
  status: 'pending' | 'approved' | 'rejected'
  rejectionReason?: string
  createdAt: string
  documents: string[]
  metadata: Record<string, any>
  user: {
    email: string
    firstName: string | null
    lastName: string | null
    verification: {
      subCity: string
      woreda: string
      mobileNumber: string
      firstName:string;
      lastName:string;
    } | null
  }
}

export default function ServiceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [service, setService] = useState<ServiceApplication | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchService = async () => {
      try {
        const response = await fetch(`/api/cso/services/${params.id}`)
        if (!response.ok) throw new Error('Failed to fetch service details')
        const data = await response.json()
        setService(data)
      } catch (error) {
        setError('cant fetch /api/cso/services/${params.id')
      } finally {
        setLoading(false)
      }
    }

    fetchService()
  }, [params.id])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    )
  }

  if (error || !service) {
    return (
      <Alert variant="error">
        <XCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error || 'Service not found'}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Service Application Details</h1>
        <Badge variant={service.status === 'approved' ? 'success' : 
                       service.status === 'rejected' ? 'destructive' : 'warning'}>
          {service.status.toUpperCase()}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customer Info */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
  <div>
    <p className="text-sm text-gray-500">Name</p>
    <p>{service.user.verification?.firstName} {service.user.verification?.lastName}</p>
  </div>
  <div>
    <p className="text-sm text-gray-500">Email</p>
    <p>{service.user.email}</p>
  </div>
  <div>
    <p className="text-sm text-gray-500">Phone</p>
    <p>{service.user.verification?.mobileNumber || 'Not provided'}</p>
  </div>
  <div>
    <p className="text-sm text-gray-500">Location</p>
    <p>
      {service.user.verification?.subCity || 'N/A'}, Woreda {service.user.verification?.woreda || 'N/A'}
    </p>
  </div>
</CardContent>

        </Card>

        {/* Service Details */}
        <Card>
          <CardHeader>
            <CardTitle>Service Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-sm text-gray-500">Service Type</p>
                <p>{service.serviceType}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Home className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-500">Plot Number</p>
                <p>{
                  service.metadata.plotNumber ||
                  service.metadata.plot_number ||
                  service.metadata.plotNo ||
                  'Not provided'
                }</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-500">Application Date</p>
                <p>{new Date(service.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Documents */}
      <Card>
        <CardHeader>
          <CardTitle>Submitted Documents</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {service.documents && service.documents.length > 0 ? (
            service.documents.filter(doc => typeof doc === 'string' && doc.startsWith('http')).map((doc, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-2">
                <img 
                  src={doc}
                  alt={`Document ${index + 1}`}
                  className="w-full h-auto rounded shadow"
                  onError={e => { e.currentTarget.style.display = 'none'; }}
                />
                <a 
                  href={doc} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline block text-sm"
                >
                  Open Full Size
                </a>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No documents submitted.</p>
          )}
        </CardContent>
      </Card>

      {/* Rejection Reason */}
      {service.status === 'rejected' && service.rejectionReason && (
        <Alert variant="error">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Rejection Reason</AlertTitle>
          <AlertDescription>{service.rejectionReason}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => router.push('/cso?activePage=services')}>
          Back to List
        </Button>
      </div>
    </div>
  )
}