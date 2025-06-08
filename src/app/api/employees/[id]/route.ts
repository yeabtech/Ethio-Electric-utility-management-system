import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { clerkClient } from '@clerk/clerk-sdk-node';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const employeeId = params.id;
    console.log('Attempting to delete employee:', employeeId);

    // Get the user to find their Clerk ID
    const user = await prisma.user.findUnique({
      where: { id: employeeId },
      select: { 
        clerkUserId: true,
        employeeInfo: true,
        technician: true
      }
    });

    if (!user) {
      console.log('Employee not found:', employeeId);
      return NextResponse.json(
        { success: false, error: 'Employee not found' },
        { status: 404 }
      );
    }

    // Delete related records first
    if (user.employeeInfo) {
      console.log('Deleting employee info for:', employeeId);
      await prisma.employeeInfo.delete({
        where: { userId: employeeId }
      });
    }

    if (user.technician) {
      console.log('Deleting technician record for:', employeeId);
      await prisma.technician.delete({
        where: { userId: employeeId }
      });
    }

    // Delete from Clerk
    try {
      console.log('Deleting from Clerk:', user.clerkUserId);
      await clerkClient.users.deleteUser(user.clerkUserId);
    } catch (clerkError: any) {
      console.error('Error deleting from Clerk:', clerkError);
      // Continue with database deletion even if Clerk deletion fails
    }

    // Delete from database
    console.log('Deleting from database:', employeeId);
    await prisma.user.delete({
      where: { id: employeeId }
    });

    console.log('Employee deleted successfully:', employeeId);
    return NextResponse.json({ 
      success: true,
      message: 'Employee deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting employee:', error);
    // Log the full error details
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack
    });
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to delete employee',
        details: error.meta || {}
      },
      { status: 500 }
    );
  }
} 