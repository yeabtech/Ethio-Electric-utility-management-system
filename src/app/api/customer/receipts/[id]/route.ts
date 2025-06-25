// src/app/api/customer/receipts/[id]/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'

interface ReceiptWithRelations {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  connectionType: string;
  voltageLevel: string;
  baseCost: number;
  voltageRate: number;
  taxAmount: number;
  grandTotal: number;
  paid: boolean;
  paymentDate: Date | null;
  txRef: string | null;
  service: {
    serviceType: string;
    category: string;
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Fetching receipt with ID:', params.id);
    
    const { userId: clerkUserId } = await auth();
    console.log('Authenticated Clerk user ID:', clerkUserId);
    
    if (!clerkUserId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Map Clerk userId to internal user.id
    const user = await prisma.user.findUnique({
      where: { clerkUserId },
      select: { id: true }
    });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found in system' },
        { status: 404 }
      );
    }

    const receipt = await prisma.receipt.findUnique({
      where: { 
        id: params.id,
        customerId: user.id // Use internal user.id
      },
      include: {
        service: {
          select: {
            serviceType: true,
            category: true
          }
        }
      }
    })

    console.log('Found receipt:', receipt);

    if (!receipt) {
      return NextResponse.json(
        { error: 'Receipt not found' },
        { status: 404 }
      )
    }

    // Transform the data to match the frontend interface
    const transformedReceipt = {
      id: receipt.id,
      status: receipt.status,
      createdAt: receipt.createdAt,
      connectionType: receipt.connectionType,
      voltageLevel: receipt.voltageLevel,
      baseCost: receipt.baseCost,
      voltageRate: receipt.voltageRate,
      taxAmount: receipt.taxAmount,
      grandTotal: receipt.grandTotal,
      paid: Boolean(receipt.paid),
      paymentDate: receipt.paymentDate,
      txRef: receipt.txRef
    }

    console.log('Transformed receipt:', transformedReceipt);

    return NextResponse.json(transformedReceipt)
  } catch (error) {
    console.error('Detailed error:', error);
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return NextResponse.json(
      { error: 'Failed to fetch receipt', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
