# AGENTS.md

## Project Snapshot

Next.js App Router storefront, statically exported for GitHub Pages. Main behavior is split between server-side static data loading and client-side providers.

## Fast Start

- Dev: `npm run dev`
- Lint: `npm run lint`
- Build static site: `npm run build` (outputs to `out/`)
- Local preview: `npm run start`

## Architecture Anchors

- Routing/pages: `src/app/`
- UI layers: `src/components/atoms`, `src/components/molecules`, `src/components/organisms`
- API boundary: `src/lib/api.ts`
- Static + runtime path helpers: `src/lib/paths.ts`
- Product metadata content: `src/content/books/`
- Event definitions: `src/data/events.ts`

## Critical Conventions

- Config source of truth: `next.config.mjs`
  - `next.config.ts` is an intentional stub to satisfy tooling.
  - Static export is configured via `output: 'export'`.

- Base path and cache busting must follow `src/lib/paths.ts`:
  - Use `addBasePath()` for static assets.
  - Use `withCacheBust()` for internal navigation links.
  - Do not hardcode root asset paths like `/images/...`.

- Product data flow:
  - Server/build time: `getProductsForStatic()` (used in `src/app/layout.tsx` and book pages).
  - Client reactivity: `ProductsProvider` + `useProducts()`.
  - Do not fetch product API directly from UI components.

- Cart and checkout flow:
  - Use `CartProvider` + `useCart()` for all cart mutations/state.
  - Digital items are constrained to quantity `1` in cart logic.
  - Nova Poshta selection is required for physical delivery in checkout.

- Events:
  - Add/update event records in `src/data/events.ts`.
  - Event images are loaded from `public/images/events/<event-id>/` by `src/app/events/page.tsx`.

- API and error handling:
  - Keep HTTP integration in `src/lib/api.ts`.
  - Use `notifyApiError` from `src/lib/api.helper.ts` for user-facing API failures.

## Deployment Notes

- GitHub Pages workflow: `.github/workflows/pages.yml`
- Base path is enabled on CI project pages and disabled when a custom domain (`CNAME`) is present.

## Working Guidance For Agents

- Prefer existing provider/hooks patterns over introducing new fetch/state layers.
- Preserve separation between static content in `src/content/books` and live pricing/availability from API.
- When editing links/assets, verify both regular deploy and GitHub Pages subpath behavior.
- `README.md` is currently generic starter text; rely on this file plus source references above for project-specific behavior.

