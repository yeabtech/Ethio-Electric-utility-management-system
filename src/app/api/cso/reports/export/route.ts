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

    // Process the data to fetch names from Clerk
    const processedReports = await Promise.all(reports.map(async (report) => {
      let technicianName = 'Unknown Technician'
      
      // Fetch technician name from Clerk
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
      
      // Process comments
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
    let filteredReports = processedReports
    if (technicianName) {
      filteredReports = processedReports.filter(report => 
        report.technicianName.toLowerCase().includes(technicianName.toLowerCase())
      )
    }

    // Convert to CSV format
    const csvHeaders = [
      'Report ID',
      'Template Title',
      'Status',
      'Priority',
      'Submitted At',
      'Technician Name',
      'Customer Name',
      'Customer Location',
      'Service Type',
      'Service Category',
      'Report Data',
      'Comments',
      'Attachments Count'
    ]

    const csvRows = filteredReports.map(report => {
      // Format report data as key-value pairs
      const reportData = report.data.map(item => 
        `${item.fieldName}: ${item.fieldValue}`
      ).join('; ')

      // Format comments as author and content
      const comments = report.comments.map(comment => 
        `${comment.authorName}: ${comment.content}`
      ).join('; ')

      return [
        report.id,
        report.template.title,
        report.status,
        report.priority,
        report.submittedAt ? new Date(report.submittedAt).toLocaleString() : 'N/A',
        report.technicianName,
        report.customerName,
        report.customerLocation,
        report.task?.service.serviceType || 'N/A',
        report.task?.service.category || 'N/A',
        reportData,
        comments,
        report.attachments.length.toString()
      ]
    })

    // Create CSV content
    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => 
        row.map(cell => 
          // Escape commas and quotes in CSV
          typeof cell === 'string' && (cell.includes(',') || cell.includes('"') || cell.includes('\n'))
            ? `"${cell.replace(/"/g, '""')}"`
            : cell
        ).join(',')
      )
    ].join('\n')

    // Set response headers for CSV download
    const filename = `technician-reports-${new Date().toISOString().split('T')[0]}.csv`
    
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error exporting reports:', error)
    return NextResponse.json(
      { error: 'Failed to export reports' },
      { status: 500 }
    )
  }
} 