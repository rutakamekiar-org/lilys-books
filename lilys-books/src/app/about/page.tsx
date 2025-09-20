import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Про мене — Лілія Кухарець",
  description: "Коротка біографія, творчий шлях, посилання на соцмережі та контакти.",
};

export default function AboutPage() {
  return (
    <section>
      <h1>Про мене</h1>
      <p>Коротка біографія та посилання на соцмережі.</p>
    </section>
  );
}