// src/app/api/customer/services/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { clerkClient } from '@clerk/clerk-sdk-node'

export async function POST(req: Request) {
  try {
    const { userId, category, serviceType, documents } = await req.json()

    if (!userId || !category || !serviceType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify user is approved
    const clerkUser = await clerkClient.users.getUser(userId)
    if (clerkUser.publicMetadata.verificationStatus !== 'approved') {
      return NextResponse.json(
        { error: 'User verification required' },
        { status: 403 }
      )
    }

    // Create service application
    const application = await prisma.serviceApplication.create({
      data: {
        userId,
        category,
        serviceType,
        documents,
        status: 'pending'
      }
    })

    // Update Clerk metadata
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: {
        ...clerkUser.publicMetadata,
        lastServiceRequest: new Date().toISOString()
      }
    })

    return NextResponse.json({ 
      success: true,
      applicationId: application.id
    })

  } catch (error) {
    console.error('Service application failed:', error)
    return NextResponse.json(
      { error: 'Failed to submit service application' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}