// src/app/api/cso/verifications/[id]/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { clerkClient } from '@clerk/clerk-sdk-node'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const verification = await prisma.customerVerification.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            email: true,
            clerkUserId: true
          }
        }
      }
    })

    if (!verification) {
      return NextResponse.json(
        { error: 'Verification not found' },
        { status: 404 }
      )
    }

    // Get additional user info from Clerk
    const clerkUser = await clerkClient.users.getUser(verification.user.clerkUserId)

    return NextResponse.json({
      ...verification,
      user: {
        ...verification.user,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        imageUrl: clerkUser.imageUrl
      }
    })
  } catch (error) {
    console.error('Failed to fetch verification:', error)
    return NextResponse.json(
      { error: 'Failed to fetch verification details' },
      { status: 500 }
    )
  }
}