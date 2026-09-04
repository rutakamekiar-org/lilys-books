import type { Metadata } from "next";
import "./globals.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import NavBar from "@/components/organisms/NavBar";
import Contacts from "@/components/organisms/Contacts";
import ClarityInit from "@/components/atoms/ClarityInit";
import Script from "next/script";
import Analytics from "@/app/analytics";
import { Suspense } from "react";
import ToastProvider from "@/components/atoms/ToastProvider";
import { CartProvider } from "@/components/molecules/CartProvider";
import { ProductsProvider } from "@/components/molecules/ProductsProvider";
import { getProductsForStatic } from "@/lib/api";
import Snow from "@/components/atoms/Snow";
import { SITE_AUTHOR, SITE_DESCRIPTION, SITE_KEYWORDS, SITE_NAME } from "@/lib/site";
import { absoluteUrl, resolveSiteBaseUrl } from "@/lib/site.server";
import Link from "next/link";

const GA_MEASUREMENT_ID = 'G-G99TKQS1G1'
const isGaEnabled = Boolean(GA_MEASUREMENT_ID);

export const metadata: Metadata = {
  metadataBase: new URL(resolveSiteBaseUrl()),
  title: {
    default: `${SITE_AUTHOR} — офіційний сайт`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_AUTHOR, url: resolveSiteBaseUrl() }],
  creator: SITE_AUTHOR,
  publisher: SITE_AUTHOR,
  keywords: SITE_KEYWORDS,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "uk_UA",
    url: "/",
    siteName: SITE_NAME,
    title: `${SITE_AUTHOR} — офіційний сайт`,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: absoluteUrl("/images/photo_2025-09-21_20-57-11.jpg"),
        width: 720,
        height: 1080,
        alt: SITE_AUTHOR,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_AUTHOR} — офіційний сайт`,
    description: SITE_DESCRIPTION,
    images: [absoluteUrl("/images/photo_2025-09-21_20-57-11.jpg")],
  },
  icons: {
    icon: [
      { url: "/icons/favicon.svg", type: "image/svg+xml" },
      { url: "/icons/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/icons/favicon.ico" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180" },
    ],
    shortcut: ["/icons/favicon.ico"],
  },
  manifest: "/icons/site.webmanifest",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const initialProducts = await getProductsForStatic();
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: resolveSiteBaseUrl(),
    inLanguage: "uk-UA",
    publisher: {
      "@type": "Person",
      name: SITE_AUTHOR,
      url: resolveSiteBaseUrl(),
    },
  };

  return (
    <html lang="uk">
      <head>
        {/* GA Script Loader */}
        {isGaEnabled && (
          <>
            <Script
              strategy="afterInteractive"
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}', {
              page_path: window.location.pathname,
            });
          `}
            </Script>
          </>
        )}
      </head>
      <body>
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <Snow/>
        <ClarityInit />
        <ToastProvider />
        <ProductsProvider initialProducts={initialProducts}>
          <CartProvider>
            <header>
              <NavBar />
            </header>
            <main>
                <Suspense fallback={null}>
                    <Analytics />
                </Suspense>
                {children}
            </main>
            <footer>
              <Contacts />
              © {new Date().getFullYear()} Лілія Кухарець. Усі права захищені.
              <br/>
              lillykukharets0325@gmail.com
              <br/>
              <Link href="/return-policy">Повернення та обмін</Link>
            </footer>
          </CartProvider>
        </ProductsProvider>
      </body>
    </html>
  );
}
