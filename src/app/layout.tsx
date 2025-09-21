import type { Metadata } from "next";
import "./globals.css";
import NavBar from "@/components/NavBar";
import Contacts from "@/components/Contacts";
import { addBasePath } from "@/lib/paths";
import ClarityInit from "@/components/ClarityInit";

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
        <script
          src="https://kit.fontawesome.com/dcb994b94b.js"
          crossOrigin="anonymous"
          defer
        ></script>
      </head>
      <body>
        <ClarityInit />
        <header>
          <NavBar />
        </header>
        <main>{children}</main>
        <footer>
          <Contacts />
          © {new Date().getFullYear()} Лілія Кухарець. Усі права захищені.
        </footer>
      </body>
    </html>
  );
}
