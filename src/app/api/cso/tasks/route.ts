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
    // Find all tasks for the given subCity and woreda
    const tasks = await prisma.task.findMany({
      where: {
        technician: {
          subCity,
          woreda
        }
      },
      include: {
        technician: {
          include: {
            user: {
              select: {
                email: true,
                clerkUserId: true,
                verification: {
                  select: {
                    firstName: true,
                    lastName: true
                  },
                  orderBy: { createdAt: 'desc' },
                  take: 1
                }
              }
            }
          }
        },
        customer: {
          select: {
            email: true,
            clerkUserId: true,
            verification: {
              select: {
                firstName: true,
                lastName: true,
                subCity: true,
                woreda: true
              },
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        },
        service: true,
        receipt: true
      },
      orderBy: { scheduledAt: 'desc' }
    })

    // Flatten verification arrays for technician and customer
    const result = tasks.map(task => ({
      ...task,
      technician: task.technician ? {
        ...task.technician,
        user: {
          ...task.technician.user,
          verification: task.technician.user.verification[0] || null
        }
      } : null,
      customer: task.customer ? {
        ...task.customer,
        verification: task.customer.verification[0] || null
      } : null
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to fetch tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}
