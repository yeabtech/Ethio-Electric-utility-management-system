import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'all'; // all, monthly, yearly
    const status = searchParams.get('status'); // paid, pending, all

    // Base where clause
    let whereClause: any = {};
    
    // Add status filter
    if (status === 'paid') {
      whereClause.paid = true;
    } else if (status === 'pending') {
      whereClause.paid = false;
    }

    // Add date filter based on period
    if (period === 'monthly') {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      whereClause.createdAt = {
        gte: startOfMonth
      };
    } else if (period === 'yearly') {
      const startOfYear = new Date();
      startOfYear.setMonth(0, 1);
      startOfYear.setHours(0, 0, 0, 0);
      whereClause.createdAt = {
        gte: startOfYear
      };
    }

    // Get all receipts with service information
    const receipts = await prisma.receipt.findMany({
      where: whereClause,
      include: {
        service: {
          select: {
            category: true,
            serviceType: true,
            status: true
          }
        },
        customer: {
          select: {
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calculate basic statistics
    const totalReceipts = receipts.length;
    const paidReceipts = receipts.filter(r => r.paid).length;
    const pendingReceipts = receipts.filter(r => !r.paid).length;
    const totalRevenue = receipts.filter(r => r.paid).reduce((sum, r) => sum + r.grandTotal, 0);
    const pendingRevenue = receipts.filter(r => !r.paid).reduce((sum, r) => sum + r.grandTotal, 0);
    const totalTaxCollected = receipts.filter(r => r.paid).reduce((sum, r) => sum + r.taxAmount, 0);

    // Revenue by service category
    const revenueByCategory = receipts
      .filter(r => r.paid)
      .reduce((acc, receipt) => {
        const category = receipt.service.category;
        acc[category] = (acc[category] || 0) + receipt.grandTotal;
        return acc;
      }, {} as Record<string, number>);

    // Revenue by service type
    const revenueByServiceType = receipts
      .filter(r => r.paid)
      .reduce((acc, receipt) => {
        const serviceType = receipt.service.serviceType;
        acc[serviceType] = (acc[serviceType] || 0) + receipt.grandTotal;
        return acc;
      }, {} as Record<string, number>);

    // Monthly revenue trend (last 12 months)
    const monthlyRevenue = [];
    const currentDate = new Date();
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 0);
      
      const monthReceipts = receipts.filter(r => 
        r.paid && 
        r.paymentDate && 
        new Date(r.paymentDate) >= monthStart && 
        new Date(r.paymentDate) <= monthEnd
      );
      
      const monthRevenue = monthReceipts.reduce((sum, r) => sum + r.grandTotal, 0);
      
      monthlyRevenue.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        revenue: monthRevenue,
        count: monthReceipts.length
      });
    }

    // Payment status breakdown
    const paymentStatusBreakdown = {
      paid: {
        count: paidReceipts,
        revenue: totalRevenue,
        percentage: totalReceipts > 0 ? (paidReceipts / totalReceipts) * 100 : 0
      },
      pending: {
        count: pendingReceipts,
        revenue: pendingRevenue,
        percentage: totalReceipts > 0 ? (pendingReceipts / totalReceipts) * 100 : 0
      }
    };

    // Average receipt values
    const averageReceiptValue = paidReceipts > 0 ? totalRevenue / paidReceipts : 0;
    const averagePendingValue = pendingReceipts > 0 ? pendingRevenue / pendingReceipts : 0;

    // Top performing service types by revenue
    const topServiceTypes = Object.entries(revenueByServiceType)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([serviceType, revenue]) => ({
        serviceType,
        revenue,
        count: receipts.filter(r => r.paid && r.service.serviceType === serviceType).length
      }));

    // Recent receipts (last 10)
    const recentReceipts = receipts.slice(0, 10).map(receipt => ({
      id: receipt.id,
      serviceType: receipt.service.serviceType,
      category: receipt.service.category,
      amount: receipt.grandTotal,
      status: receipt.paid ? 'paid' : 'pending',
      paymentDate: receipt.paymentDate,
      createdAt: receipt.createdAt,
      customerEmail: receipt.customer.email
    }));

    return NextResponse.json({
      summary: {
        totalReceipts,
        paidReceipts,
        pendingReceipts,
        totalRevenue,
        pendingRevenue,
        totalTaxCollected,
        averageReceiptValue,
        averagePendingValue
      },
      revenueByCategory,
      revenueByServiceType,
      monthlyRevenue,
      paymentStatusBreakdown,
      topServiceTypes,
      recentReceipts
    });

  } catch (error) {
    console.error('Error fetching receipt analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch receipt analytics' },
      { status: 500 }
    );
  }
} 