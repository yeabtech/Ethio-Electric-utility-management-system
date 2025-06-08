import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const subCity = searchParams.get('subCity')
  const woreda = searchParams.get('woreda')

  if (!subCity || !woreda) {
    return NextResponse.json(
      { error: 'Location parameters are required' },
      { status: 400 }
    )
  }

  try {
    const services = await prisma.serviceApplication.findMany({
      where: { 
        status: 'pending',
        user: {
          verification: {
            some: {  // ✅ this replaces "some" for one-to-one relation
              subCity,
              woreda
            }
          }
        }
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            
            verification: {
              select: {
                subCity: true,
                woreda: true,
                firstName: true,
                lastName: true,
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    })
    
    return NextResponse.json(services)
  } catch (error) {
    console.error('Failed to fetch services:', error)
    return NextResponse.json(
      { error: 'Failed to fetch service applications' },
      { status: 500 }
    )
  }
}
