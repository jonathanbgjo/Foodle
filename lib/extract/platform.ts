export function guessPlatform(url: string): "youtube" | "instagram" | "other" {
  const u = url.toLowerCase();
  if (u.includes("youtube.com") || u.includes("youtu.be")) return "youtube";
  if (u.includes("instagram.com")) return "instagram";
  return "other";
}

export function normalizeUrl(url: string): string {
  try {
    return new URL(url).toString();
  } catch {
    return url.trim();
  }
}
