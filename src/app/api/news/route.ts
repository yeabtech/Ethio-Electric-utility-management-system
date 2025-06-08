import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma, News } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, content, imageUrl } = body;

    // Validate required fields
    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    // Validate title length
    if (title.length < 3 || title.length > 200) {
      return NextResponse.json(
        { error: "Title must be between 3 and 200 characters" },
        { status: 400 }
      );
    }

    // Validate content length
    if (content.length < 10) {
      return NextResponse.json(
        { error: "Content must be at least 10 characters long" },
        { status: 400 }
      );
    }

    const news = await prisma.news.create({
      data: {
        title,
        content,
        imageUrl: imageUrl || null,
      },
    });

    return NextResponse.json(news, { status: 201 });
  } catch (error) {
    console.error("Error creating news:", error);
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { error: "A news article with this title already exists" },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to create news article" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const news = await prisma.news.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(news);
  } catch (error) {
    console.error("Error fetching news:", error);
    return NextResponse.json(
      { error: "Failed to fetch news articles" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: "News article ID is required" },
        { status: 400 }
      );
    }

    await prisma.news.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting news:", error);
    return NextResponse.json(
      { error: "Failed to delete news article" },
      { status: 500 }
    );
  }
} 