import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  const { serviceId, technicianId, scheduledAt, assignedById } = await request.json()

  try {
    // Verify service exists and is approved
    const service = await prisma.serviceApplication.findUnique({
      where: { id: serviceId },
      include: { receipt: true }
    })

    if (
      !service ||
      service.status !== 'approved' ||
      !service.receipt ||
      service.receipt.status !== 'approved'
    ) {
      return NextResponse.json(
        { error: 'Service not approved' },
        { status: 400 }
      )
    }

    // Verify technician is available
    const technician = await prisma.technician.findUnique({
      where: { id: technicianId }
    })

    if (!technician || technician.status !== 'available') {
      return NextResponse.json(
        { error: 'Technician not available' },
        { status: 400 }
      )
    }

    // Fetch internal user by Clerk userId (assignedById)
    const assignedByUser = await prisma.user.findUnique({
      where: { clerkUserId: assignedById }  // Assuming you have a field clerkUserId
    })

    if (!assignedByUser) {
      return NextResponse.json(
        { error: 'Assigned user not found' },
        { status: 400 }
      )
    }

    // Create task
    const task = await prisma.task.create({
      data: {
        technicianId,
        serviceId,
        receiptId: service.receipt.id,
        customerId: service.userId,
        assignedById: assignedByUser.id,  // Use internal user ID here
        scheduledAt: new Date(scheduledAt),
        status: 'assigned'
      }
    })

    // Update technician status
    await prisma.technician.update({
      where: { id: technicianId },
      data: { status: 'assigned' }
    })

    return NextResponse.json(task)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to assign task' },
      { status: 500 }
    )
  }
}
