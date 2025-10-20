import styles from "./page.module.css";
import { events as all } from "@/data/events";
import { Metadata } from "next";
import EventsClient from "./EventsClient";
import fs from "fs";
import path from "path";
import { addBasePath } from "@/lib/paths";

export const metadata: Metadata = {
  title: "Події",
  description: "Найближчі та минулі події: презентації, інтерв'ю, зустрічі.",
};

function getEventImagesFromFs(eventId: string): string[] {
  try {
    const dir = path.join(process.cwd(), "public", "images", "events", eventId);
    if (!fs.existsSync(dir)) return [];
    const files = fs
      .readdirSync(dir)
      .filter(f => /(png|jpe?g|webp|gif|avif)$/i.test(f))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));
    return files.map(f => addBasePath(`/images/events/${eventId}/${f}`));
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
