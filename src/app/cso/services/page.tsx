// src/app/cso/services/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { DataTable } from '@/components/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Loader2, ShieldAlert, ShieldCheck, ShieldQuestion } from 'lucide-react'
import   "@/app/globals.css"
type ServiceApplication = {
  id: string
  category: string
  serviceType: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  user: {
    id: string
    email: string
    firstName: string | null
    lastName: string | null
    verification: {
      subCity: string
      woreda: string
    } | null
  }
  metadata: {
    plotNumber?: string
    voltageLevel?: string
  }
}

export default function CSOServiceApprovalPage() {
  const { user } = useUser()
  const router = useRouter()
  const [services, setServices] = useState<ServiceApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [csoLocation, setCsoLocation] = useState<{subCity: string, woreda: string} | null>(null)
  const [selectedService, setSelectedService] = useState<ServiceApplication | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!user?.id) return

        // First get CSO's location
        const csoRes = await fetch(`/api/employee-info?userId=${user.id}`)
        if (!csoRes.ok) throw new Error('Failed to fetch CSO location')
        const csoData = await csoRes.json()
        setCsoLocation({ subCity: csoData.subCity, woreda: csoData.woreda })

        // Then get services from same location
        const servicesRes = await fetch(
          `/api/cso/services?subCity=${csoData.subCity}&woreda=${csoData.woreda}`
        )
        const servicesData = await servicesRes.json()
        setServices(servicesData)
      } catch (err) {
        setError("location hab=ve problem")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user?.id])

  const handleStatusChange = async (serviceId: string, status: 'approved' | 'rejected', reason?: string) => {
    try {
      // Only send the request if there's a reason for rejection
      if (status === 'rejected' && !reason) {
        alert('Please provide a reason for rejection.');
        return;
      }
  
      const response = await fetch(`/api/cso/services/${serviceId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reason })
      });
  
      if (!response.ok) throw new Error(await response.text());
  
      // Update local state after successful status change
      setServices(services.map(service =>
        service.id === serviceId ? { ...service, status } : service
      ));
    } catch (err) {
      console.error('Error changing service status:', err);
      setError("An error occurred while updating the service status.");
    }
  }
  

  const columns: ColumnDef<ServiceApplication>[] = [
    {
      accessorKey: 'user',
      header: 'Customer',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">
            {row.original.user.firstName} {row.original.user.lastName}
          </div>
          <div className="text-sm text-gray-500">{row.original.user.email}</div>
        </div>
      )
    },
    {
      accessorKey: 'serviceType',
      header: 'Service Type'
    },
    {
      accessorKey: 'metadata.plotNumber',
      header: 'Plot Number'
    },
    {
      accessorKey: 'metadata.voltageLevel',
      header: 'Voltage'
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status
        const variant = status === 'approved' ? 'success' : 
                       status === 'rejected' ? 'destructive' : 'warning'
        return (
          <Badge variant={variant}>
            {status.toUpperCase()}
          </Badge>
        )
      }
    },
    {
      accessorKey: 'user.verification',
      header: 'Location',
      cell: ({ row }) => {
        const verification = row.original.user.verification;
        return (
          <div className="text-sm">
            {verification?.subCity || 'N/A'}, Woreda {verification?.woreda || 'N/A'}
          </div>
        );
      }
    }
    ,
    {
      id: 'actions',
      cell: ({ row }) => {
        const service = row.original
        const [isProcessing, setIsProcessing] = useState(false)
        
        return (
          <div className="flex space-x-2">
            {service.status === 'pending' && (
              <>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={async () => {
                    setIsProcessing(true)
                    await handleStatusChange(service.id, 'approved')
                    setIsProcessing(false)
                  }}
                  disabled={isProcessing}
                >
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={async () => {
                    const reason = prompt('Enter rejection reason:')
                    if (reason) {
                      setIsProcessing(true)
                      await handleStatusChange(service.id, 'rejected', reason)
                      setIsProcessing(false)
                    }
                  }}
                  disabled={isProcessing}
                >
                  Reject
                </Button>
              </>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelectedService(service)}
            >
              Details
            </Button>
          </div>
        )
      }
    }
  ]
   

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="warning">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }


  
  if (!csoLocation ) {
    return (
      <Alert variant="warning">
        <ShieldQuestion className="h-4 w-4" />
        <AlertTitle>Location Not Set</AlertTitle>
        <AlertDescription>
          Your service location has not been assigned. Please contact your manager.
        </AlertDescription>
      </Alert>
    )
  }

  if (selectedService) {
    // Use verification for name, fallback to Clerk user for current user
    const isCurrentUser = selectedService.user.id === user?.id;
    const verification = selectedService.user.verification;
    const displayFirstName = (verification && typeof verification === 'object' && 'firstName' in verification && typeof verification.firstName === 'string') ? verification.firstName : (isCurrentUser ? user?.firstName ?? '' : '');
    const displayLastName = (verification && typeof verification === 'object' && 'lastName' in verification && typeof verification.lastName === 'string') ? verification.lastName : (isCurrentUser ? user?.lastName ?? '' : '');
    return (
      <div className="flex justify-center items-center min-h-[600px]">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 w-full max-w-xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-green-600" /> Service Details
            </h2>
            <Button variant="outline" onClick={() => setSelectedService(null)}>
              Back
            </Button>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-gray-700">Customer:</span>
              <span className="text-lg">{displayFirstName} {displayLastName}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-semibold text-gray-700">Email:</span>
              <span>{selectedService.user.email}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-semibold text-gray-700">Service Type:</span>
              <span>{selectedService.serviceType}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-semibold text-gray-700">Plot Number:</span>
              <span>{selectedService.metadata.plotNumber || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-semibold text-gray-700">Voltage Level:</span>
              <span>{selectedService.metadata.voltageLevel || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-semibold text-gray-700">Status:</span>
              <Badge variant={selectedService.status === 'approved' ? 'success' : selectedService.status === 'rejected' ? 'destructive' : 'warning'}>
                {selectedService.status.toUpperCase()}
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-semibold text-gray-700">Location:</span>
              <span>{verification?.subCity || 'N/A'}, Woreda {verification?.woreda || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-semibold text-gray-700">Requested At:</span>
              <span>{new Date(selectedService.createdAt).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Service Applications</h1>
          <p className="text-sm text-gray-500">
            Showing applications from {csoLocation.subCity}, Woreda {csoLocation.woreda}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant="outline" className="px-3 py-1">
            {services.filter(s => s.status === 'pending').length} Pending
          </Badge>
          <Badge variant="outline" className="px-3 py-1">
            {services.length} Total
          </Badge>
        </div>
      </div>

      <DataTable 
        columns={columns}
        data={services}
        loading={loading}
      />
    </div>
  )
}