import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { currentUser } from '@clerk/nextjs/server';

export async function GET(request: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the CSO's location
    const csoUser = await prisma.user.findFirst({
      where: {
        clerkUserId: user.id,
      },
      include: {
        employeeInfo: true,
      },
    });

    if (!csoUser?.employeeInfo) {
      return NextResponse.json({ error: 'CSO location not found' }, { status: 404 });
    }

    // Fetch approved customers in the same location
    const customers = await prisma.customerVerification.findMany({
      where: {
        status: "approved",
        subCity: csoUser.employeeInfo.subCity,
        woreda: csoUser.employeeInfo.woreda,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            isVerified: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      customers,
      csoLocation: {
        subCity: csoUser.employeeInfo.subCity,
        woreda: csoUser.employeeInfo.woreda,
      },
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
} 