import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { clerkClient } from '@clerk/clerk-sdk-node'

export async function GET() {
  try {
    // Get all users who are not customers (estimator, cso, technician)
    const employees = await prisma.user.findMany({
      where: {
        NOT: {
          role: 'customer'
        }
      },
      include: {
        employeeInfo: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Enhance employees with Clerk data
    const enhancedEmployees = await Promise.all(
      employees.map(async (employee) => {
        const clerkUser = await clerkClient.users.getUser(employee.clerkUserId)
        return {
          ...employee,
          name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'N/A'
        }
      })
    )

    return NextResponse.json({ 
      success: true,
      employees: enhancedEmployees
    })
  } catch (error: any) {
    console.error('Error fetching employees:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to fetch employees'
      },
      { status: 500 }
    )
  }
} 