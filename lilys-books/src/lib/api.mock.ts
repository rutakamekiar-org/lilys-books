import type { Book } from "./types";

const mockBooks: Book[] = [
  {
    id: "book-ordinary",
    slug: "zvychajna",
    title: "Звичайна",
    author: "Лілія Кухарець",
    description: "Романтика, пригоди та таємниці у першій частині дилогії.",
    coverUrl: "/images/book.jpg", // put any placeholder into public/images
    rating: { value: 4.6, count: 51, reviews: 39 },
    formats: [
      { type: "paper", price: 350, currency: "UAH", available: true },
      { type: "digital", price: 200, currency: "UAH", available: true, productId: "mock-product-id" },
    ],
    links: { goodreads: "https://www.goodreads.com/" },
    excerptHtml: "<p>Уривок з книги…</p>",
  },
  {
    id: "book-ordinary-2",
    slug: "zvychajna-2",
    title: "Звичайна 2",
    author: "Лілія Кухарець",
    description: "Продовження історії.",
    coverUrl: "/images/book2.jpg",
    formats: [
      { type: "paper", price: 380, currency: "UAH", available: false },
      { type: "digital", price: 220, currency: "UAH", available: true, productId: "mock-product-2" },
    ],
  },
];

export async function getBooksMock(): Promise<Book[]> {
  // simulate latency
  await new Promise((r) => setTimeout(r, 120));
  return mockBooks;
}

export async function getBookBySlugMock(slug: string): Promise<Book> {
  await new Promise((r) => setTimeout(r, 120));
  const book = mockBooks.find((b) => b.slug === slug);
  if (!book) throw new Error("Not found");
  return book;
}

// Payment mocks return a fake redirect so you can test the flow
export async function createPaperCheckoutMock(_bookId: string, _quantity = 1) {
  await new Promise((r) => setTimeout(r, 300));
  return { redirectUrl: "https://example.com/mock-monocheckout" };
}

export async function createDigitalInvoiceMock(_params: {
  productId: string;
  customerEmail: string;
  customerPhone: string;
}) {
  await new Promise((r) => setTimeout(r, 300));
  return { redirectUrl: "https://example.com/mock-monopay" };
}