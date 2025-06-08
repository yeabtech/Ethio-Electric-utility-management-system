import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

    return NextResponse.json({ 
      success: true,
      employees
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