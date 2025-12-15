import Link from "next/link";
import { prisma } from "@/lib/db/prisma";

export default async function RecipePage({
  params,
}: {
  params: { id: string };
}) {
  const recipe = await prisma.recipeRecord.findUnique({
    where: { id: params.id },
  });

  if (!recipe) return <div>Not found</div>;

  const data = recipe.recipeJson as any;

  return (
    <main style={{ maxWidth: 900, margin: "40px auto", padding: 16 }}>
      <Link href="/recipes">← Back</Link>

      <h1>{recipe.title}</h1>
      <p>{recipe.cuisine} • {recipe.mealType}</p>

      <h2>Ingredients</h2>
      <ul>
        {data.ingredients.map((i: any, idx: number) => (
          <li key={idx}>{i.item}</li>
        ))}
      </ul>

      <h2>Steps</h2>
      <ol>
        {data.steps.map((s: any) => (
          <li key={s.order}>{s.instruction}</li>
        ))}
      </ol>
    </main>
  );
}
