import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { clerkClient } from '@clerk/clerk-sdk-node';

export async function GET(request: Request) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // First get the internal user ID from the Clerk user ID
    const user = await prisma.user.findUnique({
      where: {
        clerkUserId: clerkUserId
      },
      select: {
        id: true
      }
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    const applications = await prisma.serviceApplication.findMany({
      where: {
        userId: user.id,
      },
      include: {
        receipt: {
          select: {
            status: true,
            paid: true,
            paymentDate: true,
          },
        },
        task: {
          select: {
            status: true,
            scheduledAt: true,
            technician: {
              select: {
                user: {
                  select: {
                    clerkUserId: true,
                  },
                },
              },
            },
            report: {
              select: {
                id: true,
                status: true,
                priority: true,
                comments: {
                  select: {
                    id: true,
                    content: true,
                    createdAt: true,
                    author: {
                      select: {
                        email: true
                      }
                    }
                  },
                  orderBy: {
                    createdAt: "desc"
                  }
                }
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Manually map to ensure only the expected fields are sent
    const safeApplications = await Promise.all(applications.map(async app => {
      let technicianName = null;
      if (app.task?.technician?.user?.clerkUserId) {
        try {
          const clerkUser = await clerkClient.users.getUser(app.task.technician.user.clerkUserId);
          const firstName = clerkUser.firstName || '';
          const lastName = clerkUser.lastName || '';
          technicianName = `${firstName} ${lastName}`.trim();
        } catch (e) {
          technicianName = null;
        }
      }
      return {
        ...app,
        task: app.task
          ? {
              status: app.task.status,
              scheduledAt: app.task.scheduledAt,
              technicianName,
              report: app.task.report
                ? {
                    id: app.task.report.id,
                    status: app.task.report.status,
                    priority: app.task.report.priority,
                    comments: app.task.report.comments,
                  }
                : null,
            }
          : null,
        receipt: app.receipt
          ? {
              status: app.receipt.status,
              paid: app.receipt.paid,
              paymentDate: app.receipt.paymentDate,
            }
          : null,
      };
    }));

    return NextResponse.json(safeApplications);
  } catch (error) {
    console.error("[CUSTOMER_APPLICATIONS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 