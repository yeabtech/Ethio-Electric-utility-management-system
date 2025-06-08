// src/app/api/cso/verifications/[id]/approve/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { clerkClient } from '@clerk/clerk-sdk-node'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const verificationId = params.id

    // Update verification status
    const verification = await prisma.customerVerification.update({
      where: { id: verificationId },
      data: { status: 'approved' },
      include: { user: true }
    })

    // Update Clerk user metadata
    await clerkClient.users.updateUserMetadata(verification.user.clerkUserId, {
      publicMetadata: {
        isVerified: true,
        verificationStatus: 'approved',
        verifiedAt: new Date().toISOString()
      }
    })

    return NextResponse.json({ 
      success: true,
      verificationId: verification.id
    })
  } catch (error) {
    console.error('Approval failed:', error)
    return NextResponse.json(
      { error: 'Failed to approve verification' },
      { status: 500 }
    )
  }
}