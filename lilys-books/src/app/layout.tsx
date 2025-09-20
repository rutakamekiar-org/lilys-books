import type { Metadata } from "next";
import "./globals.css";
import NavBar from "@/components/NavBar";

export const metadata: Metadata = {
  title: "Lily’s Books",
  description: "Official author site and store",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk">
      <body>
        <header>
          <NavBar />
        </header>
        <main>{children}</main>
        <footer>
          © {new Date().getFullYear()} Лілія Кухарець
        </footer>
      </body>
    </html>
  );
}
