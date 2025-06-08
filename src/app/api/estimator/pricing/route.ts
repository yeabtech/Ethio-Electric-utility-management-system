// src/app/api/estimator/pricing/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PrismaClient } from '@prisma/client'


export async function GET() {
  try {
    const pricingTiers = await prisma.connectionPricing.findMany()
    const voltageRates = await prisma.voltageRate.findMany()

    // Transform pricing tiers into nested structure
    const transformedTiers = pricingTiers.reduce((acc, curr) => {
      const existing = acc.find(t => t.connectionType === curr.connectionType)
      if (existing) {
        existing.voltages[curr.voltageLevel] = curr.cost
      } else {
        acc.push({
          connectionType: curr.connectionType,
          voltages: { [curr.voltageLevel]: curr.cost }
        })
      }
      return acc
    }, [] as any[])

    return NextResponse.json({
      pricingTiers: transformedTiers,
      voltageRates
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch pricing data' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const { pricingTiers, voltageRates } = await req.json()

    // Update connection pricing
    const connectionUpdates = pricingTiers.flatMap((tier: any) => 
      Object.entries(tier.voltages).map(([voltage, cost]) => ({
        connectionType: tier.connectionType,
        voltageLevel: voltage,
        cost: Number(cost)
      }))
    )

    await prisma.$transaction([
      prisma.connectionPricing.deleteMany(),
      prisma.connectionPricing.createMany({
        data: connectionUpdates
      }),
      prisma.voltageRate.deleteMany(),
      prisma.voltageRate.createMany({
        data: voltageRates.map((vr: any) => ({
          voltage: vr.voltage,
          rate: Number(vr.rate)
        }))
      })
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to save pricing' },
      { status: 500 }
    )
  }
}