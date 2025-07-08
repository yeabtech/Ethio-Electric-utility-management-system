import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params
  const { technicianId } = await req.json()
  if (!technicianId) {
    return NextResponse.json({ error: 'Technician ID is required' }, { status: 400 })
  }
  try {
    // Find the task
    const task = await prisma.task.findUnique({ where: { id }, include: { report: true } })
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }
    // Delete the report if exists
    if (task.reportId) {
      await prisma.report.delete({ where: { id: task.reportId } })
    }
    // Update the task
    await prisma.task.update({
      where: { id },
      data: {
        technicianId,
        status: 'assigned',
        reportId: null,
      },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to re-assign task' }, { status: 500 })
  }
} 