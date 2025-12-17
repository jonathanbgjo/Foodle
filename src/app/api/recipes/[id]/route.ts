import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const record = await prisma.recipeRecord.findUnique({
    where: { id: params.id },
  });

  if (!record) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(record);
}
