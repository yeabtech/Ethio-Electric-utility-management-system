import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Fetch single meter pricing by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const meterPricing = await prisma.meterPricing.findUnique({
      where: { id }
    });

    if (!meterPricing) {
      return NextResponse.json(
        { error: 'Meter pricing not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(meterPricing);
  } catch (error) {
    console.error('Error fetching meter pricing:', error);
    return NextResponse.json(
      { error: 'Failed to fetch meter pricing' },
      { status: 500 }
    );
  }
}

// PUT - Update meter pricing
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { meterType, price, description } = body;

    // Validation
    if (!meterType || !price || price <= 0) {
      return NextResponse.json(
        { error: 'Meter type and valid price are required' },
        { status: 400 }
      );
    }

    // Check if meter pricing exists
    const existingMeterPricing = await prisma.meterPricing.findUnique({
      where: { id }
    });

    if (!existingMeterPricing) {
      return NextResponse.json(
        { error: 'Meter pricing not found' },
        { status: 404 }
      );
    }

    // Check if meter type already exists (excluding current item)
    const duplicateMeterType = await prisma.meterPricing.findFirst({
      where: {
        meterType,
        id: { not: id }
      }
    });

    if (duplicateMeterType) {
      return NextResponse.json(
        { error: 'Meter type already exists' },
        { status: 409 }
      );
    }

    // Update meter pricing
    const updatedMeterPricing = await prisma.meterPricing.update({
      where: { id },
      data: {
        meterType,
        price: parseFloat(price),
        description: description || null
      }
    });

    return NextResponse.json(updatedMeterPricing);
  } catch (error) {
    console.error('Error updating meter pricing:', error);
    return NextResponse.json(
      { error: 'Failed to update meter pricing' },
      { status: 500 }
    );
  }
}

// DELETE - Delete meter pricing
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Check if meter pricing exists
    const existingMeterPricing = await prisma.meterPricing.findUnique({
      where: { id }
    });

    if (!existingMeterPricing) {
      return NextResponse.json(
        { error: 'Meter pricing not found' },
        { status: 404 }
      );
    }

    // Delete meter pricing
    await prisma.meterPricing.delete({
      where: { id }
    });

    return NextResponse.json(
      { message: 'Meter pricing deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting meter pricing:', error);
    return NextResponse.json(
      { error: 'Failed to delete meter pricing' },
      { status: 500 }
    );
  }
} 