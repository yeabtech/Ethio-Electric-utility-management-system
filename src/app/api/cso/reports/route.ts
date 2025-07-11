import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { clerkClient } from '@clerk/clerk-sdk-node'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const technicianName = searchParams.get('technicianName')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const status = searchParams.get('status')

    // Build where clause for filtering
    const whereClause: any = {
      template: {
        category: 'technical'
      }
    }

    // Add date filters
    if (startDate || endDate) {
      whereClause.submittedAt = {}
      if (startDate) {
        whereClause.submittedAt.gte = new Date(startDate)
      }
      if (endDate) {
        whereClause.submittedAt.lte = new Date(endDate)
      }
    }

    // Add status filter
    if (status && status !== 'all') {
      whereClause.status = status
    }

    // Note: Technician name filtering will be done after fetching Clerk data
    // since we need to fetch from Clerk to get the actual names

    const reports = await prisma.report.findMany({
      where: whereClause,
      include: {
        template: {
          select: {
            title: true,
            category: true
          }
        },
        submittedBy: {
          select: {
            id: true,
            clerkUserId: true,
            email: true,
            technician: {
              select: {
                id: true,
                subCity: true,
                woreda: true
              }
            }
          }
        },
        data: {
          select: {
            fieldName: true,
            fieldValue: true
          }
        },
        comments: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            author: {
              select: {
                email: true,
                clerkUserId: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        attachments: {
          select: {
            id: true,
            name: true,
            url: true,
            type: true
          }
        },
        task: {
          include: {
            service: {
              select: {
                serviceType: true,
                category: true
              }
            },
            customer: {
              include: {
                verification: {
                  select: {
                    firstName: true,
                    lastName: true,
                    subCity: true,
                    woreda: true
                  },
                  orderBy: { createdAt: 'desc' },
                  take: 1
                }
              }
            }
          }
        }
      },
      orderBy: {
        submittedAt: 'desc'
      }
    })

    // Process the data to fetch technician names from Clerk and flatten verification arrays
    let processedReports = await Promise.all(reports.map(async (report) => {
      let technicianName = 'Unknown Technician'
      
      // Fetch technician name from Clerk using clerkUserId
      if (report.submittedBy.clerkUserId) {
        try {
          const clerkUser = await clerkClient.users.getUser(report.submittedBy.clerkUserId)
          const firstName = clerkUser.firstName || ''
          const lastName = clerkUser.lastName || ''
          technicianName = `${firstName} ${lastName}`.trim() || 'Unknown Technician'
        } catch (error) {
          console.error('Error fetching technician from Clerk:', error)
          technicianName = 'Unknown Technician'
        }
      }
      
      // Process comments to fetch author names from Clerk
      const processedComments = await Promise.all(report.comments.map(async (comment) => {
        let authorName = 'Unknown User'
        
        if (comment.author.clerkUserId) {
          try {
            const clerkUser = await clerkClient.users.getUser(comment.author.clerkUserId)
            const firstName = clerkUser.firstName || ''
            const lastName = clerkUser.lastName || ''
            authorName = `${firstName} ${lastName}`.trim() || comment.author.email || 'Unknown User'
          } catch (error) {
            console.error('Error fetching comment author from Clerk:', error)
            authorName = comment.author.email || 'Unknown User'
          }
        }
        
        return {
          ...comment,
          authorName
        }
      }))
      
      const customerVerification = report.task?.customer.verification[0]
      
      return {
        ...report,
        technicianName,
        comments: processedComments,
        customerName: customerVerification
          ? `${customerVerification.firstName} ${customerVerification.lastName}`
          : 'Unknown Customer',
        customerLocation: customerVerification
          ? `${customerVerification.subCity}, Woreda ${customerVerification.woreda}`
          : 'Unknown Location'
      }
    }))

    // Apply technician name filter after fetching Clerk data
    if (technicianName) {
      processedReports = processedReports.filter(report => 
        report.technicianName.toLowerCase().includes(technicianName.toLowerCase())
      )
    }

    return NextResponse.json(processedReports)
  } catch (error) {
    console.error('Error fetching reports:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    )
  }
} 