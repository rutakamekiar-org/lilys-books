import { getBooksMock as getBooks } from "@/lib/api.mock";

export const dynamic = "force-static";

export default async function sitemap() {
  const base = process.env.NEXT_PUBLIC_SITE_BASE ?? "http://localhost:3000";
  const books = await getBooks().catch(() => []);
  const now = new Date();

  return [
    { url: `${base}/`, lastModified: now },
    { url: `${base}/books`, lastModified: now },
    ...books.map((b) => ({ url: `${base}/books/${b.slug}`, lastModified: now })),
    { url: `${base}/about`, lastModified: now },
  ];
}