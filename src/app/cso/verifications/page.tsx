'use client'

import { useEffect, useState } from 'react'
import { DataTable } from '@/components/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import "@/app/globals.css"

type Verification = {
  id: string
  firstName: string
  lastName: string
  idType: string
  idNumber: string
  status: 'pending' | 'approved' | 'rejected'
  subCity: string
  woreda: string
  user: {
    email: string
    imageUrl: string
  }
}

export default function VerificationQueue() {
  const { user } = useUser()
  const [verifications, setVerifications] = useState<Verification[]>([])
  const [loading, setLoading] = useState(true)
  const [csoLocation, setCsoLocation] = useState<{ subCity: string; woreda: string } | null>(null)
  const router = useRouter()

  const fetchVerifications = async (userId: string) => {
    try {
      const csoResponse = await fetch(`/api/employee-info?userId=${userId}`)
      if (!csoResponse.ok) throw new Error('Failed to fetch CSO location')
      const csoData = await csoResponse.json()
      setCsoLocation({ subCity: csoData.subCity, woreda: csoData.woreda })

      const verificationsResponse = await fetch(
        `/api/cso/verifications?subCity=${csoData.subCity}&woreda=${csoData.woreda}`
      )
      const verificationsData = await verificationsResponse.json()
      setVerifications(verificationsData)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.id) {
      fetchVerifications(user.id)
    }
  }, [user?.id])

  const columns: ColumnDef<Verification>[] = [
    {
      id: 'user.imageUrl',
      header: 'Photo',
      cell: ({ row }) => {
        const imageUrl = row.original.user.imageUrl || ''
        const isExternal = imageUrl.startsWith('http')
        const finalUrl = isExternal ? imageUrl : `/uploads/${imageUrl}`

        return (
          <div className="w-10 h-10">
            <img
              src={finalUrl}
              alt="User"
              className="w-full h-full rounded-full object-cover border border-gray-300 shadow-sm"
              onError={(e) => {
                e.currentTarget.src = "/logo.png"
              }}
            />
          </div>
        )
      }
    },
    {
      accessorKey: 'firstName',
      header: 'Name',
      cell: ({ row }) => (
        <span className="font-medium text-gray-900">
          {row.original.firstName} {row.original.lastName}
        </span>
      )
    },
    {
      accessorKey: 'user.email',
      header: 'Email'
    },
    {
      accessorKey: 'subCity',
      header: 'Sub-city'
    },
    {
      accessorKey: 'woreda',
      header: 'Woreda'
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status
        const statusColor =
          status === 'approved'
            ? 'bg-green-100 text-green-700'
            : status === 'rejected'
            ? 'bg-red-100 text-red-700'
            : 'bg-yellow-100 text-yellow-700'

        return (
          <span
            className={`px-2 py-1 rounded-full text-xs font-semibold inline-block ${statusColor}`}
          >
            {status.toUpperCase()}
          </span>
        )
      }
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const [isProcessing, setIsProcessing] = useState(false)
        const [processingAction, setProcessingAction] = useState<string | null>(null)

        const handleAction = async (action: 'approve' | 'reject') => {
          setIsProcessing(true)
          setProcessingAction(action)
          try {
            const response = await fetch(
              `/api/cso/verifications/${row.original.id}/${action}`,
              { method: 'POST' }
            )
            if (response.ok && user?.id) {
              await fetchVerifications(user.id)
            }
          } finally {
            setIsProcessing(false)
            setProcessingAction(null)
          }
        }

        return (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={isProcessing || row.original.status !== 'pending'}
              onClick={() => handleAction('approve')}
            >
              {processingAction === 'approve' ? (
                <span className="flex items-center gap-1">
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Processing...
                </span>
              ) : 'Approve'}
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={isProcessing || row.original.status !== 'pending'}
              onClick={() => {
                const reason = prompt('Enter rejection reason:')
                if (reason) {
                  setProcessingAction('reject')
                  handleAction('reject')
                }
              }}
            >
              {processingAction === 'reject' ? (
                <span className="flex items-center gap-1">
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Processing...
                </span>
              ) : 'Reject'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={isProcessing}
              onClick={() => {
                setProcessingAction('details');
                router.push(`/cso/verifications/${row.original.id}`);
              }}
            >
              {processingAction === 'details' ? (
                <span className="flex items-center gap-1">
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
                  Loading...
                </span>
              ) : 'Details'}
            </Button>
          </div>
        )
      }
    }
  ]

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Customer Verifications</h1>
        {csoLocation && (
          <div className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-md font-medium">
            Serving: {csoLocation.subCity}, Woreda {csoLocation.woreda}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
        </div>
      ) : verifications.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold text-gray-800">
            {csoLocation
              ? 'No pending verifications in your service area'
              : 'Could not determine your service location'}
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            {csoLocation
              ? "You'll only see customers from your assigned sub-city and woreda"
              : 'Please ensure your employee profile has your correct location'}
          </p>
        </div>
      ) : (
        <DataTable columns={columns} data={verifications} />
      )}
    </div>
  )
}
