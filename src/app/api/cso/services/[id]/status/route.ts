import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(req: Request, { params }: { params: {id: string } }) {
  try {
    const { status, reason } = await req.json()
    const { id } =  await params

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 })
    }

    const updatedService = await prisma.serviceApplication.update({
      where: { id: id },
      data: {
        status,
        rejectionReason: reason ?? undefined, // ✅ Optional handling for reason
      },
    })

    return NextResponse.json(updatedService)
  } catch (error) {
    console.error('Failed to update service status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
