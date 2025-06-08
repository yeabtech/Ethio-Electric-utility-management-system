// src/app/customer/receipts/[id]/page.tsx
'use client'
import { useParams } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Loader2, Receipt, CheckCircle2, XCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import  "@/app/globals.css"

interface Receipt {
    id: string
    status: 'approved' | 'rejected' | 'pending'
    createdAt: string
    connectionType: string
    voltageLevel: string
    baseCost: number
    voltageRate: number
    taxAmount: number
    grandTotal: number
    approvedBy?: {
      firstName: string
      lastName: string
    }
  }

export default function ReceiptPage() {
  const params = useParams()
  const { user } = useUser()
  const [receipt, setReceipt] = useState<Receipt | null>(null) 
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchReceipt = async () => {
      try {
        const res = await fetch(`/api/customer/receipts/${params.id}`)
        if (!res.ok) throw new Error('Failed to fetch receipt')
        const data = await res.json()
        setReceipt(data)
      } catch (err: unknown) {  // TypeScript expects the error to be of type 'unknown'
        // Check if the error is actually an instance of Error
        if (err instanceof Error) {
          setError(err.message)
        } else {
          setError('An unexpected error occurred')
        }
      } finally {
        setLoading(false)
      }
    }
  
    if (user) fetchReceipt()
  }, [params.id, user])
  

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    )
  }

  if (error || !receipt) {
    return (
      <Alert variant="warning">
        <XCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error || 'Receipt not found'}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-6 h-6 text-primary" />
            <span>Payment Receipt #{receipt.id.slice(0, 8).toUpperCase()}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className={`font-medium ${
                  receipt.status === 'approved' ? 'text-green-600' :
                  receipt.status === 'rejected' ? 'text-red-600' : 'text-yellow-600'
                }`}>
                  {receipt.status.toUpperCase()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date</p>
                <p className="font-medium">
                  {new Date(receipt.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Connection Type</p>
                <p className="font-medium">{receipt.connectionType}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Voltage Level</p>
                <p className="font-medium">{receipt.voltageLevel}</p>
              </div>
            </div>

            <div className="border-t pt-4 space-y-3">
              <div className="flex justify-between">
                <span>Base Cost:</span>
                <span>{receipt.baseCost.toLocaleString()} ETB</span>
              </div>
              <div className="flex justify-between">
                <span>Voltage Rate:</span>
                <span>{receipt.voltageRate.toLocaleString()} ETB</span>
              </div>
              <div className="flex justify-between">
                <span>Tax (15%):</span>
                <span>{receipt.taxAmount.toLocaleString()} ETB</span>
              </div>
              <div className="flex justify-between font-bold border-t pt-2 text-lg">
                <span>Total Amount:</span>
                <span>{receipt.grandTotal.toLocaleString()} ETB</span>
              </div>
            </div>

            {receipt.status === 'approved' && (
              <Alert variant="success" >
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Payment Approved</AlertTitle>
                <AlertDescription>
                  This receipt has been approved by {receipt.approvedBy?.firstName}.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 flex justify-center">
        <Button variant="outline" onClick={() => window.print()}>
          Print Receipt
        </Button>
      </div>
    </div>
  )
}