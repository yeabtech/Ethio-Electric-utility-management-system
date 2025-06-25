// src/app/customer/receipts/[id]/page.tsx
'use client'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Loader2, Receipt, CheckCircle2, XCircle, CreditCard, Download, ArrowLeft } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import Image from 'next/image'
import "@/app/globals.css"
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { useToast } from '@/components/ui/use-toast'

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
    paid: boolean
    paymentDate: string | null
    txRef: string | null
    approvedBy?: {
      firstName: string
      lastName: string
    }
}

export default function ReceiptPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useUser()
  const [receipt, setReceipt] = useState<Receipt | null>(null) 
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [processingPayment, setProcessingPayment] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const searchParams = useSearchParams()
  const { toast } = useToast()

  useEffect(() => {
    const fetchReceipt = async () => {
      try {
        const res = await fetch(`/api/customer/receipts/${params.id}`)
        if (!res.ok) throw new Error('Failed to fetch receipt')
        const data = await res.json()
        setReceipt(data)
      } catch (err: unknown) {
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

  useEffect(() => {
    const status = searchParams.get('status')
    if (status === 'success') {
      toast({
        title: 'Payment Successful',
        description: 'Your payment has been processed successfully.',
        variant: 'default',
      })
    } else if (status === 'error') {
      toast({
        title: 'Payment Failed',
        description: 'There was an error processing your payment. Please try again.',
        variant: 'destructive',
      })
    }
  }, [searchParams, toast])

  const handlePayment = async () => {
    if (!receipt) return;
    
    setProcessingPayment(true);
    try {
      const response = await fetch('/api/payment/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ receiptId: receipt.id }),
      });
      
      const data = await response.json();
      
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (error) {
      setError('Failed to initiate payment. Please try again.');
    } finally {
      setProcessingPayment(false);
    }
  };
  
  const handleDownload = async () => {
    const receiptElement = document.getElementById('receipt-card');
    if (!receiptElement || !receipt) return;

    setDownloading(true);
    setError('');

    try {
      const canvas = await html2canvas(receiptElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true,
        backgroundColor: '#ffffff',
        windowWidth: receiptElement.scrollWidth,
        windowHeight: receiptElement.scrollHeight,
      });

      // Convert canvas to PNG
      const imageData = canvas.toDataURL('image/png', 1.0);
      
      // Create a temporary link element
      const link = document.createElement('a');
      link.href = imageData;
      
      // Set filename with timestamp
      const timestamp = new Date().toISOString().slice(0, 10);
      link.download = `receipt-${receipt.id.slice(0, 8)}-${timestamp}.png`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Image generation error:', error);
      setError('Failed to generate image. Please try again or contact support if the issue persists.');
    } finally {
      setDownloading(false);
    }
  };

  const handleBack = () => {
    router.push('/customer/dashboard')
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-white">
        <Loader2 className="animate-spin w-8 h-8 text-gray-600" />
      </div>
    )
  }

  if (error || !receipt) {
    return (
      <div className="min-h-screen bg-white p-4">
        <div className="max-w-md mx-auto">
          <Button 
            variant="ghost" 
            onClick={handleBack}
            className="mb-4 flex items-center gap-2  text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Receipts
          </Button>
          <Alert variant="warning">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error || 'Receipt not found'}</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Mobile Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleBack}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft  className="w-5 h-5 bg-blue-500 rounded-full" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-gray-800">Receipt Details</h1>
            <p className="text-sm text-gray-500">#{receipt.id.slice(0, 8).toUpperCase()}</p>
          </div>
        </div>
      </div>

      <div className="p-4 max-w-4xl mx-auto">
        <Card id="receipt-card" className="shadow-lg border border-gray-200 bg-white relative overflow-hidden">
          {/* Watermark for receipts */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
            <div className={`rotate-[-45deg] text-6xl md:text-8xl lg:text-9xl font-bold ${receipt.paid ? 'text-green-400' : 'text-red-400'}`}>
              {receipt.paid ? 'PAID' : 'UNPAID'}
            </div>
          </div>
          
          <CardHeader className="border-b border-gray-200 bg-white p-6 md:p-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div className="flex items-center gap-4">
                <Image 
                  src="/logo.png" 
                  alt="Company Logo" 
                  width={60} 
                  height={60}
                  className="object-contain"
                />
                <div>
                  <h2 className="text-xl md:text-3xl font-bold text-gray-800">Ethio Electric</h2>
                  <p className="text-sm md:text-base text-gray-600">Utility Management System</p>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <CardTitle className="flex items-center gap-2 text-xl md:text-2xl text-gray-800">
                  <Receipt className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
                  <span>Receipt #{receipt.id.slice(0, 8).toUpperCase()}</span>
                </CardTitle>
                <p className="text-sm md:text-base text-gray-500 mt-1">
                  {new Date(receipt.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-6 md:p-8">
            <div className="space-y-8 md:space-y-10">
              {/* Status and Connection Type - Mobile Stacked */}
              <div className="space-y-4 md:grid md:grid-cols-2 md:gap-6 md:space-y-0">
                <div className="bg-gray-50 p-5 md:p-6 rounded-lg border border-gray-100">
                  <p className="text-sm md:text-base text-gray-600 font-medium">Status</p>
                  <p className={`font-semibold text-lg md:text-xl mt-2 ${
                    receipt.status === 'approved' ? 'text-emerald-600' :
                    receipt.status === 'rejected' ? 'text-rose-600' : 'text-amber-600'
                  }`}>
                    {receipt.status.toUpperCase()}
                  </p>
                </div>
                <div className="bg-gray-50 p-5 md:p-6 rounded-lg border border-gray-100">
                  <p className="text-sm md:text-base text-gray-600 font-medium">Connection Type</p>
                  <p className="font-semibold text-lg md:text-xl mt-2 text-gray-800">{receipt.connectionType}</p>
                </div>
              </div>

              {/* Voltage Level and Payment Status - Mobile Stacked */}
              <div className="space-y-4 md:grid md:grid-cols-2 md:gap-6 md:space-y-0">
                <div className="bg-gray-50 p-5 md:p-6 rounded-lg border border-gray-100">
                  <p className="text-sm md:text-base text-gray-600 font-medium">Voltage Level</p>
                  <p className="font-semibold text-lg md:text-xl mt-2 text-gray-800">{receipt.voltageLevel}</p>
                </div>
                <div className="bg-gray-50 p-5 md:p-6 rounded-lg border border-gray-100">
                  <p className="text-sm md:text-base text-gray-600 font-medium">Payment Status</p>
                  <p className={`font-semibold text-lg md:text-xl mt-2 ${receipt.paid ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {receipt.paid ? 'PAID' : 'UNPAID'}
                  </p>
                </div>
              </div>

              {/* Pricing Details */}
              <div className="border-t pt-6 md:pt-8 space-y-4 md:space-y-5 bg-gray-50 p-6 md:p-8 rounded-lg border border-gray-100">
                <div className="flex justify-between text-gray-700">
                  <span className="font-medium text-base md:text-lg">Base Cost:</span>
                  <span className="font-semibold text-base md:text-lg">{receipt.baseCost.toLocaleString()} ETB</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span className="font-medium text-base md:text-lg">Voltage Rate:</span>
                  <span className="font-semibold text-base md:text-lg">{receipt.voltageRate.toLocaleString()} ETB</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span className="font-medium text-base md:text-lg">Tax (15%):</span>
                  <span className="font-semibold text-base md:text-lg">{receipt.taxAmount.toLocaleString()} ETB</span>
                </div>
                <div className="flex justify-between font-bold border-t border-gray-200 pt-4 md:pt-5 text-xl md:text-2xl text-blue-700">
                  <span>Total Amount:</span>
                  <span>{receipt.grandTotal.toLocaleString()} ETB</span>
                </div>
              </div>

              {/* Alerts */}
              {receipt.paid && (
                <Alert variant="success">
                  <CheckCircle2 className="h-5 w-5 md:h-6 md:w-6" />
                  <AlertTitle>Payment Completed</AlertTitle>
                  <AlertDescription>
                    Payment completed on {new Date(receipt.paymentDate!).toLocaleDateString()}
                    {receipt.txRef && ` (Transaction ID: ${receipt.txRef})`}
                  </AlertDescription>
                </Alert>
              )}

              {receipt.status === 'approved' && !receipt.paid && (
                <Alert variant="warning">
                  <CreditCard className="h-5 w-5 md:h-6 md:w-6" />
                  <AlertTitle>Payment Required</AlertTitle>
                  <AlertDescription>
                    This receipt has been approved but payment is pending.
                  </AlertDescription>
                </Alert>
              )}

              {receipt.status === 'approved' && receipt.approvedBy && (
                <Alert variant="info">
                  <CheckCircle2 className="h-5 w-5 md:h-6 md:w-6" />
                  <AlertTitle>Receipt Approved</AlertTitle>
                  <AlertDescription>
                    This receipt has been approved by {receipt.approvedBy.firstName}.
                  </AlertDescription>
                </Alert>
              )}

              <div className="border-t border-gray-200 pt-6 md:pt-8 text-center text-sm md:text-base text-gray-500">
                <p>This is an official receipt from Ethio Electric Utility Management System</p>
                <p className="mt-2">For any queries, please contact our customer service</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons - Mobile Stacked */}
        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4 sm:gap-6">
          <Button 
            variant="outline" 
            onClick={handleDownload}
            disabled={downloading}
            className="w-full sm:w-auto border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 text-base md:text-lg py-3 md:py-4"
          >
            {downloading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Generating Image...
              </>
            ) : (
              <>
                <Download className="mr-2 h-5 w-5" />
                Download Receipt
              </>
            )}
          </Button>
          {receipt.status === 'approved' && !receipt.paid && (
            <Button 
              onClick={handlePayment}
              disabled={processingPayment}
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 text-base md:text-lg py-3 md:py-4"
            >
              {processingPayment ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-5 w-5" />
                  Pay Now
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}