// src/app/api/employee-info/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const clerkUserId = searchParams.get('userId')
  
    if (!clerkUserId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }
  
    try {
      const user = await prisma.user.findUnique({
        where: { clerkUserId },
      })
  
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
  
      const employeeInfo = await prisma.employeeInfo.findUnique({
        where: { userId: user.id },
        select: {
          subCity: true,
          woreda: true
        }
      })
  
      if (!employeeInfo) {
        return NextResponse.json({ error: 'Employee location not found' }, { status: 404 })
      }
  
      return NextResponse.json(employeeInfo)
    } catch (error) {
      console.error('Failed to fetch employee info:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
  