import { NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';

export async function POST(req: Request) {
  try {
    const { userId, disable } = await req.json();
    if (!userId || typeof disable !== 'boolean') {
      return NextResponse.json({ error: 'userId and disable are required' }, { status: 400 });
    }
    await clerkClient.users.updateUser(userId, { disabled: disable });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
} 