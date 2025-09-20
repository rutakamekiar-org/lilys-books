import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Контакти",
  description: "Напишіть мені листа або підписуйтеся у соцмережах.",
};

export default function ContactPage() {
  return (
    <section>
      <h1>Контакти</h1>
      <ul>
        <li><a href="mailto:you@example.com">Email</a></li>
        <li><a href="https://www.instagram.com/yourprofile" target="_blank" rel="noopener">Instagram</a></li>
      </ul>
    </section>
  );
}