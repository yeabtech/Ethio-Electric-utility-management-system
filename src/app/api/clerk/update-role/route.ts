import { NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';

export async function POST(req: Request) {
  try {
    const { userId, newRole } = await req.json();
    if (!userId || !newRole) {
      return NextResponse.json({ error: 'userId and newRole are required' }, { status: 400 });
    }
    await clerkClient.users.updateUser(userId, {
      publicMetadata: { role: newRole },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
  }
} 