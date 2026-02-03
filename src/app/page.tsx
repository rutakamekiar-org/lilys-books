import type { Metadata } from "next";
import Hero from "@/components/organisms/Hero";

export const metadata: Metadata = {
  title: "Лілія Кухарець — офіційний сайт",
  description: "Книги Лілії Кухарець: анонси, описи та придбання паперових і електронних версій.",
};

export default function HomePage() {
  return <Hero />;
}
