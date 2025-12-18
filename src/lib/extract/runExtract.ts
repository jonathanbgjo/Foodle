import { prisma } from "@/lib/db/prisma";
import { resolveRecipeSource } from "@/lib/extract/resolveSource";
import { scrapeOrAiRecipe } from "@/lib/extract/scrapeRecipePage";

export async function runExtract(inputUrl: string) {
  const resolved = await resolveRecipeSource(inputUrl);
  const targetUrl = resolved.resolvedRecipeUrl ?? inputUrl;

  const { recipe, rawText } = await scrapeOrAiRecipe({ recipeUrl: targetUrl });

  const record = await prisma.recipeRecord.create({
    data: {
      inputUrl,
      resolvedUrl: resolved.resolvedRecipeUrl,
      sourceType: resolved.resolvedRecipeUrl ? "PAGE_SCRAPE" : "PAGE_TEXT_AI",
      title: recipe.title,
      cuisine: recipe.cuisine,
      mealType: recipe.mealType,
      recipeJson: recipe as any,
      rawText,
    },
  });

  return { id: record.id };
}
