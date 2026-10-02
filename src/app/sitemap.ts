import { getProductsForStatic } from "@/lib/api";
import type { Product } from "@/models/Product";
import { absoluteUrl } from "@/lib/site.server";
import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products: Product[] = await getProductsForStatic({ required: true });
  const productEntries: MetadataRoute.Sitemap = products
    .filter(product => product.isActive !== false)
    .map(product => ({
      url: absoluteUrl(`/books/${product.slug}`),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }))
    .sort((left, right) => left.url < right.url ? -1 : left.url > right.url ? 1 : 0);

  const entries: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/books"), changeFrequency: "weekly", priority: 0.9 },
    ...productEntries,
    { url: absoluteUrl("/events"), changeFrequency: "monthly", priority: 0.6 },
    { url: absoluteUrl("/about"), changeFrequency: "monthly", priority: 0.7 },
    { url: absoluteUrl("/return-policy"), changeFrequency: "yearly", priority: 0.5 },
  ];

  return [...new Map(entries.map(entry => [entry.url, entry])).values()];
}
