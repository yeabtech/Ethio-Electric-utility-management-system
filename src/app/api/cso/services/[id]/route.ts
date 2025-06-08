// src/app/api/cso/services/[id]/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const serviceId = params.id

    const service = await prisma.serviceApplication.findUnique({
      where: { id: serviceId },
      include: {
        user: {
          include: {
            verification: {
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        }
      }
    })

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    // flatten the verification to just one object if present
    const verification = service.user.verification[0] || null

    return NextResponse.json({
      ...service,
      user: {
        ...service.user,
        verification
      }
    })
  } catch (error) {
    console.error('Failed to fetch service:', error)
    return NextResponse.json(
      { error: 'Failed to fetch service' },
      { status: 500 }
    )
  }
}
