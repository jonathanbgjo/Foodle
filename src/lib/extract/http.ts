export async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    method: "GET",
    redirect: "follow",
    headers: {
      // A realistic UA matters a lot for YouTube on serverless IPs
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
      accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "accept-language": "en-US,en;q=0.9",
      // optional, sometimes helps
      "cache-control": "no-cache",
      pragma: "no-cache",
    },
    // Ensure Next doesn't cache across requests
    cache: "no-store",
  });

  const html = await res.text();

  // Hard-fail on common YouTube interstitials so you don't silently extract junk.
  const lower = html.toLowerCase();
  const looksBlocked =
    lower.includes("consent.youtube.com") ||
    lower.includes("before you continue") ||
    lower.includes("unusual traffic") ||
    lower.includes("our systems have detected") ||
    lower.includes("detected unusual traffic") ||
    lower.includes("captcha");

  if (!res.ok || looksBlocked) {
    const snippet = html.slice(0, 500).replace(/\s+/g, " ");
    throw new Error(
      `fetchHtml failed (${res.status}) for ${url}. Blocked/interstitial=${looksBlocked}. Snippet: ${snippet}`
    );
  }

  return html;
}


export function extractUrls(text: string): string[] {
  // simple URL detector for MVP
  const re =
    /\bhttps?:\/\/[^\s<>"')\]]+|\bwww\.[^\s<>"')\]]+/gi;
  const matches = text.match(re) ?? [];
  return matches
    .map((m) => (m.startsWith("www.") ? `https://${m}` : m))
    .map((m) => {
      try {
        return new URL(m).toString();
      } catch {
        return m;
      }
    });
}
