//src/app/api/register/rouute.ts



import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { email, clerkUserId, role } = await req.json();

    if (!email || !clerkUserId) {
      return NextResponse.json(
        { error: 'Email and Clerk User ID are required' },
        { status: 400 }
      );
    }

    // Check if the user already exists
    const existingUser = await prisma.user.findUnique({
      where: { clerkUserId },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already registered' },
        { status: 409 } // Conflict error
      );
    }

    // Save to PostgreSQL
    const user = await prisma.user.create({
      data: {
        clerkUserId,
        email,
        role: role || 'customer',
      },
    });

    return NextResponse.json({ user }, { status: 201 }); // 201 Created
  } catch (error: any) {
    console.error('Registration failed:', error);

    if (error.code === 'P2002') {
      // Prisma unique constraint violation (duplicate clerkUserId)
      return NextResponse.json(
        { error: 'User with this Clerk ID or email already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Internal Server Error. Please try again later.' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

