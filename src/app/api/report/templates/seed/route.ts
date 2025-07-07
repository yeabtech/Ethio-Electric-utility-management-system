import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    // Check if templates already exist
    const existingTemplates = await prisma.reportTemplate.findMany({
      where: { category: 'technical' }
    })

    if (existingTemplates.length > 0) {
      return NextResponse.json({ message: 'Templates already exist' })
    }

    // Create default report templates
    const templates = await Promise.all([
      prisma.reportTemplate.create({
        data: {
          title: 'Standard Task Completion Report',
          description: 'Standard report template for completed tasks',
          category: 'technical',
          fields: [
            {
              name: 'work_summary',
              type: 'textarea',
              label: 'Work Summary',
              required: true
            },
            {
              name: 'materials_used',
              type: 'textarea',
              label: 'Materials Used',
              required: false
            },
            {
              name: 'issues_encountered',
              type: 'textarea',
              label: 'Issues Encountered',
              required: false
            },
            {
              name: 'recommendations',
              type: 'textarea',
              label: 'Recommendations',
              required: false
            },
            {
              name: 'completion_status',
              type: 'select',
              label: 'Completion Status',
              required: true,
              options: ['Fully Completed', 'Partially Completed', 'Requires Follow-up']
            }
          ],
          createdBy: 'system' // You might want to use an actual user ID
        }
      }),
      prisma.reportTemplate.create({
        data: {
          title: 'Detailed Technical Report',
          description: 'Comprehensive technical report with detailed analysis',
          category: 'technical',
          fields: [
            {
              name: 'technical_analysis',
              type: 'textarea',
              label: 'Technical Analysis',
              required: true
            },
            {
              name: 'equipment_used',
              type: 'text',
              label: 'Equipment Used',
              required: true
            },
            {
              name: 'safety_measures',
              type: 'textarea',
              label: 'Safety Measures Taken',
              required: true
            },
            {
              name: 'quality_check',
              type: 'select',
              label: 'Quality Check Result',
              required: true,
              options: ['Passed', 'Failed', 'Conditional Pass']
            },
            {
              name: 'next_steps',
              type: 'textarea',
              label: 'Next Steps Required',
              required: false
            }
          ],
          createdBy: 'system'
        }
      })
    ])

    return NextResponse.json({ 
      message: 'Templates created successfully',
      templates 
    })
  } catch (error) {
    console.error('Error seeding templates:', error)
    return NextResponse.json(
      { error: 'Failed to seed templates' },
      { status: 500 }
    )
  }
} 