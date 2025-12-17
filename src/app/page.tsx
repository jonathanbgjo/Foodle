import Link from "next/link";

async function getRecent() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/recipes`, {
    cache: "no-store",
  });
  if (!res.ok) return { records: [] };
  return res.json();
}

export default function HomePage() {
  return (
    <main style={{ maxWidth: 720, margin: "40px auto", padding: 16 }}>
      <h1 style={{ fontSize: 28, fontWeight: 600 }}>
        AI Recipe Extractor
      </h1>

      <p style={{ marginTop: 8, color: "#666" }}>
        Paste a YouTube Shorts or Instagram Reel link and extract the recipe.
      </p>

      <form
        action="/recipes/extract"
        method="get"
        style={{ marginTop: 24 }}
      >
        <label
          htmlFor="url"
          style={{ display: "block", fontWeight: 500, marginBottom: 6 }}
        >
          Video URL
        </label>

        <input
          id="url"
          name="url"
          type="url"
          required
          placeholder="https://www.youtube.com/shorts/..."
          style={{
            width: "100%",
            padding: "10px 12px",
            fontSize: 16,
            borderRadius: 6,
            border: "1px solid #ccc",
          }}
        />

        <button
          type="submit"
          style={{
            marginTop: 16,
            padding: "10px 16px",
            fontSize: 16,
            borderRadius: 6,
            border: "none",
            background: "#111",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Extract Recipe
        </button>
      </form>

      <hr style={{ margin: "40px 0" }} />

      <a
        href="/recipes"
        style={{ color: "#0066cc", textDecoration: "underline" }}
      >
        View extracted recipes →
      </a>
    </main>
  );
}
