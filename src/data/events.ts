// Minimal, one-author events data source
// Add new events by appending a new object to the array below.
// Only keep what matters: title, date/time, optional location, blurb, image and an external URL.

export type SimpleEvent = {
  id: string;              // unique id, e.g. "night-garden-2025-11-02"
  title: string;           // event title
  date: string;            // ISO date/time: "2025-11-02T18:30:00-07:00"
  location?: string;       // free-form: "Elliott Bay Book Company, Seattle"
  blurb?: string;          // short description (1–2 sentences)
  image?: string;          // optional image path under /public
  url?: string;            // external link (YouTube, Event page, Tickets, etc.)
  published?: boolean;     // set false to hide without deleting
};

export const events: SimpleEvent[] = [
  {
    id: "night-garden-seattle-2025-11-02",
    title: "Презентація книги",
    date: "2025-11-02T18:30:00-07:00",
    location: "Elliott Bay Book Company, Seattle, USA",
    blurb: "Читання уривків, коротка розмова та сесія запитань і відповідей.",
    image: "/images/book.jpg",
    url: "https://example.com/events/night-garden-seattle",
    published: true,
  },
  {
    id: "author-interview-youtube-2025-03-14",
    title: "Інтерв’ю в прямому ефірі",
    date: "2025-03-14T16:00:00Z",
    location: "YouTube",
    blurb: "Розмова про письменницький процес та останні новини.",
    image: "/images/book.jpg",
    url: "https://youtube.com/watch?v=XXXXXXXXXXX",
    published: true,
  },
];
