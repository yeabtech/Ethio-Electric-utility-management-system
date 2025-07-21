import { NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';

export async function GET() {
  try {
    // Fetch audit logs from Clerk
    const auditLogs = await clerkClient.auditLogs.getAuditLogs();
    return NextResponse.json(auditLogs);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
  }
} 