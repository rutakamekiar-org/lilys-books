import type { Metadata } from "next";
import "./globals.css";
import NavBar from "@/components/NavBar";
import Contacts from "@/components/Contacts";

export const metadata: Metadata = {
  title: "Lily’s Books",
  description: "Official author site and store",
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
