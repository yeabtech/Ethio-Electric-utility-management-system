// src/app/api/cso/services/approved/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const subCity = searchParams.get('subCity')
  const woreda = searchParams.get('woreda')
 

  const verificationFilter: any = {}
if (subCity) verificationFilter.subCity = subCity
if (woreda) verificationFilter.woreda = woreda
  try {
    const services = await prisma.serviceApplication.findMany({
        where: { 
          status: 'approved',
          receipt: {
            status: 'approved'
          },
          user: {
            verification: {
              some: verificationFilter
            }
          },
          NOT: {
            task: {
              isNot: null
            }
          }
        },
        include: {
          user: {
            select: {
              verification: {
                select: {
                  firstName: true,
                  lastName: true,
                  subCity: true,
                  woreda: true,
                  kebele: true,
                  homeNumber: true
                }
              }
            }
          },
          receipt: {
            select: {
              grandTotal: true
            }
          }
        }
      })
      

    return NextResponse.json(services)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch approved services' },
      { status: 500 }
    )
  }
}