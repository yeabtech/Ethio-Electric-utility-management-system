import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { v4 as uuidv4 } from 'uuid'

const CHAPA_SECRET_KEY = process.env.CHAPA_SECRET_KEY
const CHAPA_BASE_URL = 'https://api.chapa.co/v1'

export async function POST(req: Request) {
  try {
    // Check environment variables
    if (!CHAPA_SECRET_KEY) {
      console.error('CHAPA_SECRET_KEY is not set')
      return NextResponse.json({ error: 'Payment gateway configuration error' }, { status: 500 })
    }

    if (!process.env.NEXT_PUBLIC_APP_URL) {
      console.error('NEXT_PUBLIC_APP_URL is not set')
      return NextResponse.json({ error: 'Application URL not configured' }, { status: 500 })
    }

    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      console.error('No clerk user ID found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { receiptId } = body

    if (!receiptId) {
      console.error('No receipt ID provided')
      return NextResponse.json({ error: 'Receipt ID is required' }, { status: 400 })
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { clerkUserId },
      select: { 
        id: true, 
        email: true,
        verification: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    })

    if (!user) {
      console.error('User not found for clerk ID:', clerkUserId)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!user.verification || user.verification.length === 0) {
      console.error('No verification found for user:', user.id)
      return NextResponse.json({ error: 'User verification not found' }, { status: 404 })
    }

    const latestVerification = user.verification[0]

    // Get receipt details
    const receipt = await prisma.receipt.findUnique({
      where: { 
        id: receiptId,
        customerId: user.id
      }
    })

    if (!receipt) {
      console.error('Receipt not found:', receiptId)
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 })
    }

    if (receipt.paid) {
      console.error('Receipt already paid:', receiptId)
      return NextResponse.json({ error: 'Receipt already paid' }, { status: 400 })
    }

    // Generate unique transaction reference
    const txRef = `EEUMS-${uuidv4()}`

    // Prepare Chapa payment request
    const paymentData = {
      amount: receipt.grandTotal.toString(),
      currency: 'ETB',
      email: user.email,
      first_name: latestVerification.firstName,
      last_name: latestVerification.lastName,
      tx_ref: txRef,
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/verify`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/verify-return?receiptId=${receiptId}&txRef=${txRef}`,
      customization: {
        title: 'EEUMS Payment',
        description: `${receipt.connectionType} - ${receipt.voltageLevel !== 'N/A' ? receipt.voltageLevel.replace(/[()]/g, '') : 'Meter Replacement'}`
      }
    }

    console.log('Initiating payment with data:', {
      ...paymentData,
      amount: receipt.grandTotal.toString(),
      email: user.email
    })

    // Initialize Chapa payment
    const response = await fetch(`${CHAPA_BASE_URL}/transaction/initialize`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CHAPA_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paymentData)
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Chapa API error:', JSON.stringify(data, null, 2))
      return NextResponse.json(
        { error: 'Payment initialization failed', details: data.message || 'Unknown error' },
        { status: response.status }
      )
    }

    if (!data.data || !data.data.checkout_url) {
      console.error('Invalid response from Chapa:', JSON.stringify(data, null, 2))
      return NextResponse.json(
        { error: 'Invalid response from payment gateway' },
        { status: 500 }
      )
    }

    // Update receipt with transaction reference
    await prisma.receipt.update({
      where: { id: receiptId },
      data: { txRef }
    })

    return NextResponse.json({
      checkoutUrl: data.data.checkout_url
    })
  } catch (error) {
    console.error('Payment initiation error:', error)
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      })
      return NextResponse.json(
        { error: 'Failed to initiate payment', details: error.message },
        { status: 500 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to initiate payment', details: 'Unknown error occurred' },
      { status: 500 }
    )
  }
} 