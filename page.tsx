import Link from "next/link";

async function getRecent() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/recipes`, {
    cache: "no-store",
  });
  if (!res.ok) return { records: [] };
  return res.json();
}

export default async function Page() {
  const data = await getRecent();

  return (
    <main style={{ maxWidth: 900, margin: "40px auto", padding: 16, fontFamily: "system-ui" }}>
      <h1>AI Recipe Extractor (MVP)</h1>

      <section style={{ marginTop: 24, padding: 16, border: "1px solid #ddd", borderRadius: 12 }}>
        <h2>Extract from a link</h2>
        <p style={{ color: "#444" }}>
          Paste a YouTube Short / Instagram Reel link or a recipe page link. MVP prioritizes finding
          a recipe URL and scraping it. “Link in bio” may require manual link in Phase 2.
        </p>

        <form action="/recipes/extract" method="GET" style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <input
            name="url"
            placeholder="Paste link here…"
            style={{ flex: 1, padding: 10, borderRadius: 10, border: "1px solid #ccc" }}
          />
          <button style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid #ccc" }}>
            Extract
          </button>
        </form>
      </section>

      <section style={{ marginTop: 28 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <h2>Recent</h2>
          <Link href="/recipes">View all</Link>
        </div>

        <ul style={{ listStyle: "none", padding: 0, marginTop: 10 }}>
          {data.records.slice(0, 10).map((r: any) => (
            <li key={r.id} style={{ padding: 12, borderBottom: "1px solid #eee" }}>
              <Link href={`/recipes/${r.id}`} style={{ fontWeight: 600 }}>
                {r.title}
              </Link>
              <div style={{ color: "#555", marginTop: 4 }}>
                {r.cuisine ?? "Unknown cuisine"} • {r.mealType ?? "Unknown meal type"}
              </div>
              <div style={{ color: "#777", marginTop: 4, fontSize: 13 }}>
                {new Date(r.createdAt).toLocaleString()}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
