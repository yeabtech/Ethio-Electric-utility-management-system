import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { title, description, fields, createdBy } = await request.json()

    const template = await prisma.reportTemplate.create({
      data: {
        title,
        description,
        category: 'technical',
        fields,
        createdBy
      }
    })

    return NextResponse.json(template)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create report template' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const templates = await prisma.reportTemplate.findMany({
      where: {
        category: 'technical'
      },
      include: {
        creator: {
          select: {
            email: true
          }
        }
      }
    })

    return NextResponse.json(templates)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch report templates' },
      { status: 500 }
    )
  }
} 