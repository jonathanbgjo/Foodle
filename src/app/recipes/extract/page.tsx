import { headers } from "next/headers";

export default async function ExtractPage({
  searchParams,
}: {
  searchParams: Promise<{ url?: string }>;
}) {
  const { url } = await searchParams;
  if (!url) throw new Error("Missing url");

  const h = await headers();
  const host = h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  const baseUrl = `${proto}://${host}`;

  const res = await fetch(`${baseUrl}/api/extract`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ url }),
    cache: "no-store",
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Extract failed (${res.status}): ${text.slice(0, 300)}`);
  }

  const { id } = JSON.parse(text) as { id: string };

  // redirect to recipe page
  return (
    <meta httpEquiv="refresh" content={`0; url=/recipes/${id}`} />
  );
}
