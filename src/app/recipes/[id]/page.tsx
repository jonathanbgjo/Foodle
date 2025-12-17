import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";

export default async function Page(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  if (!id) notFound();

  const recipe = await prisma.recipeRecord.findUnique({
    where: { id },
  });

  if (!recipe) notFound();

  return (
    <main style={{ maxWidth: 720, margin: "40px auto", padding: 16 }}>
      <h1>{recipe.title}</h1>
      <pre>{JSON.stringify(recipe.recipeJson, null, 2)}</pre>
    </main>
  );
}
