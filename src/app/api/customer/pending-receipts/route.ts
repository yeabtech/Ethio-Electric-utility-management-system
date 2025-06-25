import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ count: 0 }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      select: { id: true }
    })

    if (!user) {
      return NextResponse.json({ count: 0 }, { status: 404 })
    }

    // Count receipts where service is approved and receipt is not paid
    const count = await prisma.receipt.count({
      where: {
        customerId: user.id,
        paid: false,
        service: {
          status: 'approved'
        }
      }
    })

    return NextResponse.json({ count })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch receipt count' }, { status: 500 })
  }
}
