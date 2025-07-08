import { NextRequest, NextResponse } from 'next/server'
import { clerkClient } from '@clerk/nextjs/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const clerkUserId = searchParams.get('clerkUserId')
  if (!clerkUserId) {
    return NextResponse.json({ error: 'Missing clerkUserId' }, { status: 400 })
  }
  try {
    const user = await (await clerkClient()).users.getUser(clerkUserId)
    return NextResponse.json({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.emailAddresses?.[0]?.emailAddress || ''
    })
  } catch (err) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }
} 