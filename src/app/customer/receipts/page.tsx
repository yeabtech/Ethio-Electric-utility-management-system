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
  grandTotal: number
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  paid: boolean
  paymentDate: string | null
  txRef: string | null
  service: {
    serviceType: string
    category: string
    status: 'pending' | 'approved' | 'rejected'
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
        // Filter receipts based on status conditions
        const filteredReceipts = data.filter((receipt: Receipt) => 
          receipt.status === 'approved' || (receipt.status === 'pending' && receipt.service.status === 'approved')
        )
        setReceipts(filteredReceipts)
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
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'pending':
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    }
  }

  const handlePayment = async (receiptId: string) => {
    try {
      const response = await fetch('/api/payment/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ receiptId }),
      });
      
      const data = await response.json();
      
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (error) {
      console.error('Payment initiation failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="animate-spin w-6 h-6 text-foreground" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto text-black dark:text-black">
      <h1 className="text-2xl font-bold mb-6 text-black dark:text-white">Your Receipts</h1>
      {receipts.length === 0 ? (
        <p className="text-black dark:text-black">No receipts found.</p>
      ) : (
        <div className="space-y-4">
          {receipts.map((receipt) => (
            <Card key={receipt.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-black dark:text-black">{receipt.service.serviceType.replace(/_/g, ' ')}</CardTitle>
                  <p className="text-sm text-black dark:text-black">
                    {receipt.connectionType} – {receipt.voltageLevel}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(receipt.status)}>
                    {receipt.status.toUpperCase()}
                  </Badge>
                  {receipt.paid && (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      PAID
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="text-sm text-black dark:text-black">
                <p><strong>Total:</strong> ETB {receipt.grandTotal.toFixed(2)}</p>
                <p><strong>Date:</strong> {new Date(receipt.createdAt).toLocaleDateString()}</p>
                {receipt.paymentDate && (
                  <p><strong>Payment Date:</strong> {new Date(receipt.paymentDate).toLocaleDateString()}</p>
                )}
                {receipt.status === 'pending' && !receipt.paid && (
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => handlePayment(receipt.id)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Pay Now
                    </button>
                    <button
                      onClick={() => router.push(`/customer/receipts/${receipt.id}`)}
                      className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                )}
                {receipt.status !== 'pending' && (
                  <button
                    onClick={() => router.push(`/customer/receipts/${receipt.id}`)}
                    className="mt-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                  >
                    View Details
                  </button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
