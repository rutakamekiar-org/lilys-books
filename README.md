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

Product pages are resolved from the BookPreorder API by slug and cached for up to 60 seconds. New active backend products therefore receive a `/books/{slug}` page without a frontend rebuild or deployment; missing and inactive slugs return `404`.

Product identity, descriptions, SEO text, gallery order, specifications, prices, availability, external links, ratings, and excerpt availability come from the BookPreorder API. Responses are validated before rendering. If a gallery is empty, the frontend falls back to the primary `imageUrl`; optional copy is simply omitted. Excerpt HTML and image files are still frontend-hosted assets during this migration, but product-specific TypeScript content files are not used.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.
