import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: { taskId: string } }
) {
  try {
    const body = await request.json()
    console.log('Incoming POST /api/report/task/[taskId] body:', body)
    const { templateId, submittedById, data, attachments } = body

    // Look up the internal user ID from Clerk user ID
    const userRecord = await prisma.user.findUnique({
      where: { clerkUserId: submittedById }
    })
    if (!userRecord) {
      return NextResponse.json(
        { error: 'User not found in database.' },
        { status: 400 }
      )
    }

    // Check if the task already has a report
    const existingTask = await prisma.task.findUnique({
      where: { id: params.taskId },
      select: { reportId: true }
    })
    console.log('Existing task reportId:', existingTask?.reportId)
    if (existingTask?.reportId) {
      console.warn('Attempted to submit a report for a task that already has a report:', params.taskId)
      return NextResponse.json(
        { error: 'A report has already been submitted for this task.' },
        { status: 400 }
      )
    }

    // Create the report
    const report = await prisma.report.create({
      data: {
        templateId,
        submittedById: userRecord.id,
        status: 'submitted',
        submittedAt: new Date(),
        data: {
          create: data.map((item: any) => ({
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
    console.log('Created report:', report.id)

    // Link the report to the task using the correct relation
    const updatedTask = await prisma.task.update({
      where: { id: params.taskId },
      data: { 
        report: {
          connect: { id: report.id }
        }
      }
    })
    console.log('Linked report to task:', updatedTask.id)

    return NextResponse.json(report)
  } catch (error) {
    console.error('Error creating task report:', error)
    if (error instanceof Error && error.stack) {
      console.error('Stack trace:', error.stack)
    }
    return NextResponse.json(
      { error: 'Failed to create task report', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

export async function GET(
  request: Request,
  { params }: { params: { taskId: string } }
) {
  try {
    const task = await prisma.task.findUnique({
      where: { id: params.taskId },
      include: {
        report: {
          include: {
            data: true,
            attachments: true,
            template: true,
            comments: {
              include: {
                author: {
                  select: {
                    email: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(task.report)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch task report' },
      { status: 500 }
    )
  }
} 