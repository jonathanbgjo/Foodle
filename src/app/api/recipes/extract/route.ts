import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { resolveRecipeSource } from "@/lib/extract/resolveSource";
import { scrapeOrAiRecipe } from "@/lib/extract/scrapeRecipePage";

export async function POST(req: Request) {
  const { url } = await req.json();

  const resolved = await resolveRecipeSource(url);

  const { recipe, rawText } = resolved.resolvedRecipeUrl
    ? await scrapeOrAiRecipe({ recipeUrl: resolved.resolvedRecipeUrl })
    : await scrapeOrAiRecipe({ recipeUrl: url });

  const record = await prisma.recipeRecord.create({
    data: {
      inputUrl: url,
      resolvedUrl: resolved.resolvedRecipeUrl,
      sourceType: resolved.resolvedRecipeUrl ? "PAGE_SCRAPE" : "PAGE_TEXT_AI",
      title: recipe.title,
      cuisine: recipe.cuisine,
      mealType: recipe.mealType,
      recipeJson: recipe,
      rawText,
    },
  });

  return NextResponse.json({ id: record.id });
}
