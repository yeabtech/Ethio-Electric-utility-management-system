// src/app/api/customer/verify/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { clerkClient } from '@clerk/clerk-sdk-node'
import { z } from 'zod'

// Updated validation schema for UploadThing URLs
const verificationSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  gender: z.enum(['male', 'female', 'other']),
  dateOfBirth: z.string().refine(val => !isNaN(Date.parse(val)), "Invalid date format"),
  mobileNumber: z.string().regex(/^\+251[0-9]{9}$/, "Valid Ethiopian mobile number required (+251...)"),
  idType: z.enum(['national_id', 'passport', 'driving_license']),
  idNumber: z.string().min(4, "ID number must be at least 4 characters"),
  region: z.string().min(2, "Region is required"),
  subCity: z.string().min(2, "Sub-city is required"),
  woreda: z.string().min(1, "Woreda is required"),
  kebele: z.string().min(1, "Kebele is required"),
  homeNumber: z.string().min(1, "Home number is required"),
  nationality: z.string().min(2, "Nationality is required"),
  personalPhoto: z.string().url().min(1),
  idPhotoFront: z.string().url().min(1),
  idPhotoBack: z.string().url().optional()
})

export async function POST(req: Request) {
  try {
    const requestData = await req.json()
    const validationResult = verificationSchema.safeParse(requestData)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.flatten()
        },
        { status: 400 }
      )
    }

    const { userId: clerkUserId, dateOfBirth, ...data } = validationResult.data

    // Find the user in our database
    const localUser = await prisma.user.findUnique({
      where: { clerkUserId }
    })

    if (!localUser) {
      return NextResponse.json({ error: 'User not found in system' }, { status: 404 })
    }

    // Check if files are valid URLs (no longer checking local files)
    const filesToCheck = [
      data.personalPhoto,
      data.idPhotoFront,
      ...(data.idPhotoBack ? [data.idPhotoBack] : [])
    ]

    for (const fileUrl of filesToCheck) {
      try {
        new URL(fileUrl) // Will throw if invalid URL
      } catch {
        return NextResponse.json(
          { error: `Invalid file URL: ${fileUrl}` },
          { status: 400 }
        )
      }
    }

    // Verify user exists in Clerk
    const clerkUser = await clerkClient.users.getUser(clerkUserId)
    if (!clerkUser) {
      return NextResponse.json({ error: 'User not found in authentication system' }, { status: 404 })
    }

    // Check for existing verification
    const existingVerification = await prisma.customerVerification.findFirst({
      where: { userId: localUser.id },
      orderBy: { createdAt: 'desc' }
    })

    let verification

    if (existingVerification?.status === 'rejected') {
      // Update the rejected verification
      verification = await prisma.customerVerification.update({
        where: { id: existingVerification.id },
        data: {
          ...data,
          dateOfBirth: new Date(dateOfBirth),
          status: 'pending',
          rejectionReason: null,
          updatedAt: new Date()
        }
      })
    } else if (existingVerification) {
      // Prevent resubmission if already submitted
      return NextResponse.json(
        {
          error: 'Verification already submitted',
          status: existingVerification.status,
          verificationId: existingVerification.id
        },
        { status: 409 }
      )
    } else {
      // First-time submission
      verification = await prisma.customerVerification.create({
        data: {
          userId: localUser.id,
          dateOfBirth: new Date(dateOfBirth),
          ...data,
          status: 'pending'
        }
      })
    }

    // Update Clerk metadata
    await clerkClient.users.updateUserMetadata(clerkUserId, {
      publicMetadata: {
        ...clerkUser.publicMetadata,
        isVerified: false,
        verificationId: verification.id,
        verificationStatus: 'pending',
        lastUpdated: new Date().toISOString()
      }
    })

    return NextResponse.json({
      success: true,
      verificationId: verification.id,
      status: 'pending'
    })
  } catch (error: any) {
    console.error('[Verification] Final error handler:', error)
    return NextResponse.json(
      {
        error: error.message || 'Submission failed',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}