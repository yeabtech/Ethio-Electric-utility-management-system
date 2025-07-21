import { NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';

export async function GET() {
  try {
    const users = await clerkClient.users.getUserList();
    return NextResponse.json({ users });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
} 