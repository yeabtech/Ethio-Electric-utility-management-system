// src/app/api/technician/tasks/[id]/status/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { status, reportData, templateId, submittedById, attachments } = await request.json()

  try {
    const task = await prisma.task.update({
      where: { id: params.id },
      data: {
        status,
        ...(status === 'in_progress' && { startedAt: new Date() }),
        ...(status === 'completed' && { 
          completedAt: new Date()
        })
      },
      include: {
        technician: true,
        report: {
          include: {
            data: true,
            attachments: true,
            template: true
          }
        }
      }
    })

    // If task is completed and report data is provided, create a report
    if (status === 'completed' && reportData && templateId && submittedById) {
      const report = await prisma.report.create({
        data: {
          templateId,
          submittedById,
          status: 'submitted',
          submittedAt: new Date(),
          data: {
            create: reportData.map((item: any) => ({
              fieldName: item.fieldName,
              fieldValue: item.fieldValue
            }))
          },
          attachments: {
            create: attachments?.map((attachment: any) => ({
              url: attachment.url,
              name: attachment.name,
              type: attachment.type,
              size: attachment.size
            })) || []
          }
        },
        include: {
          data: true,
          attachments: true,
          template: true
        }
      })

      // Link the report to the task
      await prisma.task.update({
        where: { id: params.id },
        data: { 
          report: {
            connect: { id: report.id }
          }
        }
      })
    }

    // If task is completed or cancelled, mark technician as available
    if (status === 'completed' || status === 'cancelled') {
      await prisma.technician.update({
        where: { id: task.technicianId },
        data: { status: 'available' }
      })
    }

    return NextResponse.json(task)
  } catch (error) {
    console.error('Error updating task status:', error)
    return NextResponse.json(
      { error: 'Failed to update task status' },
      { status: 500 }
    )
  }
}