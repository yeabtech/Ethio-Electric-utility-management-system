// src/app/api/cso/verifications/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { clerkClient } from '@clerk/clerk-sdk-node'

export async function GET(request: Request) {

  const { searchParams } = new URL(request.url)
  const subCity = searchParams.get('subCity')
  const woreda = searchParams.get('woreda')

  if (!subCity || !woreda) {
    return NextResponse.json(
      { error: 'Location parameters are required' },
      { status: 400 }
    )
  }

  try {
    
    // Get pending verifications with user details
    const verifications = await prisma.customerVerification.findMany({
      where: { status: 'pending',  
               subCity,
               woreda  },
      
      include: {
        user: {
          select: {
            email: true,
            clerkUserId: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    // Enhance with Clerk user data
    const enhancedVerifications = await Promise.all(
      verifications.map(async (verification) => {
        const clerkUser = await clerkClient.users.getUser(verification.user.clerkUserId)
        return {
          ...verification,
          user: {
            ...verification.user,
            firstName: clerkUser.firstName,
            lastName: clerkUser.lastName,
            imageUrl: clerkUser.imageUrl
          }
        }
      })
    )

    return NextResponse.json(enhancedVerifications)
  } catch (error) {
    console.error('Failed to fetch verifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch verification requests' },
      { status: 500 }
    )
  }
}