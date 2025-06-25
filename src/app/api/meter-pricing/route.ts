import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const meterPricing = await prisma.meterPricing.findMany()
    return NextResponse.json(meterPricing)
  } catch (error) {
    console.error('Error fetching meter pricing:', error)
    return NextResponse.json(
      { error: 'Failed to fetch meter pricing' },
      { status: 500 }
    )
  }
} 