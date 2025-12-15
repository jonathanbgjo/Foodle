export async function fetchHtml(url: string, opts?: { timeoutMs?: number }) {
  const timeoutMs = opts?.timeoutMs ?? 20_000;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        // Some sites serve minimal HTML unless a UA is present
        "user-agent":
          "Mozilla/5.0 (compatible; AIRecipeExtractor/1.0; +https://example.com)",
        "accept":
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
    const html = await res.text();
    return html;
  } finally {
    clearTimeout(t);
  }
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
