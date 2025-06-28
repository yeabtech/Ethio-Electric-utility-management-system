import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Fetch all meter pricings
export async function GET() {
  try {
    const meterPricings = await prisma.meterPricing.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(meterPricings)
  } catch (error) {
    console.error('Error fetching meter pricings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch meter pricings' },
      { status: 500 }
    )
  }
}

// POST - Create new meter pricing
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { meterType, price, description } = body

    // Validation
    if (!meterType || !price || price <= 0) {
      return NextResponse.json(
        { error: 'Meter type and valid price are required' },
        { status: 400 }
      )
    }

    // Check if meter type already exists
    const existingMeterType = await prisma.meterPricing.findUnique({
      where: { meterType }
    })

    if (existingMeterType) {
      return NextResponse.json(
        { error: 'Meter type already exists' },
        { status: 409 }
      )
    }

    // Create new meter pricing
    const newMeterPricing = await prisma.meterPricing.create({
      data: {
        meterType,
        price: parseFloat(price),
        description: description || null
      }
    })

    return NextResponse.json(newMeterPricing, { status: 201 })
  } catch (error) {
    console.error('Error creating meter pricing:', error)
    return NextResponse.json(
      { error: 'Failed to create meter pricing' },
      { status: 500 }
    )
  }
} 