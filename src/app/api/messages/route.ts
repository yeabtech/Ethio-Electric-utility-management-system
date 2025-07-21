import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Helper to get the current user (mocked as manager for now)
async function getCurrentUserId() {
  // TODO: Replace with real auth
  // For demo, return a fixed manager user ID
  return process.env.EMPLOYEE_USER_ID || process.env.MANAGER_USER_ID || 'employee-demo-id';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { senderId, subject, content, recipients, attachments } = body;
    if (!senderId || !recipients || recipients.length === 0 || !content) {
      return NextResponse.json({ success: false, error: 'Missing sender, recipient, or content.' }, { status: 400 });
    }
    // Create message
    const message = await prisma.message.create({
      data: {
        senderId,
        subject,
        content,
        attachments: {
          create: (attachments || []).map((att: any) => ({
            url: att.url,
            name: att.name,
            type: att.type || '',
            size: att.size || 0,
          })),
        },
        recipients: {
          create: recipients.map((recipientId: string) => ({
            recipientId,
          })),
        },
      },
      include: {
        attachments: true,
        recipients: true,
      },
    });
    return NextResponse.json({ success: true, message });
  } catch (error: any) {
    console.error('Error sending message:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to send message.' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const isInbox = url.searchParams.get('inbox') === '1';
    const userId = await getCurrentUserId();
    if (isInbox) {
      // Fetch messages received by the current user
      const recips = await prisma.messageRecipient.findMany({
        where: { recipientId: userId },
        include: {
          message: {
            include: {
              attachments: true,
              sender: true,
            },
          },
        },
        orderBy: { message: { sentAt: 'desc' } },
      });
      const messages = recips.map((r) => ({
        id: r.message.id,
        subject: r.message.subject,
        content: r.message.content,
        sentAt: r.message.sentAt,
        attachments: r.message.attachments.map((a) => ({ name: a.name, url: a.url })),
        sender: r.message.sender ? { name: r.message.sender.email, email: r.message.sender.email } : undefined,
        read: r.read,
      }));
      return NextResponse.json({ success: true, messages });
    } else {
      // Sent messages (as before)
      const senderId = userId;
      const messages = await prisma.message.findMany({
        where: { senderId },
        orderBy: { sentAt: 'desc' },
        include: {
          attachments: true,
          recipients: {
            include: {
              recipient: true,
            },
          },
        },
      });
      // Format recipients for UI
      const formatted = messages.map((msg) => ({
        id: msg.id,
        subject: msg.subject,
        content: msg.content,
        sentAt: msg.sentAt,
        attachments: msg.attachments.map((a) => ({ name: a.name, url: a.url })),
        recipients: msg.recipients.map((r) => ({
          id: r.recipientId,
          name: r.recipient?.email || r.recipientId,
          read: r.read,
        })),
      }));
      return NextResponse.json({ success: true, messages: formatted });
    }
  } catch (error: any) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch messages.' }, { status: 500 });
  }
} 