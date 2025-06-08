// src/app/api/cso/verifications/[id]/reject/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { clerkClient } from '@clerk/clerk-sdk-node'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { reason } = await request.json()
    const verificationId = params.id

    if (!reason) {
      return NextResponse.json(
        { error: 'Rejection reason is required' },
        { status: 400 }
      )
    }

    // Update verification status
    const verification = await prisma.customerVerification.update({
      where: { id: verificationId },
      data: { 
        status: 'rejected',
        rejectionReason: reason
      },
      include: { user: true }
    })

    // Update Clerk user metadata
    await clerkClient.users.updateUserMetadata(verification.user.clerkUserId, {
      publicMetadata: {
        isVerified: false,
        verificationStatus: 'rejected',
        rejectionReason: reason
      }
    })

    return NextResponse.json({ 
      success: true,
      verificationId: verification.id
    })
  } catch (error) {
    console.error('Rejection failed:', error)
    return NextResponse.json(
      { error: 'Failed to reject verification' },
      { status: 500 }
    )
  }
}