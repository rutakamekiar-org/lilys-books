"use client";

import styles from "./page.module.css";
import type { SimpleEvent } from "@/data/events";
import ImageCarousel from "@/components/ImageCarousel";
import LocalDateTime from "@/components/LocalDateTime";

function isUpcoming(e: SimpleEvent) { return new Date(e.date) >= new Date(); }
function sortByDateAsc(a: SimpleEvent, b: SimpleEvent) {
  return new Date(a.date).getTime() - new Date(b.date).getTime();
}

export type EventWithImages = SimpleEvent & { images: string[] };

export default function EventsClient({ events }: { events: EventWithImages[] }) {
  const upcoming = events.filter(isUpcoming).sort(sortByDateAsc);
  const past = events.filter(e => !isUpcoming(e)).sort(sortByDateAsc).reverse();

  const featured = upcoming[0];
  const upcomingRest = upcoming.slice(1);

  const pastFeatured = past[0];
  const pastRest = past.slice(1);

  return (
    <>
      {featured && (
        <section className={styles.section} aria-labelledby="next-event">
          <h2 id="next-event" className={styles.sectionTitle}>Найближча подія</h2>
          <FeaturedHero event={featured} />
        </section>
      )}

      {upcomingRest.length > 0 && (
        <section className={styles.section} aria-labelledby="upcoming-list">
          <h2 id="upcoming-list" className={styles.sectionTitle}>Далі</h2>
            {upcomingRest.map(e => (
              <FeaturedHero key={e.id} event={e} />
            ))}
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
                {pastRest.map(e => (
                  <FeaturedHero key={e.id} event={e} />
                ))}
          </>
        )}
      </section>
    </>
  );
}

function FeaturedHero({ event }: { event: EventWithImages }){
  const images = event.images || [];
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
