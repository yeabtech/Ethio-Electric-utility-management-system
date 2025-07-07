// src/app/api/technician/tasks/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'
import { clerkClient } from '@clerk/clerk-sdk-node'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const clerkUserId = searchParams.get('clerkUserId')

    if (!clerkUserId) {
        return NextResponse.json({ error: 'Missing clerk user ID' }, { status: 400 })
    }

    try {
        // Find the user associated with the clerkUserId
        const user = await prisma.user.findUnique({
            where: { clerkUserId: clerkUserId },
            select: { id: true }  // Get the User ID
        })
        
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Fetch the technician by the user ID
        const technician = await prisma.technician.findUnique({
            where: { userId: user.id }, // Lookup the technician by the associated user
            select: { id: true } // Ensure we have technician's ID for the task lookup
        })
        
        if (!technician) {
            return NextResponse.json({ error: 'Technician not found' }, { status: 404 })
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
                },
                report: {
                    include: {
                        data: true,
                        attachments: true,
                        template: true
                    }
                },
                assignedBy: {
                    select: {
                        email: true,
                        clerkUserId: true
                    }
                }
            },
            orderBy: { scheduledAt: 'desc' },
            take: 10
        })

        // Fetch Clerk names for assignedBy
        const tasksWithNames = await Promise.all(tasks.map(async (task) => {
            let assignedByFirstName = '';
            let assignedByLastName = '';
            if (task.assignedBy?.clerkUserId) {
                try {
                    const clerkUser = await clerkClient.users.getUser(task.assignedBy.clerkUserId);
                    assignedByFirstName = clerkUser.firstName || '';
                    assignedByLastName = clerkUser.lastName || '';
                } catch (e) {}
            }
            return {
                ...task,
                assignedByFirstName,
                assignedByLastName
            };
        }));

        return NextResponse.json(tasksWithNames)
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to fetch tasks' },
            { status: 500 }
        )
    }
}
