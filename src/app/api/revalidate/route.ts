import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

const SLUG_PATTERN = /^[\p{L}\p{N}]+(?:[-_][\p{L}\p{N}]+)*$/u;

function isSlug(value: unknown): value is string {
  return typeof value === "string" && SLUG_PATTERN.test(value);
}

export async function POST(request: NextRequest) {
  const secret = process.env.REVALIDATION_SECRET;
  if (!secret) {
    console.error("Product revalidation is unavailable because REVALIDATION_SECRET is not configured.");
    return NextResponse.json({ error: "Revalidation is not configured." }, { status: 503 });
  }

  if (request.headers.get("x-revalidation-secret") !== secret) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body: unknown = await request.json().catch(() => null);
  if (typeof body !== "object" || body === null || !("slug" in body) || !isSlug(body.slug)) {
    return NextResponse.json({ error: "A valid product slug is required." }, { status: 400 });
  }

  const previousSlug = "previousSlug" in body ? body.previousSlug : undefined;
  if (previousSlug !== undefined && previousSlug !== null && !isSlug(previousSlug)) {
    return NextResponse.json({ error: "The previous product slug is invalid." }, { status: 400 });
  }

  const paths = new Set(["/", "/books", `/books/${body.slug}`, "/sitemap.xml"]);
  if (typeof previousSlug === "string") {
    paths.add(`/books/${previousSlug}`);
  }

  try {
    paths.forEach((path) => revalidatePath(path));
    return NextResponse.json({ revalidated: true, paths: [...paths] });
  } catch (error) {
    console.error("Product revalidation failed.", { slug: body.slug, error });
    return NextResponse.json({ error: "Revalidation failed." }, { status: 500 });
  }
}
