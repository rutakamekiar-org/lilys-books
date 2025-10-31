// Minimal, one-author events data source
// Add new events by appending a new object to the array below.
// Images are always loaded automatically from /public/images/events/<id>/ and ordered by filename.

export type SimpleEvent = {
  id: string;              // unique id, e.g. "night-garden-2025-11-02"
  title: string;           // event title
  date: string;            // ISO date/time: "2025-11-02T18:30:00-07:00"
  location?: string;       // free-form: "Elliott Bay Book Company, Seattle"
  blurb?: string;          // short description (1–2 sentences)
  url?: string;            // external link (YouTube, Event page, Tickets, etc.)
  published?: boolean;     // set false to hide without deleting
};

export const events: SimpleEvent[] = [
  {
    id: "2025-10-04-the-ordirnary-presentation-krakow",
    title: "Презентація «Звичайної» у Кракові",
    date: "2025-10-04T13:00:00Z",
    location: "Кавʼярня-книнарня NIĆ",
    blurb: "Презентація «Звичайної» у Кракові",
    url: "https://facebook.com/events/s/%D0%B7%D1%83%D1%81%D1%82%D1%80%D1%96%D1%87-%D0%B7-%D0%BF%D0%B8%D1%81%D1%8C%D0%BC%D0%B5%D0%BD%D0%BD%D0%B8%D1%86%D0%B5%D1%8E-%D0%BB%D1%96%D0%BB%D1%96%D1%94%D1%8E-/768467152631458/",
    published: true,
  },
    {
        id: "2025-10-12-the-ordirnary-presentation-vienna",
        title: "Презентація «Звичайної» у Відні",
        date: "2025-10-12T13:00:00Z",
        location: "Українська бібліотека парафії Св. Варвари у Відні, Postgasse 8 1010 Wien",
        blurb: "Презентація «Звичайної» у Відні",
        url: "https://www.facebook.com/share/p/14HbedV1MCK/?mibextid=wwXIfr",
        published: true,
    },
    {
        id: "2025-10-12-author-interview-youtube",
        title: "Подкаст на каналі «Студія Калідор»",
        date: "2025-10-12T16:00:00Z",
        location: "YouTube",
        blurb: "Подкаст на каналі «Студія Калідор»",
        url: "https://youtu.be/ii-Bk7RfVsQ?si=LrdfTJBr6ZXHMcQo",
        published: true,
    },
    {
    id: "2025-10-27-presentation-brno",
    title: "Презентація «Звичайної» в Брно",
    date: "2025-10-27T17:00:00Z",
    location: "Український центр, Moravské nám. 15, Brno",
    blurb: "Презентація «Звичайної» в Брно",
    url: "https://www.facebook.com/share/1A71QbeSnw/?mibextid=wwXIfr",
    published: true,
  },
  {
    id: "2025-11-30-book-presentation",
    title: "Презентація книги «Звичайна» в Зандамі",
    date: "2025-11-30T12:00:00Z",
    location: "Oekraïense Club, Rozengracht 6-8, 1506 SC Zaandam",
    blurb: "Презентація книги «Звичайна» в Зандамі",
    url: "https://www.instagram.com/p/DQQ7UWkDZEy/?igsh=YnBxajRqZ2I2b29i",
    published: true,
  },
  {
    id: "2025-11-29-book-presentation",
    title: "Презентація книги «Звичайна» в Ейндховені",
    date: "2025-11-29T09:00:00Z",
    location: "St. Claralaan 38, 5654 AV Eindhoven, Nederland",
    blurb: "Презентація книги «Звичайна» в Ейндховені",
    url: "https://www.facebook.com/share/1AAJgs2RJ5/?mibextid=wwXIfr",
    published: true,
  }
];
