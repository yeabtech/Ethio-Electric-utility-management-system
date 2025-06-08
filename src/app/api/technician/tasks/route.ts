// src/app/api/technician/tasks/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
        return NextResponse.json(
            { error: 'Missing userId parameter' },
            { status: 400 }
        )
    }

    try {
        // Look for technician with the provided userId
        const technician = await prisma.technician.findUnique({
            where: { userId }, // Look for technician using the userId from Clerk
            select: { id: true }
        })

        if (!technician) {
            return NextResponse.json(
                { error: 'Technician not found' },
                { status: 404 }
            )
        }

        // Fetch the tasks assigned to the technician
        const tasks = await prisma.task.findMany({
            where: { technicianId: technician.id },
            include: {
                service: {
                    select: {
                        serviceType: true,
                        metadata: true
                    }
                },
                customer: {
                    select: {
                        email: true,
                        verification: {
                            select: {
                                firstName: true,
                                lastName: true,
                                subCity: true,
                                woreda: true,
                                kebele: true,
                                homeNumber: true,
                                mobileNumber: true
                            }
                        }
                    }
                },
                receipt: {
                    select: {
                        grandTotal: true
                    }
                }
            },
            orderBy: { scheduledAt: 'asc' }
        })

        return NextResponse.json(tasks)
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to fetch tasks' },
            { status: 500 }
        )
    }
}
