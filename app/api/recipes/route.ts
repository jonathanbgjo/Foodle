import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: "DATABASE_URL is not set" },
        { status: 500 }
      );
    }

    const records = await prisma.recipeRecord.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        title: true,
        cuisine: true,
        mealType: true,
        inputUrl: true,
        resolvedUrl: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ records });
  } catch (err: any) {
    console.error("GET /api/recipes failed:", err);
    return NextResponse.json(
      { error: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
