---
name: seo-update
description: "Update SEO metadata and JSON-LD for Next.js App Router routes in lilys-books. Use when asked to improve SEO for pages, books, events, canonical links, Open Graph, Twitter cards, sitemap/robots, or structured data."
---

# SEO Update Skill

Use this skill when making SEO changes in this repository.

## Scope

Applies to:
- Route metadata in `src/app/**/page.tsx`
- Global metadata in `src/app/layout.tsx`
- Route-level SEO helpers: `src/app/sitemap.ts`, `src/app/robots.ts`
- Shared site constants/helpers: `src/lib/site.ts`, `src/lib/site.server.ts`, `src/lib/paths.ts`

Do not use this skill for styling, checkout, cart, or unrelated product logic.

## Project-Specific Rules

1. Keep metadata inside the route file where possible.
- Use `export const metadata: Metadata = { ... }`.
- Set `alternates.canonical` for indexable pages.

2. Social images must be absolute URLs.
- Use `absoluteUrl("/images/..." )` from `src/lib/site.server.ts` for Open Graph/Twitter images.
- Do not hardcode full domains directly in route files.

3. Respect base path rules.
- For static asset URLs rendered in UI/markup, use `addBasePath()` from `src/lib/paths.ts`.
- Do not hardcode root-only paths for assets.

4. Prefer shared site constants.
- Reuse `SITE_NAME`, `SITE_AUTHOR`, `SITE_DESCRIPTION`, and related constants from `src/lib/site.ts` when appropriate.

5. Structured data (JSON-LD) must be valid and minimal.
- Inject JSON-LD via `<script type="application/ld+json" />` in Server Components.
- Build objects first, then `JSON.stringify`.
- Use relevant schema types only (`WebSite`, `Person`, `Book`, `Event`, etc.).

6. Keep metadata consistent with content language and route intent.
- This site content is primarily Ukrainian.
- Titles and descriptions should match the page content and avoid keyword stuffing.

## Required Workflow

1. Identify target routes and current metadata.
- Read the route `page.tsx` files and `src/app/layout.tsx`.
- Check if route-level metadata already overrides layout defaults.

2. Apply SEO updates narrowly.
- Edit only SEO-related fields and structured data.
- Avoid refactors unless required for correctness.

3. Validate links and canonical behavior.
- Ensure canonical values are route-relative (`"/books"`, `"/events"`, etc.).
- Ensure social image URLs are absolute via `absoluteUrl(...)`.

4. Validate technically.
- Run `npm run lint`.
- Run `npm run build` to ensure static export still succeeds.

5. Report changes clearly.
- List updated files.
- Summarize metadata/JSON-LD changes per route.
- Mention validation results and any unresolved risk.

## Guardrails

- Do not duplicate generic README content.
- Do not introduce client-side SEO hacks for metadata that can be server-rendered.
- Do not add new external SEO dependencies unless explicitly requested.
- Do not alter API/data fetching boundaries for SEO-only tasks.

## Quick Checklist

- Canonical set for each touched route
- Open Graph title/description/url/image verified
- Twitter card metadata verified
- JSON-LD validates logically against page content
- Lint/build pass
