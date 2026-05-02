import type { Metadata } from "next";
import Hero from "@/components/organisms/Hero";
import { getProductsForStatic, getLocalMetadata } from "@/lib/api";
import { SITE_AUTHOR, SITE_DESCRIPTION } from "@/lib/site";

export const metadata: Metadata = {
  title: `${SITE_AUTHOR} — офіційний сайт`,
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    title: `${SITE_AUTHOR} — офіційний сайт`,
    description: SITE_DESCRIPTION,
    url: "/",
  },
};

export default async function HomePage() {
  const products = await getProductsForStatic();
  let featured = products.find(p => p.isHero) ?? products[0];

  if (featured) {
    const meta = await getLocalMetadata(featured.slug);
    Object.assign(featured, meta);
  }

  return <Hero initialProduct={featured} />;
}
