export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { resolveRecipeSource } from "@/lib/extract/resolveSource";
import { scrapeOrAiRecipe } from "@/lib/extract/scrapeRecipePage";

export async function POST(req: Request) {
  try {
    const { url } = (await req.json()) as { url?: string };
    if (!url) {
      return NextResponse.json({ error: "Missing url" }, { status: 400 });
    }

    const resolved = await resolveRecipeSource(url);

    const targetUrl = resolved.resolvedRecipeUrl ?? url;
    const { recipe, rawText } = await scrapeOrAiRecipe({ recipeUrl: targetUrl });

    const record = await prisma.recipeRecord.create({
      data: {
        inputUrl: url,
        resolvedUrl: resolved.resolvedRecipeUrl,
        sourceType: resolved.resolvedRecipeUrl ? "PAGE_SCRAPE" : "PAGE_TEXT_AI",
        title: recipe.title,
        cuisine: recipe.cuisine,
        mealType: recipe.mealType,
        recipeJson: recipe as any,
        rawText,
      },
    });

    return NextResponse.json({ id: record.id });
  } catch (err: any) {
    console.error("POST /api/extract failed:", err);
    return NextResponse.json(
      { error: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
