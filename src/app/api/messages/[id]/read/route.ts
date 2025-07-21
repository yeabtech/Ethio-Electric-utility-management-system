import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Helper to get the current user (mocked for now)
async function getCurrentUserId() {
  // TODO: Replace with real auth
  return process.env.EMPLOYEE_USER_ID || 'employee-demo-id';
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const messageId = params.id;
    const userId = await getCurrentUserId();
    const updated = await prisma.messageRecipient.updateMany({
      where: { messageId, recipientId: userId },
      data: { read: true, readAt: new Date() },
    });
    if (updated.count === 0) {
      return NextResponse.json({ success: false, error: 'Message not found or not for this user.' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to mark as read.' }, { status: 500 });
  }
} 