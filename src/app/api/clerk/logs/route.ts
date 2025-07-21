import { NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';

export async function GET() {
  try {
    // Clerk audit logs are only available on Enterprise plans
    if (!('getAuditLogs' in (clerkClient as any))) {
      return NextResponse.json({
        error: 'Clerk audit logs are only available on Clerk Enterprise plans.'
      }, { status: 403 });
    }
    // @ts-ignore: getAuditLogs may not exist on all plans
    const auditLogs = await (clerkClient as any).getAuditLogs();
    return NextResponse.json(auditLogs);
  } catch (error) {
    console.error('Clerk audit logs error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
} 