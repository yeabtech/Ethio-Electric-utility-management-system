import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const queryUserId = searchParams.get('userId')

    if (queryUserId !== userId) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 })
    }

    // Get pending billing applications for this user
    const applications = await prisma.serviceApplication.findMany({
      where: {
        userId,
        category: 'METERING_BILLING',
        serviceType: {
          in: ['BILL_DISPUTE', 'PAYMENT_EXTENSION', 'DUPLICATE_BILL']
        },
        status: 'pending'
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ applications })
  } catch (error) {
    console.error('Error fetching billing applications:', error)
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { category, serviceType, metadata } = body

    // Validate request
    if (!serviceType) {
      return NextResponse.json({ error: 'Service type is required' }, { status: 400 })
    }

    // Check if service type is valid
    const validServiceTypes = ['BILL_DISPUTE', 'PAYMENT_EXTENSION', 'DUPLICATE_BILL']
    if (!validServiceTypes.includes(serviceType)) {
      return NextResponse.json({ error: 'Invalid service type' }, { status: 400 })
    }

    // Additional validation based on service type
    if (!metadata.meterNumber) {
      return NextResponse.json({ error: 'Meter number is required' }, { status: 400 })
    }

    if (serviceType === 'BILL_DISPUTE') {
      if (!metadata.description) {
        return NextResponse.json({ error: 'Dispute description is required' }, { status: 400 })
      }
      if (!metadata.documents || metadata.documents.length === 0) {
        return NextResponse.json({ error: 'Bill photo is required for disputes' }, { status: 400 })
      }
    }

    if (serviceType === 'PAYMENT_EXTENSION') {
      if (!metadata.extensionDate) {
        return NextResponse.json({ error: 'Extension date is required' }, { status: 400 })
      }
      if (!metadata.description) {
        return NextResponse.json({ error: 'Reason for extension is required' }, { status: 400 })
      }
    }

    // Check if user is verified
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      select: { id: true, isVerified: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!user.isVerified) {
      return NextResponse.json({ error: 'You must verify your account before submitting service requests' }, { status: 403 })
    }

    // Create the service application
    const serviceApplication = await prisma.serviceApplication.create({
      data: {
        userId: user.id,
        category: 'METERING_BILLING',
        serviceType,
        status: 'pending',
        documents: metadata.documents || [],
        metadata: metadata,
      }
    })

    return NextResponse.json({ 
      success: true,
      message: 'Billing service request submitted successfully',
      serviceId: serviceApplication.id
    })
  } catch (error) {
    console.error('Error creating billing service request:', error)
    return NextResponse.json({ error: 'Failed to submit service request' }, { status: 500 })
  }
} 