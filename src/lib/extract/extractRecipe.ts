import OpenAI from "openai";
import type { Recipe } from "../types/recipe";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const recipeJsonSchema = {
  name: "recipe",
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["title", "ingredients", "steps", "cuisine", "mealType", "tags"],
    properties: {
      title: { type: "string" },
      servings: { type: ["string", "null"] },

      ingredients: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["item", "quantity", "unit", "notes"],
          properties: {
            item: { type: "string" },
            quantity: { type: ["string", "null"] },
            unit: { type: ["string", "null"] },
            notes: { type: ["string", "null"] },
          },
        },
      },

      steps: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["order", "instruction", "timeMinutes"],
          properties: {
            order: { type: "number" },
            instruction: { type: "string" },
            timeMinutes: { type: ["number", "null"] },
          },
        },
      },

      notes: { type: ["array", "null"], items: { type: "string" },
      },

      cuisine: { type: ["string", "null"] },
      mealType: { type: ["string", "null"] },
      tags: { type: "array", items: { type: "string" } },

      source: {
        type: ["object", "null"],
        additionalProperties: false,
        properties: {
          url: { type: ["string", "null"] },
          platform: {
            type: ["string", "null"],
            enum: ["youtube", "instagram", "other", null],
          },
        },
      },
    },
  },
} as const;

export async function extractRecipeFromPageText(params: {
  pageText: string;
  sourceUrl?: string;
}): Promise<Recipe> {
  if (!process.env.OPENAI_API_KEY) throw new Error("Missing OPENAI_API_KEY");

  const system = [
    "You extract a cooking recipe from messy webpage text.",
    "Return a single JSON object that strictly matches the provided JSON schema.",
    "Rules:",
    "- Do not invent ingredients. If unclear, keep item and set quantity/unit/notes to null.",
    "- Steps must be in correct order starting 1..N.",
    "- cuisine: best guess (e.g., 'Korean', 'Italian', 'Mexican'); null if unknown.",
    "- mealType: one of (Breakfast, Lunch, Dinner, Snack, Dessert, Drink, Side, Appetizer) or null.",
    "- tags: 3-8 short tags like 'spicy', 'air fryer', 'high protein', 'vegetarian', etc.",
    "- Keep instructions concise but complete.",
  ].join("\n");

  const input = [
    { role: "system" as const, content: system },
    {
      role: "user" as const,
      content: [
        params.sourceUrl ? `Source URL: ${params.sourceUrl}` : "Source URL: (not provided)",
        "\nPAGE TEXT:\n",
        params.pageText.slice(0, 60_000),
      ].join("\n"),
    },
  ];

  const resp = await client.responses.create({
    model: "gpt-4o-mini",
    input,
    text: {
      format: {
        type: "json_schema",
        name: recipeJsonSchema.name,
        strict: true,
        schema: recipeJsonSchema.schema,
      },
    },
  });

  const text = resp.output_text;
  if (!text) throw new Error("No output from model");

  const parsed = JSON.parse(text) as Recipe;
  parsed.source = parsed.source ?? { url: params.sourceUrl ?? null, platform: "other" };
  return parsed;
}
