import { load } from "cheerio";
import { fetchHtml } from "./http";
import type { Recipe } from "../types/recipe";
import { extractRecipeFromPageText } from "./extractRecipe";

/**
 * Best-effort URL normalization for YouTube:
 * - https://www.youtube.com/shorts/<id> -> https://www.youtube.com/watch?v=<id>
 * - https://youtu.be/<id> -> https://www.youtube.com/watch?v=<id>
 * - https://www.youtube.com/watch?v=<id> -> unchanged
 */
function normalizeYouTubeWatchUrl(inputUrl: string): { watchUrl: string; videoId: string | null } {
  try {
    const u = new URL(inputUrl);

    // youtu.be/<id>
    if (u.hostname === "youtu.be") {
      const id = u.pathname.replace("/", "");
      if (id) return { watchUrl: `https://www.youtube.com/watch?v=${id}`, videoId: id };
    }

    // youtube.com/shorts/<id>
    const shorts = u.pathname.match(/^\/shorts\/([a-zA-Z0-9_-]{6,})/);
    if (shorts?.[1]) {
      const id = shorts[1];
      return { watchUrl: `https://www.youtube.com/watch?v=${id}`, videoId: id };
    }

    // youtube.com/watch?v=<id>
    const v = u.searchParams.get("v");
    if (v) return { watchUrl: `https://www.youtube.com/watch?v=${v}`, videoId: v };

    return { watchUrl: inputUrl, videoId: null };
  } catch {
    return { watchUrl: inputUrl, videoId: null };
  }
}

function isYouTubeUrl(url: string) {
  try {
    const u = new URL(url);
    return u.hostname.includes("youtube.com") || u.hostname === "youtu.be";
  } catch {
    return false;
  }
}

/**
 * Extract "ytInitialData" JSON from YouTube watch HTML.
 * YouTube often embeds a big JSON blob like:
 *   var ytInitialData = {...};
 */
function parseYtInitialData(html: string): any | null {
  // Try the common "var ytInitialData = {...};"
  const m = html.match(/var\s+ytInitialData\s*=\s*(\{.*?\})\s*;\s*<\/script>/s);
  if (m?.[1]) {
    try {
      return JSON.parse(m[1]);
    } catch {
      // fall through
    }
  }

  // Some pages use: "ytInitialData": {...}
  const m2 = html.match(/"ytInitialData"\s*:\s*(\{.*?\})\s*,\s*"ytInitialPlayerResponse"/s);
  if (m2?.[1]) {
    try {
      return JSON.parse(m2[1]);
    } catch {
      // fall through
    }
  }

  return null;
}

/**
 * Walk any JSON object and collect candidate text blocks that look like a description.
 * This avoids hard-coding brittle paths inside ytInitialData.
 */
function findBestDescriptionCandidate(data: any): string | null {
  const candidates: string[] = [];
  const stack: any[] = [data];

  while (stack.length) {
    const node = stack.pop();
    if (!node || typeof node !== "object") continue;

    // simpleText: "...."
    const simpleText = (node as any).simpleText;
    if (typeof simpleText === "string" && simpleText.length > 120) {
      candidates.push(simpleText);
    }

    // runs: [{text:"..."}, ...]
    const runs = (node as any).runs;
    if (Array.isArray(runs) && runs.length) {
      const allText = runs
        .map((r: any) => (typeof r?.text === "string" ? r.text : ""))
        .join("")
        .trim();

      // Filter for likely recipe-ish descriptions
      if (
        allText.length > 120 &&
        /ingredients|recipe|steps|salt|pepper|cup|tbsp|tsp|°c|°f/i.test(allText)
      ) {
        candidates.push(allText);
      }
    }

    for (const k of Object.keys(node)) {
      const v = (node as any)[k];
      if (v && typeof v === "object") stack.push(v);
    }
  }

  if (!candidates.length) return null;

  // Prefer the longest block that looks recipe-ish
  candidates.sort((a, b) => b.length - a.length);
  return candidates[0] ?? null;
}

/**
 * Extract a readable text representation of a generic HTML page.
 */
function htmlToPageText(html: string): string {
  const $ = load(html);

  // Remove high-noise elements
  $("script, style, noscript, svg, canvas, iframe").remove();

  const title = $("title").text().trim();
  const metaDesc = $('meta[name="description"]').attr("content")?.trim() ?? "";

  // Prefer article-like nodes if present
  const main =
    $("article").first().text() ||
    $("main").first().text() ||
    $("#content").first().text() ||
    $("body").text();

  const cleaned = main
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n");

  const header = [title ? `TITLE: ${title}` : null, metaDesc ? `DESCRIPTION: ${metaDesc}` : null]
    .filter(Boolean)
    .join("\n");

  return [header, cleaned].filter(Boolean).join("\n\n").slice(0, 80_000);
}

/**
 * Main entry: fetch a recipe page (or YouTube watch page) and run AI extraction on text.
 */
export async function scrapeOrAiRecipe(params: {
  recipeUrl: string;
}): Promise<{ recipe: Recipe; rawText: string }> {
  const url = params.recipeUrl;

  // YouTube: fetch watch page HTML and pull the description from ytInitialData
  if (isYouTubeUrl(url)) {
    const { watchUrl } = normalizeYouTubeWatchUrl(url);
    const html = await fetchHtml(watchUrl);

    const data = parseYtInitialData(html);
    const desc = data ? findBestDescriptionCandidate(data) : null;

    // If we found a likely description, prefer it.
    if (desc && desc.length > 50) {
      const recipe = await extractRecipeFromPageText({
        pageText: desc,
        sourceUrl: watchUrl,
      });
      return { recipe, rawText: desc };
    }

    // Fallback: use HTML->text (often weaker for YouTube, but better than nothing)
    const pageText = htmlToPageText(html);
    const recipe = await extractRecipeFromPageText({
      pageText,
      sourceUrl: watchUrl,
    });
    return { recipe, rawText: pageText };
  }

  // Generic webpage
  const html = await fetchHtml(url);
  const pageText = htmlToPageText(html);
  const recipe = await extractRecipeFromPageText({
    pageText,
    sourceUrl: url,
  });
  return { recipe, rawText: pageText };
}
