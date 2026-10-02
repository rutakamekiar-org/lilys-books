import styles from "./page.module.css";
import { events as all } from "@/data/events";
import { Metadata } from "next";
import EventsClient from "./EventsClient";
import fs from "fs";
import path from "path";
import { absoluteUrl } from "@/lib/site.server";

const EVENTS_TITLE = "Події Лілії Кухарець";
const EVENTS_DESCRIPTION = "Презентації, інтерв'ю та зустрічі з Лілією Кухарець.";
const EVENTS_SOCIAL_IMAGE = absoluteUrl("/images/photo_2025-09-21_20-57-11.jpg");

export const metadata: Metadata = {
  title: "Події",
  description: "Найближчі та минулі події: презентації, інтерв'ю, зустрічі.",
  alternates: { canonical: "/events" },
  openGraph: {
    type: "website",
    locale: "uk_UA",
    title: EVENTS_TITLE,
    description: EVENTS_DESCRIPTION,
    url: "/events",
    images: [{ url: EVENTS_SOCIAL_IMAGE, alt: EVENTS_TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: EVENTS_TITLE,
    description: EVENTS_DESCRIPTION,
    images: [EVENTS_SOCIAL_IMAGE],
  },
};

function getEventImagesFromFs(eventId: string): string[] {
  try {
    const dir = path.join(process.cwd(), "public", "images", "events", eventId);
    if (!fs.existsSync(dir)) return [];
    const files = fs
      .readdirSync(dir)
      .filter(f => /(png|jpe?g|webp|gif|avif)$/i.test(f))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));
    return files.map(f => `/images/events/${eventId}/${f}`);
  } catch {
    return [];
  }
}

export default function EventsPage() {
  const published = all.filter(e => e.published !== false);
  const eventsWithImages = published.map(e => ({ ...e, images: getEventImagesFromFs(e.id) }));
  return (
    <div className={styles.page}>
      <h1 className={styles.h1}>Події</h1>
      <EventsClient events={eventsWithImages} />
    </div>
  );
}
