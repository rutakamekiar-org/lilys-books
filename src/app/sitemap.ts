import { getBooksMock as getBooks } from "@/lib/api.mock";
import fs from "node:fs";
import path from "node:path";

export const dynamic = "force-static";

function resolveBaseUrl(): string {
  const envBase = process.env.NEXT_PUBLIC_SITE_BASE;
  if (envBase) return envBase.replace(/\/$/, "");
  try {
    const cnamePath = path.join(process.cwd(), "CNAME");
    if (fs.existsSync(cnamePath)) {
      const domain = fs.readFileSync(cnamePath, "utf8").trim();
      if (domain) return `https://${domain}`;
    }
  } catch {}
  return "http://localhost:3000";
}

export default async function sitemap() {
  const base = resolveBaseUrl();
  const books = await getBooks().catch(() => []);
  const now = new Date();

  return [
    { url: `${base}/`, lastModified: now },
    { url: `${base}/books`, lastModified: now },
    ...books.map((b) => ({ url: `${base}/books/${b.slug}`, lastModified: now })),
    { url: `${base}/about`, lastModified: now },
  ];
}