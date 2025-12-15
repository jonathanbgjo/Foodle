import Link from "next/link";
import { prisma } from "@/lib/db/prisma";

export default async function RecipesPage() {
  const recipes = await prisma.recipeRecord.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <main style={{ maxWidth: 900, margin: "40px auto", padding: 16 }}>
      <h1>All Recipes</h1>
      <Link href="/">← Home</Link>

      <ul style={{ marginTop: 20 }}>
        {recipes.map(r => (
          <li key={r.id}>
            <Link href={`/recipes/${r.id}`}>{r.title}</Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
