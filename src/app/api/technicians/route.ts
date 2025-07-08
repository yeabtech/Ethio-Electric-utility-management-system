import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { TechnicianStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const subCity = searchParams.get('subCity') || undefined
  const woreda = searchParams.get('woreda') || undefined
  const statusParam = searchParams.get('status') || undefined

  // Validate status to ensure it's one of the enum values
  const isValidStatus = (value: any): value is TechnicianStatus =>
    ['available', 'assigned', 'on_leave'].includes(value)

  const status = isValidStatus(statusParam) ? statusParam : undefined

  try {
    const technicians = await prisma.technician.findMany({
      where: {
        ...(subCity && { subCity }),
        ...(woreda && { woreda }),
        ...(status && { status }),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            clerkUserId: true,
            verification: {
                select: {
                  firstName: true,
                  lastName: true,}}
          },
        },
      },
    })

    return NextResponse.json(technicians)
  } catch (error) {
    console.error('Error fetching technicians:', error)
    return NextResponse.json(
      { error: 'Failed to fetch technicians' },
      { status: 500 }
    )
  }
}
