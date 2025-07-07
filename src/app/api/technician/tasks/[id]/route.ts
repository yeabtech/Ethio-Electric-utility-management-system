import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

// Backend code

export async function GET(request: NextRequest) {
    const { pathname } = new URL(request.url)
    const parts = pathname.split('/')
    const clerkUserId = parts[parts.length - 1]  // last segment
  
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
  
      // Fetch all tasks for this technician
      const tasks = await prisma.task.findMany({
        where: { technicianId: technician.id },
        include: {
          service: { select: { serviceType: true, metadata: true } },
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
          receipt: { select: { grandTotal: true } },
          report: {
            select: {
              id: true,
              status: true,
              template: { select: { title: true, fields: true } },
              data: true,
              attachments: true
            }
          }
        },
        orderBy: { scheduledAt: 'asc' }
      })
  
      // Add full customer name by combining first and last names
      const tasksWithCustomerNames = tasks.map(task => {
        const verification = task.customer.verification[0];  // Assuming first verification entry
        const customerName = `${verification.firstName} ${verification.lastName}`;
        
        return {
          ...task,
          customerName,  // Add the combined name
        };
      });
  
      return NextResponse.json(tasksWithCustomerNames)
    } catch (err) {
      console.error(err)
      return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
    }
  }
  