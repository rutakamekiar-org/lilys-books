import type { Metadata } from "next";
import Hero from "@/components/organisms/Hero";
import { getProducts, getLocalMetadata } from "@/lib/api";

export const metadata: Metadata = {
  title: "Лілія Кухарець — офіційний сайт",
  description: "Книги Лілії Кухарець: анонси, описи та придбання паперових і електронних версій.",
};

export default async function HomePage() {
  const products = await getProducts().catch(() => []);
  let featured = products.find(p => p.isHero) ?? products[0];

  if (featured) {
    const meta = await getLocalMetadata(featured.slug);
    Object.assign(featured, meta);
  }

  return <Hero initialProduct={featured} />;
}
