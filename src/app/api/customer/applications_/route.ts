import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

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
            report: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(applications);
  } catch (error) {
    console.error("[CUSTOMER_APPLICATIONS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 