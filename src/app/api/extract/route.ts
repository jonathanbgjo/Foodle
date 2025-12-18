import { NextResponse } from "next/server";
import { runExtract } from "@/lib/extract/runExtract";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { url } = (await req.json()) as { url?: string };
  if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });

  const result = await runExtract(url);
  return NextResponse.json(result);
}
