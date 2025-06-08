// src/app/api/technician/tasks/[id]/status/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { status, report } = await request.json()

  try {
    const task = await prisma.task.update({
      where: { id: params.id },
      data: {
        status,
        ...(status === 'in_progress' && { startedAt: new Date() }),
        ...(status === 'completed' && { 
          completedAt: new Date(),
          report
        })
      },
      include: {
        technician: true
      }
    })

    // If task is completed, mark technician as available
    if (status === 'completed') {
      await prisma.technician.update({
        where: { id: task.technicianId },
        data: { status: 'available' }
      })
    }

    return NextResponse.json(task)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update task status' },
      { status: 500 }
    )
  }
}