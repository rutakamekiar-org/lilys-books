import type { Metadata } from "next";
import "./globals.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import NavBar from "@/components/NavBar";
import Contacts from "@/components/Contacts";
import { addBasePath } from "@/lib/paths";
import ClarityInit from "@/components/ClarityInit";
import Script from "next/script";
import Analytics from "@/app/analytics";
import { Suspense } from "react";
import ToastProvider from "@/components/ToastProvider";

const GA_MEASUREMENT_ID = 'G-G99TKQS1G1'
const isGaEnabled = Boolean(GA_MEASUREMENT_ID);

export const metadata: Metadata = {
  title: "Lily’s Books",
  description: "Official author site and store",
  icons: {
    icon: [
      { url: addBasePath("/icons/favicon.svg"), type: "image/svg+xml" },
      { url: addBasePath("/icons/favicon-96x96.png"), sizes: "96x96", type: "image/png" },
      { url: addBasePath("/icons/favicon.ico") },
    ],
    apple: [
      { url: addBasePath("/icons/apple-touch-icon.png"), sizes: "180x180" },
    ],
    shortcut: [addBasePath("/icons/favicon.ico")],
  },
  manifest: addBasePath("/icons/site.webmanifest"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
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
        <ClarityInit />
        <ToastProvider />
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
        </footer>
      </body>
    </html>
  );
}
