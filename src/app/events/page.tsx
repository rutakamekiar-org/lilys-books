import Image from "next/image";
import styles from "./page.module.css";
import { events as all, type SimpleEvent } from "@/data/events";

function isUpcoming(e: SimpleEvent) { return new Date(e.date) >= new Date(); }
function sortByDateAsc(a: SimpleEvent, b: SimpleEvent) {
  return new Date(a.date).getTime() - new Date(b.date).getTime();
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

function formatDateParts(dateIso: string){
  const d = new Date(dateIso);
  return {
    date: d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }),
    time: d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
  };
}

function FeaturedHero({ event }: { event: SimpleEvent }){
  const { date, time } = formatDateParts(event.date);
  return (
    <article className={styles.hero}>
      <div className={styles.heroImageWrap}>
        {event.image && (
          <Image src={event.image} alt={event.title} fill sizes="(max-width: 800px) 100vw, 1280px" style={{ objectFit: "cover" }} />
        )}
        <div className={styles.heroOverlay} />
        <div className={styles.heroDateBadge}>{date} · {time}</div>
        <div className={styles.heroContent}>
          <h3 className={styles.heroTitle}>{event.title}</h3>
        </div>
      </div>
      <div className={styles.heroBelow}>
        <p className={styles.heroBelowMeta}>
          <span className={styles.heroBelowDate}>{date} · {time}</span>
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
  const { date, time } = formatDateParts(event.date);
  return (
    <li className={styles.timelineItem}>
      <span className={styles.node} aria-hidden />
      <div className={styles.thumb}>
        {event.image && (
          <Image src={event.image} alt="" fill sizes="120px" style={{ objectFit: "cover" }} />
        )}
      </div>
      <div className={styles.itemBody}>
        <h3 className={styles.itemTitle}>{event.title}</h3>
        <p className={styles.itemMeta}>{date} · {time}{event.location ? ` · ${event.location}` : ""}</p>
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
