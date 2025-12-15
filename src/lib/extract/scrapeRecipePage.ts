import cheerio from "cheerio";
import { fetchHtml } from "./http";
import type { Recipe } from "../types/recipe";
import { extractRecipeFromPageText } from "@/lib/extract/extractRecipe";

function tryParseJsonLdRecipe(html: string): Partial<Recipe> | null {
  const $ = cheerio.load(html);
  const scripts = $('script[type="application/ld+json"]').toArray();

  for (const s of scripts) {
    const raw = $(s).text();
    if (!raw) continue;

    try {
      const parsed = JSON.parse(raw);

      const candidates = Array.isArray(parsed) ? parsed : [parsed];

      for (const node of candidates) {
        // handle @graph
        const graph = node?.["@graph"];
        const nodes = Array.isArray(graph) ? graph : [node];

        for (const n of nodes) {
          const t = n?.["@type"];
          const isRecipe =
            t === "Recipe" || (Array.isArray(t) && t.includes("Recipe"));
          if (!isRecipe) continue;

          const name = n?.name ?? "Recipe";
          const ingredients = (n?.recipeIngredient ?? []).map((x: any) => ({
            item: String(x),
            quantity: null,
            unit: null,
            notes: null,
          }));

          const instructionsRaw = n?.recipeInstructions ?? [];
          const steps: Recipe["steps"] = [];

          if (Array.isArray(instructionsRaw)) {
            let order = 1;
            for (const ins of instructionsRaw) {
              if (typeof ins === "string") {
                steps.push({ order: order++, instruction: ins });
              } else if (ins?.text) {
                steps.push({ order: order++, instruction: String(ins.text) });
              } else if (ins?.itemListElement) {
                for (const sub of ins.itemListElement) {
                  if (sub?.text) steps.push({ order: order++, instruction: String(sub.text) });
                }
              }
            }
          } else if (typeof instructionsRaw === "string") {
            steps.push({ order: 1, instruction: instructionsRaw });
          }

          if (ingredients.length && steps.length) {
            return {
              title: String(name),
              ingredients,
              steps,
              servings: n?.recipeYield ? String(n.recipeYield) : null,
              notes: null,
            };
          }
        }
      }
    } catch {
      // ignore invalid JSON-LD
    }
  }
  return null;
}

function extractReadableText(html: string): string {
  const $ = cheerio.load(html);
  // remove noise
  $("script, style, noscript, nav, footer, header, svg").remove();
  const text = $("body").text().replace(/\s+/g, " ").trim();
  return text.slice(0, 80_000);
}

export async function scrapeOrAiRecipe(params: {
  recipeUrl: string;
}): Promise<{ recipe: Recipe; rawText: string }> {
  const html = await fetchHtml(params.recipeUrl);
  const jsonLd = tryParseJsonLdRecipe(html);
  const rawText = extractReadableText(html);

  if (jsonLd?.title && jsonLd.ingredients?.length && jsonLd.steps?.length) {
    return {
      recipe: {
        title: jsonLd.title,
        servings: jsonLd.servings ?? null,
        ingredients: jsonLd.ingredients as any,
        steps: jsonLd.steps as any,
        notes: jsonLd.notes ?? null,
        cuisine: null,
        mealType: null,
        tags: null,
        source: { url: params.recipeUrl, platform: "other" },
      },
      rawText,
    };
  }

  // AI fallback from page text
  const recipe = await extractRecipeFromPageText({
    pageText: rawText,
    sourceUrl: params.recipeUrl,
  });

  return { recipe, rawText };
}
