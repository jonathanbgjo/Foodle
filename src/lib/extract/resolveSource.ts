import { load } from "cheerio";

import { fetchHtml, extractUrls } from "./http";
import { guessPlatform } from "./platform";

const BLOCKED_DOMAINS = [
  "youtube.com",
  "youtu.be",
  "instagram.com",
  "tiktok.com",
  "facebook.com",
  "twitter.com",
  "x.com",
];

const RECIPE_HINTS = [
  "/recipe",
  "/recipes",
  "ingredients",
  "directions",
  "instructions",
  "print",
];

function isBlockedDomain(u: URL) {
  return BLOCKED_DOMAINS.some((d) => u.hostname.includes(d));
}

function looksLikeRecipeUrl(raw: string) {
  const s = raw.toLowerCase();
  return RECIPE_HINTS.some((h) => s.includes(h));
}

function decodeYouTubeShortDescription(html: string): string | null {
  // MVP: try to find shortDescription in ytInitialPlayerResponse blob
  const m = html.match(/"shortDescription":"([^"]*)"/);
  if (!m?.[1]) return null;
  // unescape minimal JSON string escapes
  return m[1]
    .replace(/\\n/g, "\n")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, "\\")
    .replace(/\\u0026/g, "&")
    .replace(/\\u003d/g, "=")
    .replace(/\\u002F/g, "/");
}

export type ResolveResult = {
  platform: "youtube" | "instagram" | "other";
  extractedText: string;        // page visible text (best effort)
  candidateUrls: string[];      // all URLs found
  resolvedRecipeUrl: string | null;
  needsManualLink: boolean;     // true if “link in bio” detected but no outbound URL found
};

export async function resolveRecipeSource(inputUrl: string): Promise<ResolveResult> {
  const platform = guessPlatform(inputUrl);

  const html = await fetchHtml(inputUrl);
  const $ = load(html);

  // best-effort visible text
  const bodyText = $("body").text().replace(/\s+/g, " ").trim();

  // also include meta description
  const metaDesc = $('meta[name="description"]').attr("content") ?? "";
  const ogDesc = $('meta[property="og:description"]').attr("content") ?? "";
  const combinedText = [metaDesc, ogDesc, bodyText].filter(Boolean).join("\n");

  const urlsFromText = extractUrls(combinedText);

  // YouTube-specific: add shortDescription if we can find it
  if (platform === "youtube") {
    const sd = decodeYouTubeShortDescription(html);
    if (sd) {
      urlsFromText.push(...extractUrls(sd));
    }
  }

  // de-dup
  const uniqueUrls = Array.from(new Set(urlsFromText));

  // detect “link in bio”
  const lower = combinedText.toLowerCase();
  const mentionsLinkInBio =
    lower.includes("link in bio") ||
    lower.includes("link-in-bio") ||
    lower.includes("linkinbio");

  // choose best candidate
  let resolvedRecipeUrl: string | null = null;

  // Priority: non-social recipe-looking URLs first
  const sorted = uniqueUrls.sort((a, b) => {
    const ar = looksLikeRecipeUrl(a) ? 0 : 1;
    const br = looksLikeRecipeUrl(b) ? 0 : 1;
    return ar - br;
  });

  for (const u of sorted) {
    try {
      const parsed = new URL(u);
      if (isBlockedDomain(parsed)) continue;

      // Keep MVP strict: only accept plausible recipe urls
      if (looksLikeRecipeUrl(u)) {
        resolvedRecipeUrl = parsed.toString();
        break;
      }
    } catch {
      // ignore
    }
  }
  
  return {
    platform,
    extractedText: combinedText.slice(0, 50_000), // cap for safety
    candidateUrls: uniqueUrls.slice(0, 50),
    resolvedRecipeUrl,
    needsManualLink: mentionsLinkInBio && !resolvedRecipeUrl,
  };
}

export function normalizeYouTubeUrl(input: string) {
  try {
    const u = new URL(input);

    // shorts: /shorts/<id>
    const m = u.pathname.match(/^\/shorts\/([a-zA-Z0-9_-]{6,})/);
    if (m) {
      const id = m[1];
      return { videoId: id, watchUrl: `https://www.youtube.com/watch?v=${id}` };
    }

    // watch?v=<id>
    const v = u.searchParams.get("v");
    if (v) return { videoId: v, watchUrl: `https://www.youtube.com/watch?v=${v}` };

    return { videoId: null, watchUrl: input };
  } catch {
    return { videoId: null, watchUrl: input };
  }
}
