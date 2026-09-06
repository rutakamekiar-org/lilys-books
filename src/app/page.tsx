import type { Metadata } from "next";
import Hero from "@/components/organisms/Hero";
import { getProductsForStatic } from "@/lib/api";
import { SITE_AUTHOR, SITE_DESCRIPTION } from "@/lib/site";
import { absoluteUrl } from "@/lib/site.server";

const HOME_SOCIAL_IMAGE = absoluteUrl("/images/photo_2025-09-21_20-57-11.jpg");

export const metadata: Metadata = {
  title: `${SITE_AUTHOR} — офіційний сайт`,
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "uk_UA",
    title: `${SITE_AUTHOR} — офіційний сайт`,
    description: SITE_DESCRIPTION,
    url: "/",
    images: [{ url: HOME_SOCIAL_IMAGE, alt: SITE_AUTHOR }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_AUTHOR} — офіційний сайт`,
    description: SITE_DESCRIPTION,
    images: [HOME_SOCIAL_IMAGE],
  },
};

export default async function HomePage() {
  const products = await getProductsForStatic();
  const featured = products.find(p => p.isHero) ?? products[0];

  return <Hero initialProduct={featured} />;
}
