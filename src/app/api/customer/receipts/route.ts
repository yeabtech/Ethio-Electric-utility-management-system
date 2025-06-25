import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'

const ALLOWED_STATUSES = ['pending', 'approved', 'rejected'] as const
type ReceiptStatus = (typeof ALLOWED_STATUSES)[number]

export async function GET(req: Request) {
  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) {
    return NextResponse.json([], { status: 401 })
  }

  // Map Clerk ID to your internal user.id
  const user = await prisma.user.findUnique({
    where: { clerkUserId },
    select: { id: true }
  })

  if (!user) {
    return NextResponse.json([], { status: 404 })
  }

  const url = new URL(req.url)
  const statusParam = url.searchParams.get('status')
  const isValidStatus = ALLOWED_STATUSES.includes(statusParam as ReceiptStatus)
  const status = isValidStatus ? (statusParam as ReceiptStatus) : undefined

  try {
    const receipts = await prisma.receipt.findMany({
      where: {
        customerId: user.id, // Use internal user.id
        ...(status ? { status } : {})
      },
      select: {
        id: true,
        status: true,
        connectionType: true,
        voltageLevel: true,
        totalAmount: true,
        grandTotal: true,
        createdAt: true,
        paid: true,
        paymentDate: true,
        txRef: true,
        service: {
          select: {
            serviceType: true,
            category: true,
            status: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(receipts)
  } catch (error) {
    console.error('Error fetching receipts:', error)
    return NextResponse.json({ error: 'Failed to fetch receipts' }, { status: 500 })
  }
}
