import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { ReportCategory } from '@prisma/client'

export async function POST(request: Request) {
  try {
    const { title, description, category, fields } = await request.json()
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const user = await prisma.user.findUnique({ where: { clerkUserId } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    const template = await prisma.reportTemplate.create({
      data: {
        title,
        description,
        category,
        fields,
        createdBy: user.id
      },
      include: {
        creator: {
          select: {
            email: true
          }
        }
      }
    })
    return NextResponse.json(template)
  } catch (error) {
    console.error('Error creating report template:', error)
    return NextResponse.json(
      { error: 'Failed to create report template' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const whereClause = category ? { category: category as ReportCategory } : {}
    const templates = await prisma.reportTemplate.findMany({
      where: whereClause,
      include: {
        creator: {
          select: {
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    return NextResponse.json(templates)
  } catch (error) {
    console.error('Error fetching report templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch report templates' },
      { status: 500 }
    )
  }
} 