# AGENTS.md

## Project Snapshot

Next.js App Router storefront deployed as a server-capable Next.js application. Main behavior is split between server-side data loading and client-side providers.

## Fast Start

- Dev: `npm run dev`
- Lint: `npm run lint`
- Type check: `npm run typecheck`
- Build runtime application: `npm run build` (outputs to `.next/`)
- Local production preview: `npm run start` (after `npm run build`)

## Architecture Anchors

- Routing/pages: `src/app/`
- UI layers: `src/components/atoms`, `src/components/molecules`, `src/components/organisms`
- API boundary: `src/lib/api.ts`
- Generated image dimensions: `src/generated/image-metadata.json`
- Event definitions: `src/data/events.ts`

## Critical Conventions

- Config source of truth: `next.config.mjs`
  - Do not restore `output: 'export'`, a GitHub Pages base path, or global `images.unoptimized`.
  - Keep internal navigation and public assets root-relative (for example, `/books` and `/images/...`).
  - Use `next/image` for storefront images so the deployment provider can optimize them.

- Product data flow:
  - Server/build time: `getProductsForStatic()` (used in `src/app/layout.tsx` and book pages until the dynamic product-route migration is complete).
  - Client reactivity: `ProductsProvider` + `useProducts()`.
  - Do not fetch product API directly from UI components.

- Cart and checkout flow:
  - Use `CartProvider` + `useCart()` for all cart mutations/state.
  - Digital items are constrained to quantity `1` in cart logic.
  - Nova Poshta selection is required for physical delivery in checkout.

- Events:
  - Add/update event records in `src/data/events.ts`.
  - Event images are loaded from `public/images/events/<event-id>/` by `src/app/events/page.tsx`.

- Image assets:
  - Use `next/image` for storefront images and provide an accurate responsive `sizes` value.
  - Run `npm run images:optimize` after adding large files under `public/images`; visually review optimized assets before committing them.
  - Run `npm run images:metadata` when image files or dimensions change. Commit `src/generated/image-metadata.json` with the source assets.

- API and error handling:
  - Keep HTTP integration in `src/lib/api.ts`.
  - Use `notifyApiError` from `src/lib/api.helper.ts` for user-facing API failures.

## Deployment Notes

- CI workflow: `.github/workflows/ci.yml`
- Netlify is the selected runtime host; production traffic moves only after the migration acceptance checks pass.
- Configure `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SITE_BASE` per environment.
- The root `CNAME` file records the current GitHub Pages production domain until the final cutover task removes it.

## Working Guidance For Agents

- Prefer existing provider/hooks patterns over introducing new fetch/state layers.
- Keep product content in the backend API; do not restore product-specific TypeScript content files.
- When editing links/assets, verify local runtime behavior and the provider preview.
- Keep README configuration and deployment guidance aligned with this file.

