// src/app/api/manager-register/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { clerkClient } from '@clerk/clerk-sdk-node'

export async function POST(req: Request) {
  const { email, password, firstName, lastName, username, role, subCity, woreda } = await req.json()

  try {
    // Create user in Clerk
    const clerkUser = await clerkClient.users.createUser({
      emailAddress: [email],
      password,
      firstName,
      lastName,
      username,
    })

    if (!clerkUser || !clerkUser.id) {
      throw new Error("Clerk user creation failed")
    }

    // Save user in PostgreSQL
    const user = await prisma.user.create({
      data: {
        clerkUserId: clerkUser.id,
        email,
        role,
      }
    })

    // Save employee info if role is not customer
    if (role !== 'customer') {
      await prisma.employeeInfo.create({
        data: {
          userId: user.id,
          subCity,
          woreda: String(woreda)
        }
      })
    }

    return NextResponse.json({ 
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    })
  } catch (error: any) {
    console.error('Registration failed:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Registration failed',
        details: error.errors || {}
      },
      { status: 500 }
    )
  }
}