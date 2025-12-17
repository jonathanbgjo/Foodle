import { redirect } from "next/navigation";

async function extract(url: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;
  const res = await fetch("/api/extract", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ url }),
  cache: "no-store",
});


  const text = await res.text();
  if (!res.ok) throw new Error(`Extract failed (${res.status}): ${text.slice(0, 300)}`);

  const json = JSON.parse(text);
  return json.id as string;
}

export default async function ExtractPage(props: {
  searchParams: Promise<{ url?: string }>;
}) {
  const { url } = await props.searchParams;

  if (!url) redirect("/");

  const id = await extract(url);
  redirect(`/recipes/${id}`);
}
