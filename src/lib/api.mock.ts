import type { Book } from "./types";
import zvychajna from "@/content/books/zvychajna";
import zvychajna2 from "@/content/books/zvychajna-2";

const mockBooks: Book[] = [
  {
    id: "book-ordinary",
    slug: "zvychajna",
    title: "Звичайна",
    author: "Лілія Кухарець",
    coverUrl: "/images/book.jpg",
    rating: { value: 4.54, count: 52, reviews: 40 },
    formats: [
      { type: "paper", price: 350, currency: "UAH", available: true, productId: "test" },
      { type: "digital", price: 200, currency: "UAH", available: true, productId: "c1f3c4a6-f4b1-4351-9b83-5b4b4be48896" },
    ],
    links: { goodreads: "https://www.goodreads.com/book/show/231547139" },
    ageRating: "16+",
  },
  {
    id: "book-ordinary-2",
    slug: "zvychajna-2",
    title: "Звичайна 2",
    author: "Лілія Кухарець",
    coverUrl: "/images/book2.jpg",
    formats: [
      { type: "paper", price: 380, currency: "UAH", available: false, productId: "mock-product-2-paper" },
      { type: "digital", price: 220, currency: "UAH", available: true, productId: "mock-product-2" },
    ],
    ageRating: "18+",
  },
];

function withContent(book: Book): Book {
  switch (book.slug) {
    case "zvychajna":
      return { ...book, ...zvychajna };
    case "zvychajna-2":
      return { ...book, ...zvychajna2 };
    default:
      return book;
  }
}

export async function getBooksMock(): Promise<Book[]> {
  // simulate latency
  await new Promise((r) => setTimeout(r, 120));
  return mockBooks.map(withContent);
}

export async function getBookBySlugMock(slug: string): Promise<Book> {
  await new Promise((r) => setTimeout(r, 120));
  const book = mockBooks.find((b) => b.slug === slug);
  if (!book) throw new Error("Not found");
  return withContent(book);
}

// Payment mocks return a fake redirect so you can test the flow
export async function createPaperCheckoutMock(_bookId: string, _quantity?: number) {
  void _bookId; void _quantity;
  await new Promise((r) => setTimeout(r, 300));
  return { redirectUrl: "https://example.com/mock-monocheckout" };
}

export async function createDigitalInvoiceMock(_params: {
  productId: string;
  customerEmail: string;
  customerPhone: string;
}) {
  void _params;
  await new Promise((r) => setTimeout(r, 300));
  return { redirectUrl: "https://example.com/mock-monopay" };
}