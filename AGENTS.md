# AGENTS.md

## Project Overview

This is a Next.js (App Router) project for an online bookstore, statically exported for GitHub Pages. It uses React 19, TypeScript, and a modular structure with clear separation between UI, data, and integration logic.

### Key Architectural Patterns
- **Static Export:** Uses `next export` (see `next.config.mjs`) for static site generation. Images are unoptimized (`images.unoptimized: true`). The build output is in `out/`. Use `npm run build` for static export, not `next export` directly.
- **Base Path Handling:** Handles GitHub Pages subdirectory deploys via `basePath` logic in `next.config.mjs` and `src/lib/paths.ts`. Use `addBasePath()` for static asset URLs and `withCacheBust()` for navigation links. Never hardcode `/images/...` or `/books/...` in code or links.
- **Products & Events:**
  - Book/product data is fetched from an external API (`src/lib/api.ts`, `API_URL`).
  - Local metadata (e.g., excerpts) is loaded from `src/content/books/`.
  - Events are defined in `src/data/events.ts` and images are auto-loaded from `/public/images/events/<id>/` (see `getEventImagesFromFs` in `src/app/events/page.tsx`).
- **Providers:**
  - `ProductsProvider` (`src/components/molecules/ProductsProvider.tsx`) fetches and caches product data for the app. Always use `useProducts()` for product data in UI.
  - `CartProvider` (`src/components/molecules/CartProvider.tsx`) manages cart state, localStorage sync, and promocode logic. Use `useCart()` for cart state and actions.
- **Checkout & Cart:**
  - Cart UI and logic are in `ShoppingCart.tsx` and `CartProvider.tsx`. Checkout is handled by `CheckoutForm.tsx` and integrates with Nova Poshta via `NovaPoshtaWidget.tsx` for physical delivery selection.
  - Cart and checkout dialogs are opened from `NavBar.tsx`.
- **UI Composition:**
  - Atoms, molecules, and organisms are organized in `src/components/`.
  - Pages are in `src/app/`, with route-based folders (e.g., `/books`, `/events`).
  - Suggestion dialogs (upsell) are handled by `SuggestionDialog.tsx` and triggered from `BookDetail.tsx`.

### Developer Workflows
- **Development:** `npm run dev` (uses Turbopack)
- **Build:** `npm run build` (outputs to `out/` for static hosting; do not use `next export` directly)
- **Lint:** `npm run lint`
- **Start (preview):** `npm run start`
- **GitHub Pages Deploy:** See `.github/workflows/pages.yml` for CI/CD. Custom domain support via `CNAME`.

### Project-Specific Conventions
- **Image Paths:** Always use `addBasePath()` for static asset URLs in code. Do not hardcode `/images/...`. For navigation links, always use `withCacheBust()`.
- **Cache Busting:** Use `withCacheBust()` for navigation links to ensure users get the latest build. See `NavBar.tsx` and `BookCard.tsx` for examples.
- **Product Data:** Always access products via `ProductsProvider`/`useProducts()` for reactivity and up-to-date info. Do not fetch products directly in UI components.
- **Cart Logic:** Cart state is persisted in localStorage and synced with product updates. Digital items can only have quantity 1. Cart and promocode state are restored on reload.
- **Checkout:** Use `CheckoutForm.tsx` for checkout UI and logic. For physical books, Nova Poshta department selection is required (see `NovaPoshtaWidget.tsx`).
- **Events:** Add new events to `src/data/events.ts`. Images are loaded by event ID from `/public/images/events/<id>/` and discovered at runtime (see `getEventImagesFromFs`).
- **API Integration:** All API calls are centralized in `src/lib/api.ts`. Use `notifyApiError` for error handling. Do not call the API directly from UI components.
- **Book Detail Merging:** In `BookDetail.tsx`, live product data is merged with static metadata for rich content and up-to-date prices/availability.

### Integration Points
- **External API:** Product and checkout data is fetched from `https://api.zvychajna.pp.ua`.
- **Analytics:** Google Analytics is integrated via `src/app/analytics.tsx`.
- **UI Libraries:** Uses `react-toastify` for notifications, `@fortawesome/fontawesome-free` for icons, and `react-snowfall` for effects.
- **Delivery Widget:** Nova Poshta delivery selection is integrated via `src/components/organisms/NovaPoshtaWidget.tsx` and used in checkout.

### Example Patterns
- **Book Card:** See `src/components/molecules/BookCard.tsx` for usage of `addBasePath`, `withCacheBust`, and product data access.
- **Book Detail:** See `src/components/organisms/BookDetail.tsx` for merging static and live product data, and for triggering upsell suggestions.
- **Cart:** See `CartProvider` for cart logic, promocode application, and localStorage sync. See `ShoppingCart.tsx` for cart UI and promocode handling.
- **Checkout:** See `CheckoutForm.tsx` for checkout UI, validation, and Nova Poshta integration.
- **Suggestion Dialog:** See `SuggestionDialog.tsx` for upsell/related product logic triggered from `BookDetail.tsx`.
- **Events:** See `src/app/events/page.tsx` for event rendering and image loading.

---

For more, see `README.md`, `next.config.mjs`, and the `src/` directory for implementation details.

