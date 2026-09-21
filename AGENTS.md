# AGENTS.md

## Project Snapshot

Next.js App Router storefront deployed as a server-capable Next.js application. Main behavior is split between server-side data loading and client-side providers.

## Fast Start

- Dev: `npm run dev` (use `npm run dev:local` when `NEXT_PUBLIC_API_URL` points at a local backend over HTTPS, so Node trusts the OS certificate store)
- Lint: `npm run lint`
- Type check: `npm run typecheck`
- Browser regression tests: `npm run test:e2e`
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

- Regression tests:
  - Playwright specs live in `tests/e2e`; the local API double is `tests/support/mock-api.mjs`.
  - Keep tests deterministic and production-independent. Never point the suite at the real API or submit a payment.

- Accessibility:
  - `tests/e2e/accessibility.spec.ts` runs axe-core over home, catalog, product details, the excerpt dialog, cart and checkout; `tests/e2e/keyboard-navigation.spec.ts` covers the keyboard journey and dialog focus behaviour. Both run inside `npm run test:e2e`.
  - The scan must report zero violations apart from the rules listed in `SKIPPED_RULES` in `tests/e2e/a11y.ts`. `color-contrast` is skipped there as an accepted brand exception; do not add others without recording the reason in `ACCESSIBILITY.md`.
  - Do not change `--accent` (`#f09b30`) to satisfy a contrast tool. It is sampled from the cover art of «Звичайна» and the exception is deliberate.
  - Build new dialogs on `useDialogA11y` from `src/lib/dialog-a11y.ts` instead of re-implementing Escape, focus trapping and focus restoration.
  - Add an axe scan whenever you add a storefront page or dialog.

## Deployment Notes

- CI workflow: `.github/workflows/ci.yml`
- Netlify is the selected runtime host; production traffic moves only after the migration acceptance checks pass.
- Configure `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SITE_BASE` per environment.
- Follow `HOSTING_CUTOVER_RUNBOOK.md` for preview verification, DNS changes, TLS checks, and rollback.
- Keep the root `CNAME` file and GitHub Pages enabled until the custom domain passes the post-cutover verification gate; remove and disable them only as the final cutover step.

## Working Guidance For Agents

- Prefer existing provider/hooks patterns over introducing new fetch/state layers.
- Keep product content in the backend API; do not restore product-specific TypeScript content files.
- When editing links/assets, verify local runtime behavior and the provider preview.
- Keep README configuration and deployment guidance aligned with this file.

## Git Workflow

- When the user asks to implement, build, fix, or otherwise change code, create and switch to a dedicated feature branch before editing files.
- Use the `codex/` prefix by default and include the issue identifier when one is available (for example, `codex/zvy-32-hold-invoice-reminders`).
- Do not place a new implementation on an unrelated existing feature branch. If uncommitted work makes switching branches unsafe, stop and ask the user how to proceed.
- Skip branch creation only when the user explicitly asks to work on the current branch.

