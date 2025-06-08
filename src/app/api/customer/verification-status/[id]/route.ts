// src/app/api/cso/verification-status/[id]/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id

    // Find the latest verification status for the given user
    const verification = await prisma.customerVerification.findFirst({
      where: { userId },
      select: { status: true, rejectionReason: true }
    })

    // If no verification record is found, log and return 404
    if (!verification) {
      console.log(`No verification found for userId: ${userId}`)
      return NextResponse.json({ status: 'rejected', message: 'Verification record not found.' }, { status: 404 })
    }

    // Map the status to match the frontend expectations
    let mappedStatus = 'rejected'; // Default to rejected
    if (verification.status === 'NotVerified') {
      mappedStatus = 'rejected';
    } else if (verification.status === 'Verified') {
      mappedStatus = 'approved';
    } else if (verification.status === 'Pending') {
      mappedStatus = 'pending';
    }

    return NextResponse.json({
      status: mappedStatus,
      rejectionReason: verification.rejectionReason || null
    })
  } catch (error) {
    console.error("Error fetching verification status:", error)
    return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 })
  }
}
