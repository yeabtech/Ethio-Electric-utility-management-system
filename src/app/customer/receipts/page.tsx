'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'
import "@/app/globals.css"
type Receipt = {
  id: string
  connectionType: string
  voltageLevel: string
  totalAmount: number
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  service: {
    serviceType: string
    category: string
  }
}

export default function ReceiptPage() {
  const { user } = useUser()
  const router = useRouter()
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchReceipts = async () => {
      try {
        const res = await fetch('/api/customer/receipts')
        const data = await res.json()
        setReceipts(data)
      } catch (error) {
        console.error('Failed to fetch receipts:', error)
      } finally {
        setLoading(false)
      }
    }

    if (user) fetchReceipts()
  }, [user])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      case 'pending':
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="animate-spin w-6 h-6 text-gray-500" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Your Receipts</h1>
      {receipts.length === 0 ? (
        <p className="text-gray-500">No receipts found.</p>
      ) : (
        <div className="space-y-4">
          {receipts.map((receipt) => (
            <Card key={receipt.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>{receipt.service.serviceType.replace(/_/g, ' ')}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {receipt.connectionType} – {receipt.voltageLevel}
                  </p>
                </div>
                <Badge className={getStatusColor(receipt.status)}>
                  {receipt.status.toUpperCase()}
                </Badge>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p><strong>Total:</strong> ${receipt.totalAmount.toFixed(2)}</p>
                <p><strong>Date:</strong> {new Date(receipt.createdAt).toLocaleDateString()}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
