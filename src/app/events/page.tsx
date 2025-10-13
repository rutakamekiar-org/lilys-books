import styles from "./page.module.css";
import { events as all, type SimpleEvent } from "@/data/events";
import ImageCarousel from "@/components/ImageCarousel";
import fs from "fs";
import path from "path";
import {addBasePath} from "@/lib/paths";
import LocalDateTime from "@/components/LocalDateTime";

function isUpcoming(e: SimpleEvent) { return new Date(e.date) >= new Date(); }
function sortByDateAsc(a: SimpleEvent, b: SimpleEvent) {
  return new Date(a.date).getTime() - new Date(b.date).getTime();
}

function getEventImages(e: SimpleEvent): string[] {
  try {
    const dir = path.join(process.cwd(), "public", "images", "events", e.id);
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir)
        .filter(f => /\.(png|jpe?g|webp|gif|avif)$/i.test(f))
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));
      if (files.length > 0) {
        return files.map(f => addBasePath(`/images/events/${e.id}/${f}`));
      }
    }
  } catch {}
  return [];
}

export const metadata = {
  title: "Події",
  description: "Найближчі та минулі події: презентації, інтерв'ю, зустрічі.",
};

export default function EventsPage() {
  const published = all.filter(e => e.published !== false);
  const upcoming = published.filter(isUpcoming).sort(sortByDateAsc);
  const past = published.filter(e => !isUpcoming(e)).sort(sortByDateAsc).reverse();

  const featured = upcoming[0];
  const upcomingRest = upcoming.slice(1);

  const pastFeatured = past[0];
  const pastRest = past.slice(1);

  return (
    <div className={styles.page}>
      <h1 className={styles.h1}>Події</h1>

      {featured && (
        <section className={styles.section} aria-labelledby="next-event">
          <h2 id="next-event" className={styles.sectionTitle}>Найближча подія</h2>
          <FeaturedHero event={featured} />
        </section>
      )}

      {upcomingRest.length > 0 && (
        <section className={styles.section} aria-labelledby="upcoming-list">
          <h2 id="upcoming-list" className={styles.sectionTitle}>Далі</h2>
          <ul className={styles.timeline}>
            {upcomingRest.map(e => (
              <TimelineItem key={e.id} event={e} />
            ))}
          </ul>
        </section>
      )}

      <section className={styles.section} aria-labelledby="past-list">
        <h2 id="past-list" className={styles.sectionTitle}>Минулі</h2>
        {past.length === 0 ? (
          <p>Ще немає минулих подій.</p>
        ) : (
          <>
            {pastFeatured && (
              <FeaturedHero event={pastFeatured} />
            )}
            {pastRest.length > 0 && (
              <ul className={styles.timeline}>
                {pastRest.map(e => (
                  <TimelineItem key={e.id} event={e} />
                ))}
              </ul>
            )}
          </>
        )}
      </section>
    </div>
  );
}

function FeaturedHero({ event }: { event: SimpleEvent }){
  const images = getEventImages(event);
  return (
    <article className={styles.hero}>
      <div className={styles.heroImageWrap}>
        {images.length > 0 && (
          <ImageCarousel images={images} alt={event.title} sizes="(max-width: 800px) 100vw, 1280px" navInside ariaLabel={`Зображення події: ${event.title}`} />
        )}
        <div className={styles.heroOverlay} />
        <div className={styles.heroDateBadge}>
            <LocalDateTime iso={event.date} />
        </div>
        <div className={styles.heroContent}>
          <h3 className={styles.heroTitle}>{event.title}</h3>
        </div>
      </div>
      <div className={styles.heroBelow}>
        <p className={styles.heroBelowMeta}>
          <span className={styles.heroBelowDate}>
              <LocalDateTime iso={event.date} />
          </span>
          {event.location ? ` · ${event.location}` : ""}
        </p>
        {event.blurb && (
          <p className={styles.heroBelowBlurb}>{event.blurb}</p>
        )}
        {event.url && (
          <div className={styles.heroBelowActions}>
            <a className={styles.heroBtn} href={event.url} target="_blank" rel="noopener noreferrer" aria-label="Відкрити посилання на подію">
              Перейти <span aria-hidden>↗</span>
            </a>
          </div>
        )}
      </div>
    </article>
  );
}

function TimelineItem({ event }: { event: SimpleEvent }){
  const images = getEventImages(event);
  return (
    <li className={styles.timelineItem}>
      <span className={styles.node} aria-hidden />
      <div className={styles.thumb}>
        {images.length > 0 && (
          <ImageCarousel images={images} alt="" sizes="120px" ariaLabel={`Зображення: ${event.title}`} />
        )}
      </div>
      <div className={styles.itemBody}>
        <h3 className={styles.itemTitle}>{event.title}</h3>
        <p className={styles.itemMeta}> <LocalDateTime iso={event.date} />{event.location ? ` · ${event.location}` : ""}</p>
        {event.blurb && (<p className={styles.itemBlurb}>{event.blurb}</p>)}
        <div className={styles.itemActions}>
          {event.url && (
            <a className={styles.btn} href={event.url} target="_blank" rel="noopener noreferrer" aria-label="Відкрити посилання на подію">
              Посилання <span aria-hidden>↗</span>
            </a>
          )}
        </div>
      </div>
    </li>
  );
}
