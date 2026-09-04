# Dynamic hosting migration backlog

This document records the migration decision, dependency order, acceptance criteria, and production rollback plan. Linear is the source of truth for live task status; the corresponding issues are ZVY-5 through ZVY-12.

- Decision status: accepted on 2026-09-04
- Selected host: Netlify Free
- Alternative: Cloudflare Workers Free
- Current production host remains unchanged until the cutover task is approved and completed.

The Netlify Free commercial-use terms and current 300-credit monthly limit are accepted for the migration and initial low-traffic launch. Usage must be monitored because exhausting the allowance pauses the site until the next billing cycle or a plan upgrade.

The application will first be completed and validated on a Netlify preview URL. Production traffic and `zvychajna.pp.ua` DNS remain on GitHub Pages until HOST-2, HOST-3, HOST-5, HOST-6, and HOST-7 are complete and HOST-8's checkout, SEO, mobile, and error-state checks pass. Before cutover, record the existing DNS values and retain the GitHub Pages deployment. Roll back application regressions by publishing the previous successful Netlify deploy; roll back a hosting or domain failure by restoring the recorded GitHub Pages DNS values. GitHub Pages is disabled only after the new production deployment is verified and stable.

## HOST-1 / ZVY-5 — Select the dynamic hosting provider

- Status: Complete
- Priority: Urgent
- Estimate: 1 point
- Decision: Netlify Free (accepted 2026-09-04)

### Description

Select a host that can run the Next.js App Router dynamically. Netlify is the default recommendation because it supports SSR, ISR, on-demand revalidation, route handlers, and `next/image` without a custom runtime adapter. Cloudflare Workers is the alternative if lower operating cost and edge execution are worth additional adapter work and tighter CPU limits.

### Acceptance criteria

- The provider is explicitly selected.
- Commercial-use eligibility and free-tier limits are accepted.
- The custom-domain and rollback approach are documented.
- No DNS or production deployment changes are made as part of this issue.

## HOST-2 / ZVY-6 — Convert the frontend from static export to a Next.js runtime

- Priority: Urgent
- Estimate: 3 points
- Blocked by: HOST-1

### Description

Remove the GitHub Pages static-export assumptions. Remove `output: "export"`, static base-path detection, and the global `images.unoptimized` setting. Keep environment-specific API configuration and make local, preview, and production builds work without GitHub Pages behavior.

### Acceptance criteria

- `next build` produces a runtime-compatible application rather than `out/` as the production artifact.
- Static asset and internal navigation URLs work locally and in provider previews.
- `next/image` optimization is enabled on the selected host.
- The application passes lint, type checking, and a production build.

## HOST-3 / ZVY-7 — Make product pages dynamic and SEO-safe

- Priority: Urgent
- Estimate: 5 points
- Blocked by: HOST-2

### Description

Allow a backend product to receive a working `/books/[slug]` page without rebuilding the whole site. Remove the static-only route restriction and fetch product data by slug. Use ISR or cached server rendering so product HTML, metadata, canonical tags, and structured data are generated on the server.

### Acceptance criteria

- A newly created backend product has a crawlable product URL without a frontend deployment.
- Unknown slugs return a real 404.
- Product title, description, canonical URL, Open Graph data, and Book/Offer JSON-LD appear in the initial HTML.
- Price and availability shown in structured data match server data within the agreed cache window.
- Existing product URLs remain unchanged.

## HOST-4 / ZVY-10 — Establish one product-content source of truth

- Priority: High
- Estimate: 5 points
- Blocked by: HOST-3

### Description

Define which product fields live in the backend and remove the fragile split between API records and `src/content/books`. The recommended backend-owned fields are slug, name, author, description, SEO description, images, age rating, publication details, price, and availability.

### Acceptance criteria

- Every field has one documented owner.
- Adding a normal product does not require creating a TypeScript content file.
- Missing optional editorial data has a deliberate fallback.
- Backend responses are validated before rendering.
- Cart and checkout continue to use product-item IDs, with final price validation on the backend.

## HOST-5 / ZVY-9 — Add cache invalidation for product changes

- Priority: High
- Estimate: 3 points
- Blocked by: HOST-3

### Description

Add a protected frontend revalidation endpoint and call it from the backend/admin flow when a product is created or updated. Revalidate the product page, catalog, homepage, and sitemap as appropriate.

### Acceptance criteria

- Product creation invalidates `/books`, `/books/{slug}`, the homepage when relevant, and the sitemap.
- Price or availability changes become visible within the agreed maximum delay.
- The endpoint requires a secret and rejects unauthorized calls.
- A failed revalidation attempt is logged and can be retried safely.

## HOST-6 / ZVY-8 — Fix image delivery before moving production traffic

- Priority: High
- Estimate: 5 points
- Blocked by: HOST-2

### Description

Enable provider image optimization, compress oversized source images, and stop `ImageCarousel` from preloading every gallery image to detect orientation. Store image dimensions or aspect ratio as metadata instead.

### Acceptance criteria

- Carousel slides after the first remain lazy-loaded.
- Catalog thumbnails do not download multi-megabyte originals.
- The homepage hero is correctly prioritized for Largest Contentful Paint.
- Product and event images retain acceptable visual quality.
- Mobile performance is measured before and after the change.

## HOST-7 / ZVY-11 — Add dynamic-hosting and SEO regression tests

- Priority: High
- Estimate: 5 points
- Blocked by: HOST-3, HOST-5

### Description

Add automated tests for dynamic routes, metadata, cache refresh, API failure behavior, and the customer purchase path.

### Acceptance criteria

- Tests cover existing, newly created, unavailable, and missing products.
- Tests assert server-rendered title, description, canonical URL, and JSON-LD.
- A browser smoke test covers catalog → product → cart → checkout validation.
- Mobile navigation is tested at 320 px and 390 px.
- Tests do not submit a real payment or depend on production data.

## HOST-8 / ZVY-12 — Deploy a preview and perform a reversible domain cutover

- Priority: High
- Estimate: 3 points
- Blocked by: HOST-2, HOST-3, HOST-6, HOST-7

### Description

Deploy the runtime version to a provider preview URL, validate it against the production API, then move `zvychajna.pp.ua` only after acceptance. Keep GitHub Pages available as the rollback target during verification.

### Acceptance criteria

- Preview deployment passes checkout, SEO, mobile, and error-state checks.
- Required environment variables and CORS origins are configured.
- DNS records and TLS are valid for the custom domain.
- Search-engine sitemap and robots URLs return correct production content.
- A tested rollback procedure exists.
- GitHub Pages is disabled only after the new deployment is verified.
