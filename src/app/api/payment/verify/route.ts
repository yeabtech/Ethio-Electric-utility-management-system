import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'

const CHAPA_SECRET_KEY = process.env.CHAPA_SECRET_KEY

export async function POST(req: Request) {
  try {
    const headersList = await headers()
    const chapaSignature = headersList.get('chapa-signature')

    if (!chapaSignature) {
      return NextResponse.json({ error: 'No signature provided' }, { status: 401 })
    }

    const body = await req.json()
    const { tx_ref, status } = body

    if (!tx_ref || !status) {
      return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 })
    }

    // Verify the webhook signature
    // Note: Implement proper signature verification based on Chapa's documentation
    // This is a placeholder for the actual verification logic

    // Find the receipt with this transaction reference
    const receipt = await prisma.receipt.findUnique({
      where: { txRef: tx_ref },
      include: {
        service: true
      }
    })

    if (!receipt) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 })
    }

    if (receipt.paid) {
      return NextResponse.json({ message: 'Receipt already processed' })
    }

    // Update receipt status based on payment status
    if (status === 'success') {
      // Start a transaction to update both receipt and service
      await prisma.$transaction(async (tx) => {
        // Update receipt
        await tx.receipt.update({
          where: { id: receipt.id },
          data: {
            paid: true,
            paymentDate: new Date(),
            status: 'approved',
            chapaRawResponse: body
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

      console.log(`Payment successful for receipt ${receipt.id}, service ${receipt.service?.id || 'N/A'}`)
    } else {
      console.log(`Payment failed for receipt ${receipt.id} with status: ${status}`)
    }

    return NextResponse.json({ message: 'Webhook processed successfully' })
  } catch (error) {
    console.error('Payment verification error:', error)
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    )
  }
} 