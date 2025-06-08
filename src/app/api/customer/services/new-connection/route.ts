// src/app/api/customer/services/new-connection/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { clerkClient } from '@clerk/clerk-sdk-node'
import { getAuth } from '@clerk/nextjs/server'

interface ClerkUserMetadata {
  verificationStatus?: 'approved' | 'pending' | 'rejected';
  lastServiceRequest?: string;
  pendingApplications?: Array<{
    id: string;
    type: string;
    date: string;
  }>;
}

export async function POST(req: Request) {
  try {
    const { userId: clerkUserId } = getAuth(req as any); // Get Clerk userId from auth session
    
    if (!clerkUserId) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      )
    }

    const { 
      userId,
      connectionType,
      voltageLevel,
      propertyType,
      plotNumber,
      estimatedLoad,
      requiredDate,
      specialRequirements,
      documents,
      estimatedCost
    } = await req.json()

    // Verify user is approved
    const clerkUser = await clerkClient.users.getUser(clerkUserId)
    const publicMetadata = clerkUser.publicMetadata as ClerkUserMetadata
    
    if (publicMetadata.verificationStatus !== 'approved') {
      return NextResponse.json(
        { error: 'User verification required' },
        { status: 403 }
      )
    }

    // Find or create the corresponding User in your database
    const user = await prisma.user.upsert({
      where: { clerkUserId },
      create: {
        clerkUserId,
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        role: 'customer',
        isVerified: publicMetadata.verificationStatus === 'approved'
      },
      update: {}
    })

    // Safely convert documents to string array
    const documentUrls = documents 
      ? Object.values(documents).filter((url): url is string => typeof url === 'string')
      : [];

    // Create service application using the User's id (not Clerk userId)
    const application = await prisma.serviceApplication.create({
      data: {
        userId: user.id, // Use the User's id from your database
        category: 'NEW_CONNECTIONS',
        serviceType: connectionType,
        status: 'pending',
        documents: documentUrls,
        metadata: {
          voltageLevel,
          propertyType,
          plotNumber,
          estimatedLoad,
          requiredDate,
          specialRequirements,
          estimatedCost
        }
      }
    })

      // Create receipt
      await prisma.receipt.create({
        data: {
          serviceId: application.id,
          customerId: user.id, // ✅ use the internal DB ID
          connectionType,
          voltageLevel,
          baseCost: estimatedCost.baseCost,
          voltageRate: estimatedCost.voltageRate,
          taxAmount: estimatedCost.tax,
          totalAmount: estimatedCost.baseCost + estimatedCost.voltageRate,
          grandTotal: estimatedCost.total,
          status: 'pending'
        }
      })
      

    // Update Clerk metadata
    await clerkClient.users.updateUserMetadata(clerkUserId, {
      publicMetadata: {
        ...publicMetadata,
        lastServiceRequest: new Date().toISOString(),
        pendingApplications: [
          ...(publicMetadata.pendingApplications || []),
          {
            id: application.id,
            type: 'NEW_CONNECTION',
            date: new Date().toISOString()
          }
        ]
      }
    })

    return NextResponse.json({ 
      success: true,
      applicationId: application.id
    })

  } catch (error) {
    console.error('New connection application failed:', error)
    return NextResponse.json(
      { error: 'Failed to submit new connection application' },
      { status: 500 }
    )
  }
}

export async function GET(req: Request) {
  try {
    const { userId: clerkUserId } = getAuth(req as any); // Get Clerk userId from auth session
    
    if (!clerkUserId) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    // Find the corresponding User in your database
    const user = await prisma.user.findUnique({
      where: { clerkUserId }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      );
    }

    // Fetch pending applications for the user
    const applications = await prisma.serviceApplication.findMany({
      where: {
        userId: user.id, // Use the User's id from your database
        category: 'NEW_CONNECTIONS',
        status: 'pending',
      },
      select: {
        id: true,
        serviceType: true,
        status: true,
        documents: true,
        metadata: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      applications,
    });

  } catch (error) {
    console.error('Failed to fetch new connection applications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch new connection applications' },
      { status: 500 }
    );
  }
}