import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  
  // Handle both encoded and unencoded parameters
  let receiptId = searchParams.get('receiptId')
  let txRef = searchParams.get('txRef') || searchParams.get('amp;txRef')

  try {
    if (!receiptId || !txRef) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    // Find the receipt
    const receipt = await prisma.receipt.findUnique({
      where: { 
        id: receiptId,
        txRef: txRef
      },
      include: {
        service: true
      }
    })

    if (!receipt) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 })
    }

    // Verify payment status with Chapa
    const response = await fetch(`https://api.chapa.co/v1/transaction/verify/${txRef}`, {
      headers: {
        'Authorization': `Bearer ${process.env.CHAPA_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    const data = await response.json()

    if (data.status === 'success') {
      // Update receipt and service status
      await prisma.$transaction(async (tx) => {
        // Update receipt
        await tx.receipt.update({
          where: { id: receipt.id },
          data: {
            paid: true,
            paymentDate: new Date(),
            status: 'approved',
            chapaRawResponse: data
          }
        })

        // Update associated service application if it exists
        if (receipt.service) {
          await tx.serviceApplication.update({
            where: { id: receipt.service.id },
            data: {
              status: 'approved'
            }
          })
        }
      })

      console.log(`Payment verification successful for receipt ${receipt.id}, service ${receipt.service?.id || 'N/A'}`)

      // Redirect to receipt page with success parameter
      return redirect(`/customer/receipts/${receiptId}?status=success`)
    } else {
      console.log(`Payment verification failed for receipt ${receipt.id} with status: ${data.status}`)
      
      // Redirect to receipt page with error parameter
      return redirect(`/customer/receipts/${receiptId}?status=error`)
    }
  } catch (error) {
    console.error('Payment verification error:', error)
    return redirect(`/customer/receipts/${receiptId}?status=error`)
  }
} 