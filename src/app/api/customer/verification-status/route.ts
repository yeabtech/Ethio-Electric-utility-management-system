import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      include: {
        verification: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })

    if (!user || user.verification.length === 0) {
      // Return 'not_verified' status if no verification record is found
      return NextResponse.json({ status: 'not_verified' })
    }

    const latestVerification = user.verification[0]
    return NextResponse.json({
      status: latestVerification.status.toLowerCase(),
      rejectionReason: latestVerification.rejectionReason,
      createdAt: latestVerification.createdAt
    })
  } catch (error) {
    console.error('Error fetching verification status:', error)
    return NextResponse.json({ error: 'Failed to fetch verification status' }, { status: 500 })
  }
}
