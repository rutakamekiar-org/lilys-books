This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Configuration

Copy `.env.example` to `.env.local` when local values differ from the defaults:

- `NEXT_PUBLIC_API_URL` selects the BookPreorder API for local, preview, or production builds.
- `NEXT_PUBLIC_SITE_BASE` sets the absolute site URL used by metadata and structured data.
- `REVALIDATION_SECRET` protects the server-only `/api/revalidate` endpoint and must not use the `NEXT_PUBLIC_` prefix.

The BookPreorder backend must use the same `REVALIDATION_SECRET` value and set `FRONTEND_REVALIDATION_URL` to the deployed endpoint, for example `https://your-site.netlify.app/api/revalidate`.

Production deployments use the Next.js runtime. Run `npm run build` followed by `npm run start` to verify the production server locally.

### Running against a local backend over HTTPS

Pointing `NEXT_PUBLIC_API_URL` at a locally running BookPreorder instance, for example `https://localhost:7213`, fails on the server with `TypeError: fetch failed` caused by `self-signed certificate`. The ASP.NET Core development certificate is trusted through the operating system store, which browsers read but Node.js does not. Client-side calls therefore succeed while every server-side call fails: `/books/{slug}` surfaces the error, and `getProductsForStatic()` logs `fetchProducts failed:` and quietly renders an empty catalog that the client then refills.

Trust the certificate once, then start the dev server with `npm run dev:local`, which runs Node with `--use-system-ca`:

```bash
dotnet dev-certs https --trust
npm run dev:local
```

Alternatively, point `NEXT_PUBLIC_API_URL` at the backend's plain HTTP endpoint and keep using `npm run dev`. Do not reach for `NODE_TLS_REJECT_UNAUTHORIZED=0`: it disables certificate validation for the whole process.

## Regression tests

Run `npm run test:e2e` to start the storefront and its local mock API, then execute the dynamic-route, SEO, cache refresh, purchase-flow, accessibility, keyboard-navigation, and mobile-navigation tests. The suite never calls the production API or submits a payment. Use `npm run test:e2e:ui` for Playwright's interactive runner.

Accessibility coverage runs in the same step. `npm run test:e2e:a11y` scans home, catalog, product details, the excerpt dialog, cart, and checkout with axe-core, and walks the catalog-to-checkout journey using only the keyboard. The scan must report zero violations; see [ACCESSIBILITY.md](ACCESSIBILITY.md) for what is covered and which rules are deliberately not enforced.

Pull-request verification is also production-independent. `npm run test:fixtures` checks every shared product state against the storefront's Zod API contract, and `npm run build:ci` starts the local mock API before creating an optimized build. Fixture drift fails with the mismatched field path. A production API outage or data change therefore cannot break the standard CI pipeline. Real production smoke checks must remain separate, explicit, and read-only.

Product pages are resolved from the BookPreorder API by slug and cached for up to 60 seconds. New active backend products therefore receive a `/books/{slug}` page without a frontend rebuild or deployment; missing and inactive slugs return `404`.

Product identity, descriptions, SEO text, gallery order, specifications, prices, availability, external links, ratings, and excerpt availability come from the BookPreorder API. Responses are validated before rendering. If a gallery is empty, the frontend falls back to the primary `imageUrl`; optional copy is simply omitted. Excerpt HTML and image files are still frontend-hosted assets during this migration, but product-specific TypeScript content files are not used.

## Image assets

Store frontend-owned product and event images under `public/images`. The UI uses `next/image`, so Netlify serves device-sized optimized variants instead of sending source files directly.

- `npm run images:metadata` refreshes the checked-in width and height map used by image galleries.
- `npm run images:optimize` compresses source images larger than 500 KB, caps either dimension at 1920 px, and then refreshes that metadata.

Run `images:optimize` after adding large gallery assets and review the resulting images before committing them. Carousel slides after the first are mounted only as they approach the visible carousel.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.
