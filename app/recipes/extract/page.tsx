import { redirect } from "next/navigation";

async function extract(url: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;
  const res = await fetch(`${baseUrl}/api/recipes/extract`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ url }),
    cache: "no-store",
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Extraction failed");
  return json.id as string;
}

export default async function ExtractPage({
  searchParams,
}: {
  searchParams: { url?: string };
}) {
  const url = searchParams.url;
  if (!url) redirect("/");

  const id = await extract(url);
  redirect(`/recipes/${id}`);
}
