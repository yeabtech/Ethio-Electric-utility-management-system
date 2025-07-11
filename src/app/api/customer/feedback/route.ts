import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { reportId, content } = body;

    if (!reportId || !content) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Get the internal user ID from Clerk user ID
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

    // Verify the report exists and belongs to a task related to this user's application
    const report = await prisma.report.findFirst({
      where: {
        id: reportId,
        task: {
          service: {
            userId: user.id
          }
        }
      }
    });

    if (!report) {
      return new NextResponse("Report not found or access denied", { status: 404 });
    }

    // Create the comment
    const comment = await prisma.reportComment.create({
      data: {
        reportId,
        authorId: user.id,
        content
      },
      include: {
        author: {
          select: {
            email: true
          }
        }
      }
    });

    return NextResponse.json(comment);
  } catch (error) {
    console.error("[CUSTOMER_FEEDBACK_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 