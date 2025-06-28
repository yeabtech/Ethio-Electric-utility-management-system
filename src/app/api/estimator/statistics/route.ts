import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get service statistics by category
    const serviceStats = await prisma.serviceApplication.groupBy({
      by: ['category'],
      _count: {
        id: true
      }
    });

    // Get service statistics by service type
    const serviceTypeStats = await prisma.serviceApplication.groupBy({
      by: ['serviceType'],
      _count: {
        id: true
      }
    });

    // Get receipt statistics (completed payments) with service type info
    const receiptStats = await prisma.receipt.findMany({
      where: {
        paid: true
      },
      include: {
        service: {
          select: {
            category: true,
            serviceType: true
          }
        }
      }
    });

    // Calculate total revenue
    const totalRevenue = receiptStats.reduce((sum, receipt) => sum + (receipt.grandTotal || 0), 0);

    // Get pending estimations count
    const pendingCount = await prisma.serviceApplication.count({
      where: {
        status: 'pending'
      }
    });

    // Get completed estimations count
    const completedCount = await prisma.serviceApplication.count({
      where: {
        status: 'approved'
      }
    });

    // Group receipts by service category for revenue breakdown
    const revenueByCategory = {
      'NEW_CONNECTIONS': receiptStats
        .filter(receipt => receipt.service.category === 'NEW_CONNECTIONS')
        .reduce((sum, receipt) => sum + (receipt.grandTotal || 0), 0),
      'NETWORK_OPERATIONS': receiptStats
        .filter(receipt => receipt.service.category === 'NETWORK_OPERATIONS')
        .reduce((sum, receipt) => sum + (receipt.grandTotal || 0), 0),
      'METERING_BILLING': receiptStats
        .filter(receipt => receipt.service.category === 'METERING_BILLING')
        .reduce((sum, receipt) => sum + (receipt.grandTotal || 0), 0),
      'CUSTOMER_SUPPORT': receiptStats
        .filter(receipt => receipt.service.category === 'CUSTOMER_SUPPORT')
        .reduce((sum, receipt) => sum + (receipt.grandTotal || 0), 0)
    };

    // Create detailed chart data based on service categories and types
    const chartData = [
      // NEW_CONNECTIONS category
      {
        label: 'Residential',
        value: serviceTypeStats.find(stat => stat.serviceType === 'NEW_RESIDENTIAL')?._count?.id || 0,
        revenue: receiptStats
          .filter(receipt => receipt.service.serviceType === 'NEW_RESIDENTIAL')
          .reduce((sum, receipt) => sum + (receipt.grandTotal || 0), 0),
        color: 'rgba(255, 99, 132, 0.8)',
        category: 'NEW_CONNECTIONS'
      },
      {
        label: 'Commercial',
        value: serviceTypeStats.find(stat => stat.serviceType === 'NEW_COMMERCIAL_INDUSTRIAL')?._count?.id || 0,
        revenue: receiptStats
          .filter(receipt => receipt.service.serviceType === 'NEW_COMMERCIAL_INDUSTRIAL')
          .reduce((sum, receipt) => sum + (receipt.grandTotal || 0), 0),
        color: 'rgba(255, 159, 64, 0.8)',
        category: 'NEW_CONNECTIONS'
      },
      {
        label: 'Industrial',
        value: serviceTypeStats.find(stat => stat.serviceType === 'NEW_COMMERCIAL_INDUSTRIAL')?._count?.id || 0,
        revenue: receiptStats
          .filter(receipt => receipt.service.serviceType === 'NEW_COMMERCIAL_INDUSTRIAL')
          .reduce((sum, receipt) => sum + (receipt.grandTotal || 0), 0),
        color: 'rgba(255, 205, 86, 0.8)',
        category: 'NEW_CONNECTIONS'
      },
      {
        label: 'Agricultural',
        value: serviceTypeStats.find(stat => stat.serviceType === 'NEW_RESIDENTIAL')?._count?.id || 0,
        revenue: receiptStats
          .filter(receipt => receipt.service.serviceType === 'NEW_RESIDENTIAL')
          .reduce((sum, receipt) => sum + (receipt.grandTotal || 0), 0),
        color: 'rgba(75, 192, 192, 0.8)',
        category: 'NEW_CONNECTIONS'
      },
      {
        label: 'Temporary Construction',
        value: serviceTypeStats.find(stat => stat.serviceType === 'TEMPORARY_POWER')?._count?.id || 0,
        revenue: receiptStats
          .filter(receipt => receipt.service.serviceType === 'TEMPORARY_POWER')
          .reduce((sum, receipt) => sum + (receipt.grandTotal || 0), 0),
        color: 'rgba(54, 162, 235, 0.8)',
        category: 'NEW_CONNECTIONS'
      },
      {
        label: 'Institutional',
        value: serviceTypeStats.find(stat => stat.serviceType === 'NEW_COMMERCIAL_INDUSTRIAL')?._count?.id || 0,
        revenue: receiptStats
          .filter(receipt => receipt.service.serviceType === 'NEW_COMMERCIAL_INDUSTRIAL')
          .reduce((sum, receipt) => sum + (receipt.grandTotal || 0), 0),
        color: 'rgba(153, 102, 255, 0.8)',
        category: 'NEW_CONNECTIONS'
      },

      // NETWORK_OPERATIONS category
      {
        label: 'Meter Replacement',
        value: serviceTypeStats.find(stat => stat.serviceType === 'METER_REPLACEMENT')?._count?.id || 0,
        revenue: receiptStats
          .filter(receipt => receipt.service.serviceType === 'METER_REPLACEMENT')
          .reduce((sum, receipt) => sum + (receipt.grandTotal || 0), 0),
        color: 'rgba(201, 203, 207, 0.8)',
        category: 'NETWORK_OPERATIONS'
      },
      {
        label: 'Transformer Repair',
        value: serviceTypeStats.find(stat => stat.serviceType === 'TRANSFORMER_REPAIR')?._count?.id || 0,
        revenue: receiptStats
          .filter(receipt => receipt.service.serviceType === 'TRANSFORMER_REPAIR')
          .reduce((sum, receipt) => sum + (receipt.grandTotal || 0), 0),
        color: 'rgba(255, 99, 132, 0.6)',
        category: 'NETWORK_OPERATIONS'
      },
      {
        label: 'Cable Repair',
        value: serviceTypeStats.find(stat => stat.serviceType === 'CABLE_REPAIR')?._count?.id || 0,
        revenue: receiptStats
          .filter(receipt => receipt.service.serviceType === 'CABLE_REPAIR')
          .reduce((sum, receipt) => sum + (receipt.grandTotal || 0), 0),
        color: 'rgba(54, 162, 235, 0.6)',
        category: 'NETWORK_OPERATIONS'
      },
      {
        label: 'Substation Inspection',
        value: serviceTypeStats.find(stat => stat.serviceType === 'SUBSTATION_INSPECTION')?._count?.id || 0,
        revenue: receiptStats
          .filter(receipt => receipt.service.serviceType === 'SUBSTATION_INSPECTION')
          .reduce((sum, receipt) => sum + (receipt.grandTotal || 0), 0),
        color: 'rgba(255, 206, 86, 0.6)',
        category: 'NETWORK_OPERATIONS'
      },

      // METERING_BILLING category
      {
        label: 'Meter Malfunction',
        value: serviceTypeStats.find(stat => stat.serviceType === 'METER_MALFUNCTION')?._count?.id || 0,
        revenue: receiptStats
          .filter(receipt => receipt.service.serviceType === 'METER_MALFUNCTION')
          .reduce((sum, receipt) => sum + (receipt.grandTotal || 0), 0),
        color: 'rgba(75, 192, 192, 0.6)',
        category: 'METERING_BILLING'
      },
      {
        label: 'Meter Reading',
        value: serviceTypeStats.find(stat => stat.serviceType === 'METER_READING')?._count?.id || 0,
        revenue: receiptStats
          .filter(receipt => receipt.service.serviceType === 'METER_READING')
          .reduce((sum, receipt) => sum + (receipt.grandTotal || 0), 0),
        color: 'rgba(153, 102, 255, 0.6)',
        category: 'METERING_BILLING'
      },
      {
        label: 'Bill Dispute',
        value: serviceTypeStats.find(stat => stat.serviceType === 'BILL_DISPUTE')?._count?.id || 0,
        revenue: receiptStats
          .filter(receipt => receipt.service.serviceType === 'BILL_DISPUTE')
          .reduce((sum, receipt) => sum + (receipt.grandTotal || 0), 0),
        color: 'rgba(255, 159, 64, 0.6)',
        category: 'METERING_BILLING'
      },

      // CUSTOMER_SUPPORT category
      {
        label: 'Emergency Repair',
        value: serviceTypeStats.find(stat => stat.serviceType === 'EMERGENCY_REPAIR')?._count?.id || 0,
        revenue: receiptStats
          .filter(receipt => receipt.service.serviceType === 'EMERGENCY_REPAIR')
          .reduce((sum, receipt) => sum + (receipt.grandTotal || 0), 0),
        color: 'rgba(255, 99, 132, 0.4)',
        category: 'CUSTOMER_SUPPORT'
      },
      {
        label: 'General Complaint',
        value: serviceTypeStats.find(stat => stat.serviceType === 'GENERAL_COMPLAINT')?._count?.id || 0,
        revenue: receiptStats
          .filter(receipt => receipt.service.serviceType === 'GENERAL_COMPLAINT')
          .reduce((sum, receipt) => sum + (receipt.grandTotal || 0), 0),
        color: 'rgba(54, 162, 235, 0.4)',
        category: 'CUSTOMER_SUPPORT'
      },
      {
        label: 'Outage Report',
        value: serviceTypeStats.find(stat => stat.serviceType === 'OUTAGE_REPORT')?._count?.id || 0,
        revenue: receiptStats
          .filter(receipt => receipt.service.serviceType === 'OUTAGE_REPORT')
          .reduce((sum, receipt) => sum + (receipt.grandTotal || 0), 0),
        color: 'rgba(255, 206, 86, 0.4)',
        category: 'CUSTOMER_SUPPORT'
      }
    ];

    // Group by main categories for summary
    const categorySummary = {
      'NEW_CONNECTIONS': serviceStats.find(stat => stat.category === 'NEW_CONNECTIONS')?._count?.id || 0,
      'NETWORK_OPERATIONS': serviceStats.find(stat => stat.category === 'NETWORK_OPERATIONS')?._count?.id || 0,
      'METERING_BILLING': serviceStats.find(stat => stat.category === 'METERING_BILLING')?._count?.id || 0,
      'CUSTOMER_SUPPORT': serviceStats.find(stat => stat.category === 'CUSTOMER_SUPPORT')?._count?.id || 0
    };

    return NextResponse.json({
      chartData,
      categorySummary,
      revenueByCategory,
      pendingEstimations: pendingCount,
      completedEstimations: completedCount,
      totalRevenue,
      totalReceipts: receiptStats.length,
      serviceStats,
      serviceTypeStats
    });

  } catch (error) {
    console.error('Error fetching estimator statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
} 