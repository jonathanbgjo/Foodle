import { redirect } from "next/navigation";
import { runExtract } from "@/lib/extract/runExtract";

export default async function Page(props: {
  searchParams: Promise<{ url?: string }>;
}) {
  const { url } = await props.searchParams;
  if (!url) throw new Error("Missing url");

  const { id } = await runExtract(url);
  redirect(`/recipes/${id}`);
}
