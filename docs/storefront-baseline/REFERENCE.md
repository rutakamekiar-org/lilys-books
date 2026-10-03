# Storefront baseline — ZVY-52

Shared review reference: [Storefront screen baseline — ZVY-52 (desktop and mobile)](https://linear.app/zvychajna/document/storefront-screen-baseline-zvy-52-desktop-and-mobile-015d372f40b2). Original captures and the offline index are also available in the evidence pack linked from that document.

Repository location: `lilys-books/docs/storefront-baseline`, within the frontend repository. All reproduction commands below run from the `lilys-books` repository root.

Review status: **approved for completeness and correctness by Vladyslav Kovalov on 2026-10-04**. Approval was given in the implementation chat: “Approved, make commit, create PR with skip netlify and close ZVY-52”. The dependent audits may proceed. This baseline documents observed behavior; it makes no improvement decisions.

Discovery audit: [ZVY-53 — desktop and mobile](https://linear.app/zvychajna/document/storefront-discovery-audit-zvy-53-desktop-and-mobile-66c998fc4770) · [local report](../storefront-discovery/REPORT.md). Eight findings with stable IDs and 35 supplemental originals; ready for ZVY-56 consolidation. Proposed improvements await ZVY-57 screen review.

## Environment and evidence

Captured on 2026-10-03 in a local run of `lilys-books`, using the Codex in-app Chromium browser on Windows. Browser version is not exposed by the capture interface. Responsive desktop-browser views were used, not real phones.

| View | Configured CSS viewport |
| --- | --- |
| Desktop | 1440 × 900 |
| Mobile | 390 × 844 |
| Narrow mobile | 360 × 844 |

The browser exports its content surface with scrollbar space omitted in some images. Native export dimensions are recorded separately in `captures.json` and the paired-image labels; viewport exports range from 1425 × 891, 375 × 812 and 345 × 809 to the full configured size. Full-page supplements have variable document heights. Original bytes are preserved rather than stretched to the configured viewport. Recorded DOM viewport dimensions confirm the responsive layout sizes; device pixel ratio was approximately 1 where measured. These exports cannot be used for exact screenshot-pixel-to-CSS-pixel measurements without accounting for the difference.

Source bases are `origin/main`, as requested, on branch `codex/zvy-52-storefront-baseline`:

- Frontend: `34f900babe7391159256be9a1e7cf8d01dabdd3d`, [lilys-books](https://github.com/rutakamekiar-org/lilys-books).
- Backend source context: `2e95266e5daed16671eb4dbff72d453db9ec0bcd`, [BookPreorder](https://github.com/Rutakamekiar/BookPreorder). The backend application was not run; the documentation and capture helpers live in `lilys-books`.
- Local frontend: `http://127.0.0.1:3100`; documentation API double: `http://127.0.0.1:4100`.
- Node 24.11.1 and existing Next.js 16.3.4 dependencies; development mode. The Next development badge/error counter visible in captures is tooling, not production storefront content.
- Public catalog snapshot fetched once from `https://api.zvychajna.pp.ua/api/products`; original response retained in `catalog-snapshot.json`. The API double rewrites only image URLs to checked-in storefront images, retaining product content, prices, ratings and ordinary availability flags. This snapshot is frozen evidence, not a promise of current stock.
- Orders use synthetic data and the loopback API double. No Monobank invoice, database mutation, delivery, email or notification queue was triggered. Only the embedded Nova Post branch picker contacts its external provider.

## Route and surface inventory

| Surface | Route / opening action | Reference |
| --- | --- | --- |
| Home, featured product, navigation and contacts | `/` | SCR-01 |
| Catalog | `/books` | SCR-02 |
| Six product detail pages | `/books/zvychajna`, `/books/inaksha`, `/books/brunette-stories`, `/books/zvychajna-and-inaksha`, `/books/inaksha-art`, `/books/pid_shepit_snihu` | SCR-03 |
| Excerpt and accompanying-item dialogs | Product actions; URL stays on product | SCR-03 |
| Cart drawer | Navigation cart or product purchase; no separate cart route | SCR-04 |
| Checkout dialog and nested branch picker | Cart → Оформити замовлення; no separate checkout route | SCR-05 |
| Mock handoff return | Loopback invoice response redirects to `/` | SCR-06 |
| Events | `/events` | SCR-07 |
| Author | `/about` | SCR-08 |
| Return policy | `/return-policy`, linked in footer | SCR-09 |
| Product failure, retry, missing product | Product route; unknown slug | SCR-10 |

`robots`, sitemap, manifest and the revalidation API are technical endpoints, not customer screens. External Goodreads, YouTube, social, Amazon, email and event destinations are linked surfaces outside this storefront baseline. They were not audited.

## Customer journeys

1. **Discover and choose:** home → shop → product → read description/specifications/sample → choose eligible format → add/buy → review cart. A direct product link enters at the product step. The optional sequel/postcards suggestion occurs after the book has already been added and can be dismissed.
2. **Buy a physical item:** product → cart → quantity/promo review → checkout → names/email/phone → Nova Post branch → review total → confirm → loading → invoice result. A validation failure stays in the form; a request failure preserves it for retry. The live payment-provider step is outside this controlled run.
3. **Buy digital:** choose electronic edition → cart → names/email and optional note → confirm. Shipping and phone are omitted. Digital delivery after payment was not exercised. A mixed cart contains both editions and retains physical shipping requirements.
4. **Recover:** missing product → catalog; product API failure → retry after normal data is restored or catalog; invalid promo → correct/remove the code or continue; empty cart → close and choose a product.
5. **Learn about the author:** navigation → events/about, or footer → returns policy/contacts → return to shop or follow an external link.

## Reproduce a state

Check out the frontend source revision above and use its installed dependencies. From the `lilys-books` repository root, start the documentation API with `node docs/storefront-baseline/capture-api.mjs`. In a second terminal at the same repository root, start the frontend with these PowerShell settings and command:

```powershell
$env:NEXT_PUBLIC_API_URL='http://127.0.0.1:4100'
$env:NEXT_PUBLIC_SITE_BASE='http://127.0.0.1:3100'
$env:REVALIDATION_SECRET='zvy52-local-capture'
$env:NEXT_TELEMETRY_DISABLED='1'
node node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port 3100
```

The revalidation value is a local capture-only value. Do not substitute or disclose production credentials. Start a fresh browser session to reset the persisted cart; alternatively remove every item and clear any applied promo through the UI. Set the documented viewport, navigate, wait for product rendering and let viewport resizing settle before capture. Capture each state at all three sizes. Full-page screenshots supplement the normal viewport views where lower product content or policy text matters.

Set the loopback scenario, then invalidate cached data before reloading the affected route:

```powershell
Invoke-RestMethod -Method Post -Uri 'http://127.0.0.1:4100/__control/scenario' -ContentType 'application/json' -Body '{"scenario":"normal"}'
Invoke-RestMethod -Method Post -Uri 'http://127.0.0.1:3100/api/revalidate' -Headers @{'x-revalidation-secret'='zvy52-local-capture'} -ContentType 'application/json' -Body '{"slug":"inaksha"}'
```

Available scenarios: `normal`, `empty` (catalog `[]`), `unavailable` (availability and preorder flags false), `product-error` (product HTTP 500), `invoice-error` (invoice HTTP 500), `invoice-loading` (15-second delay before mock response). Control changes reset the invoice counter. Home/catalog/product data is cached by Next; changing the API scenario alone is insufficient. Use the appropriate slug in the revalidation request, then reload. For recovery restore `normal`, invalidate, and choose Спробувати ще раз.

Promos are controlled: `INVALID` is rejected; `BASELINE10` returns a global ten-percent code. Invoice failure/loading use `Тест Покупець`, `baseline@example.invalid`, `+380000000000`, public Kyiv branch №1 and the 44-character note `Контрольний сценарій ZVY-52. Не відправляти.` Branch details may change in the live widget. `invoice-error-evidence.json` and `invoice-handoff-evidence.json` record synthetic requests received by the local double. `/__control/state` exposes scenario/request count for checking that invalid forms create no invoice request. The mock's successful response redirects home only; it is not payment success.

`captures.json` is the complete file manifest: stable state ID, route, setup, configured viewport, native image dimensions, full-page flag, UTC capture time, size and SHA-256. `capture-journal.ndjson` preserves capture history; the manifest uses the latest entry for each filename. `states.json` supplies purpose/customer understanding/next action for every state. `assemble-reference.mjs` rebuilds the paired review images from originals with labels and generates QA contact sheets. It uses Sharp from this frontend repository's installed dependencies. Screenshot contents are unedited; paired images add labels and a background around the originals.

## Unavailable and untested states

| State / feature | Disposition |
| --- | --- |
| Open mobile menu | No separate hamburger/menu state; primary links remain visible in the navigation strip. SCR-01/02 show it at all widths. Horizontal navigation scrolling was not exhaustively exercised. |
| Search, filter, sort and search no-results | Not implemented in the current catalog. Empty catalog is captured separately. |
| Dedicated cart/checkout URLs | Not implemented; these are overlays on the current route. |
| Initial page-loading skeletons | No distinct customer-facing skeleton was observed in these captures. Server startup/compilation and slow initial navigation were not captured as customer states. Order-submission loading is captured. |
| Upcoming events | No future event entries in the current data at the capture date. Past entries are captured. |
| Real Monobank handoff; paid/pending/failed/cancelled outcomes | Not exercised. Provider UI, callbacks, receipts and fulfillment are outside the local double. |
| Dedicated payment confirmation | Not implemented in this source baseline; [ZVY-40](https://linear.app/zvychajna/issue/ZVY-40) tracks the follow-up. SCR-06 is only a controlled home return. |
| Zero-cost invoice path, restricted/expired promos, stock changing after add | Not separately captured. The double is for visual states and does not reproduce all server business rules. |
| General/root fatal error | Source has root/global error boundaries; only the product boundary and missing-product recovery were deliberately exercised. |
| Real-phone behavior | Not checked: touch ergonomics, Safari/iOS/Android, software keyboards and physical-device viewport behavior need later verification. |
| Nova Post unavailable/permission/error states | Initial live widget and a selected public branch were exercised; geolocation permission, provider outage and all city/search outcomes were not. |
| Galleries and longer dialog content | Initial images/excerpts and representative scrolling are captured; every gallery frame, description expansion and every scroll position were not separately captured. |

## Finding IDs for the dependent audits

Keep these screen/state IDs unchanged. Assign findings monotonically within the responsible audit: `F-DISC-001` for discovery (ZVY-53), `F-BOOK-001` for selection (ZVY-54), `F-CHECK-001` for cart/checkout (ZVY-55). Never reuse a retired ID. ZVY-56 consolidation retains originating IDs and references duplicates; owner review and final verification use the same IDs.

Each finding records ID, screen/state ID, route, device/viewport, source revision, evidence filename/link, reproduction steps, observed behavior, customer impact, expected behavior, severity, proposal and status. Distinguish unavailable implementation from an untested state and capture tooling from storefront behavior. This baseline creates no audit findings or prioritized improvement list.

## Verification and review gate

- Self-review: all 36 state groups have desktop/mobile/narrow captures, all 117 original files have metadata and hashes, exports were decoded and dimensions checked, and all paired groups were visually inspected in contact sheets. Local interactions cover invalid form, invalid/applied promo, cart changes, disabled unavailable/submitting actions, controlled request error and successful product retry.
- Helper syntax, local API smoke checks, ESLint, TypeScript and deterministic product fixture validation passed. Application behavior is unchanged; full application build and browser regression tests run in the PR's required GitHub verification workflow. Its status is reported on the PR rather than frozen into this baseline.
- All five acceptance criteria are satisfied: inventory (with explicit gaps), labeled reproducible captures, purposes/journeys, a shared reference linked to the project and follow-up tasks, and completeness/correctness approval.
- Review outcome: Vladyslav Kovalov approved this baseline on 2026-10-04 in the implementation chat, including its documented limitations, and requested closure of ZVY-52. This satisfies the final acceptance criterion and releases ZVY-53/54/55 to begin their audits.

## Screen/state reference

<!-- GENERATED-STATES -->

### SCR-01-default — Home and primary navigation

Route: `/` (overlays retain this route).

Purpose: Discover the featured book and routes to the shop, events, author and contacts.

Customer must understand: Understand which book is featured and where to browse the full catalog.

Setup: normal; current catalog snapshot; empty cart; hero and contacts.

Expected next action: Open the featured book or choose Магазин; mobile navigation uses the same visible links.

Captures: desktop 1440 × 900, mobile 390 × 844, narrow 360 × 844; ordered left to right below. Full-page supplements are shown; export heights vary. All originals, UTC times and exact exported dimensions are listed in captures.json. The environment and untested-state limitations above apply to this state.

![SCR-01-default: desktop, mobile and narrow mobile](https://uploads.linear.app/7221c65b-38fd-4804-8810-e36f36e09ca7/3bff2865-55bc-489b-a105-948814aeb3ff/05d3f18e-df5d-4fdc-87d7-119fb5731611)

Originals: `SCR-01-default-1440x900-full.jpg`, `SCR-01-default-1440x900.jpg`, `SCR-01-default-360x844-full.jpg`, `SCR-01-default-360x844.jpg`, `SCR-01-default-390x844-full.jpg`, `SCR-01-default-390x844.jpg`.

### SCR-01-empty — Home without products

Route: `/` (overlays retain this route).

Purpose: Show the surviving home shell when the API returns no products.

Customer must understand: No featured product is offered in this controlled state; contacts and navigation remain.

Setup: empty; API catalog=[]; invalidate cache; fresh home; no featured product, contacts remain.

Expected next action: Choose Магазин or a contact link.

Captures: desktop 1440 × 900, mobile 390 × 844, narrow 360 × 844; ordered left to right below. Viewport captures are shown. All originals, UTC times and exact exported dimensions are listed in captures.json. The environment and untested-state limitations above apply to this state.

![SCR-01-empty: desktop, mobile and narrow mobile](https://uploads.linear.app/7221c65b-38fd-4804-8810-e36f36e09ca7/3faffcb1-62e5-428e-8699-ef0df0aa0eca/ddfb6b29-db77-4e95-a089-06a286a0b2a7)

Originals: `SCR-01-empty-1440x900.jpg`, `SCR-01-empty-360x844.jpg`, `SCR-01-empty-390x844.jpg`.

### SCR-02-default — Catalog

Route: `/books` (overlays retain this route).

Purpose: Compare the six active books, bundle and merchandise entries.

Customer must understand: Read product identity, starting price, rating/availability cues before choosing an item.

Setup: normal; six active products; no search/filter/sort controls.

Expected next action: Open a product card; navigation remains available.

Captures: desktop 1440 × 900, mobile 390 × 844, narrow 360 × 844; ordered left to right below. Full-page supplements are shown; export heights vary. All originals, UTC times and exact exported dimensions are listed in captures.json. The environment and untested-state limitations above apply to this state.

![SCR-02-default: desktop, mobile and narrow mobile](https://uploads.linear.app/7221c65b-38fd-4804-8810-e36f36e09ca7/736b08eb-e588-4a03-9a9c-554b554e6414/efb8d3a7-9f1f-482c-b03e-6400b7f02726)

Originals: `SCR-02-default-1440x900-full.jpg`, `SCR-02-default-1440x900.jpg`, `SCR-02-default-360x844-full.jpg`, `SCR-02-default-360x844.jpg`, `SCR-02-default-390x844-full.jpg`, `SCR-02-default-390x844.jpg`.

### SCR-02-empty — Empty catalog

Route: `/books` (overlays retain this route).

Purpose: Explain that no products are currently offered.

Customer must understand: This is an empty catalog, with no search or filter applied.

Setup: empty; API catalog=[]; invalidate caches; fresh /books load; catalog empty message.

Expected next action: Use navigation or contact the author.

Captures: desktop 1440 × 900, mobile 390 × 844, narrow 360 × 844; ordered left to right below. Viewport captures are shown. All originals, UTC times and exact exported dimensions are listed in captures.json. The environment and untested-state limitations above apply to this state.

![SCR-02-empty: desktop, mobile and narrow mobile](https://uploads.linear.app/7221c65b-38fd-4804-8810-e36f36e09ca7/8a77d349-ac38-454f-8ea2-efdcff934355/eca71078-3d4e-4914-adea-60dda375fc81)

Originals: `SCR-02-empty-1440x900.jpg`, `SCR-02-empty-360x844.jpg`, `SCR-02-empty-390x844.jpg`.

### SCR-03-paper — Paper book selected

Route: `/books/zvychajna` (overlays retain this route).

Purpose: Evaluate Звичайна and choose its physical edition.

Customer must understand: Paper is selected at 499 UAH; description, rating, excerpt and specifications support the purchase.

Setup: normal; /books/zvychajna; paper selected, 499 UAH.

Expected next action: Read the excerpt, switch format, buy or add to cart.

Captures: desktop 1440 × 900, mobile 390 × 844, narrow 360 × 844; ordered left to right below. Full-page supplements are shown; export heights vary. All originals, UTC times and exact exported dimensions are listed in captures.json. The environment and untested-state limitations above apply to this state.

![SCR-03-paper: desktop, mobile and narrow mobile](https://uploads.linear.app/7221c65b-38fd-4804-8810-e36f36e09ca7/e7874a7f-f54f-414a-bf70-69ae667fc48d/5904b174-a5fb-4b0c-802c-b26882f51247)

Originals: `SCR-03-paper-1440x900-full.jpg`, `SCR-03-paper-1440x900.jpg`, `SCR-03-paper-360x844-full.jpg`, `SCR-03-paper-360x844.jpg`, `SCR-03-paper-390x844-full.jpg`, `SCR-03-paper-390x844.jpg`.

### SCR-03-digital — Digital format selected

Route: `/books/zvychajna` (overlays retain this route).

Purpose: Show the alternative edition of the same book.

Customer must understand: Electronic is selected at 199 UAH; this choice determines the cart item and delivery requirements.

Setup: normal; /books/zvychajna; digital selected, 199 UAH.

Expected next action: Buy or add this edition to cart, or switch back to paper.

Captures: desktop 1440 × 900, mobile 390 × 844, narrow 360 × 844; ordered left to right below. Full-page supplements are shown; export heights vary. All originals, UTC times and exact exported dimensions are listed in captures.json. The environment and untested-state limitations above apply to this state.

![SCR-03-digital: desktop, mobile and narrow mobile](https://uploads.linear.app/7221c65b-38fd-4804-8810-e36f36e09ca7/387c9511-2e39-445b-819a-9f9403c2959b/f1cb3fdd-f59d-417e-9f82-7be578bac2ed)

Originals: `SCR-03-digital-1440x900-full.jpg`, `SCR-03-digital-360x844-full.jpg`, `SCR-03-digital-390x844-full.jpg`.

### SCR-03-excerpt — Excerpt dialog

Route: `/books/zvychajna` (overlays retain this route).

Purpose: Let the customer sample the book before buying.

Customer must understand: The reading panel has its own scroll and close control; the product remains underneath.

Setup: normal; /books/zvychajna → Читати уривок; initial dialog scroll.

Expected next action: Read/scroll the excerpt and close it to continue selection.

Captures: desktop 1440 × 900, mobile 390 × 844, narrow 360 × 844; ordered left to right below. Viewport captures are shown. All originals, UTC times and exact exported dimensions are listed in captures.json. The environment and untested-state limitations above apply to this state.

![SCR-03-excerpt: desktop, mobile and narrow mobile](https://uploads.linear.app/7221c65b-38fd-4804-8810-e36f36e09ca7/0756993d-d62b-4749-8418-f1a0d6c6db7a/afc0757d-0677-437b-a08a-8e407f142809)

Originals: `SCR-03-excerpt-1440x900.jpg`, `SCR-03-excerpt-360x844.jpg`, `SCR-03-excerpt-390x844.jpg`.

### SCR-03-preorder — Preorder product

Route: `/books/pid_shepit_snihu` (overlays retain this route).

Purpose: Evaluate Під шепіт снігу while ordinary availability is false and preorder is allowed.

Customer must understand: The paper edition costs 349 UAH and the primary action is Передзамовити.

Setup: normal; /books/pid_shepit_snihu; default selection and all product content.

Expected next action: Preorder/add the selected edition or return to the catalog.

Captures: desktop 1440 × 900, mobile 390 × 844, narrow 360 × 844; ordered left to right below. Full-page supplements are shown; export heights vary. All originals, UTC times and exact exported dimensions are listed in captures.json. The environment and untested-state limitations above apply to this state.

![SCR-03-preorder: desktop, mobile and narrow mobile](https://uploads.linear.app/7221c65b-38fd-4804-8810-e36f36e09ca7/0ab36e38-fc29-498c-a669-d0f9c82c0bc3/3f8a3d54-9f46-43af-8fcb-e8580ff3f3a2)

Originals: `SCR-03-preorder-1440x900-full.jpg`, `SCR-03-preorder-360x844-full.jpg`, `SCR-03-preorder-390x844-full.jpg`.

### SCR-03-unavailable — Unavailable edition

Route: `/books/zvychajna` (overlays retain this route).

Purpose: Show the product when both availability and preorder are disabled.

Customer must understand: Немає в наявності replaces the purchase action and is disabled; this state uses controlled flags.

Setup: unavailable; all item isAvailable/canPreorder flags false; /books/zvychajna; purchase unavailable.

Expected next action: Return to the catalog or select another eligible item.

Captures: desktop 1440 × 900, mobile 390 × 844, narrow 360 × 844; ordered left to right below. Full-page supplements are shown; export heights vary. All originals, UTC times and exact exported dimensions are listed in captures.json. The environment and untested-state limitations above apply to this state.

![SCR-03-unavailable: desktop, mobile and narrow mobile](https://uploads.linear.app/7221c65b-38fd-4804-8810-e36f36e09ca7/542d6f52-1bbb-4569-8de0-802a7f62dffb/66b21f9e-4e37-4389-a76d-f94900d5221e)

Originals: `SCR-03-unavailable-1440x900-full.jpg`, `SCR-03-unavailable-360x844-full.jpg`, `SCR-03-unavailable-390x844-full.jpg`.

### SCR-03-sequel — Sequel product

Route: `/books/inaksha` (overlays retain this route).

Purpose: Evaluate Інакша, including its image gallery and external audio excerpt.

Customer must understand: The initial paper edition costs 550 UAH; electronic costs 249 UAH. External Goodreads and YouTube destinations are separate from checkout.

Setup: normal; /books/inaksha; default selection and all product content.

Expected next action: Choose format, read/listen to a sample, buy or add to cart.

Captures: desktop 1440 × 900, mobile 390 × 844, narrow 360 × 844; ordered left to right below. Full-page supplements are shown; export heights vary. All originals, UTC times and exact exported dimensions are listed in captures.json. The environment and untested-state limitations above apply to this state.

![SCR-03-sequel: desktop, mobile and narrow mobile](https://uploads.linear.app/7221c65b-38fd-4804-8810-e36f36e09ca7/d7e6acad-ee34-402e-be59-12c3779bb3aa/5a211ec0-ef7d-47af-898d-55910ae48f87)

Originals: `SCR-03-sequel-1440x900-full.jpg`, `SCR-03-sequel-360x844-full.jpg`, `SCR-03-sequel-390x844-full.jpg`.

### SCR-03-collection — Story collection

Route: `/books/brunette-stories` (overlays retain this route).

Purpose: Evaluate Брунатні історії as a separate book.

Customer must understand: Its selected paper edition costs 550 UAH; specifications and description differ from the novels.

Setup: normal; /books/brunette-stories; default selection and all product content.

Expected next action: Buy/add this item or return to the catalog.

Captures: desktop 1440 × 900, mobile 390 × 844, narrow 360 × 844; ordered left to right below. Full-page supplements are shown; export heights vary. All originals, UTC times and exact exported dimensions are listed in captures.json. The environment and untested-state limitations above apply to this state.

![SCR-03-collection: desktop, mobile and narrow mobile](https://uploads.linear.app/7221c65b-38fd-4804-8810-e36f36e09ca7/860b82b9-ac28-41b0-9f85-80e4bc922ec3/1628bc90-a301-4d1e-8bb5-e886343f4f6a)

Originals: `SCR-03-collection-1440x900-full.jpg`, `SCR-03-collection-360x844-full.jpg`, `SCR-03-collection-390x844-full.jpg`.

### SCR-03-bundle — Two-book bundle

Route: `/books/zvychajna-and-inaksha` (overlays retain this route).

Purpose: Present Звичайна та Інакша together.

Customer must understand: The selected комплект costs 949 UAH and is one catalog/cart item.

Setup: normal; /books/zvychajna-and-inaksha; default selection and all product content.

Expected next action: Buy/add the bundle or compare individual editions.

Captures: desktop 1440 × 900, mobile 390 × 844, narrow 360 × 844; ordered left to right below. Full-page supplements are shown; export heights vary. All originals, UTC times and exact exported dimensions are listed in captures.json. The environment and untested-state limitations above apply to this state.

![SCR-03-bundle: desktop, mobile and narrow mobile](https://uploads.linear.app/7221c65b-38fd-4804-8810-e36f36e09ca7/87614ede-eda5-435f-8c90-55d6b9250b07/b3e02cab-5159-4932-b9a8-d01550c49b76)

Originals: `SCR-03-bundle-1440x900-full.jpg`, `SCR-03-bundle-360x844-full.jpg`, `SCR-03-bundle-390x844-full.jpg`.

### SCR-03-merch — Illustration postcards

Route: `/books/inaksha-art` (overlays retain this route).

Purpose: Present the physical illustration set linked to Інакша.

Customer must understand: This is merchandise at 299 UAH, with its own imagery and dimensions.

Setup: normal; /books/inaksha-art; default selection and all product content.

Expected next action: Buy/add postcards or return to a book.

Captures: desktop 1440 × 900, mobile 390 × 844, narrow 360 × 844; ordered left to right below. Full-page supplements are shown; export heights vary. All originals, UTC times and exact exported dimensions are listed in captures.json. The environment and untested-state limitations above apply to this state.

![SCR-03-merch: desktop, mobile and narrow mobile](https://uploads.linear.app/7221c65b-38fd-4804-8810-e36f36e09ca7/a8d40d9d-dede-4162-94e8-5ec7046d3a82/2f6c2527-c23e-4033-9928-22897c58dc37)

Originals: `SCR-03-merch-1440x900-full.jpg`, `SCR-03-merch-360x844-full.jpg`, `SCR-03-merch-390x844-full.jpg`.

### SCR-03-suggestion — Optional accompanying item

Route: `/books/inaksha` (overlays retain this route).

Purpose: Offer postcards after buying the paper sequel.

Customer must understand: The book has already been added. The suggestion is optional and has add, details and close controls.

Setup: Normal; empty browser cart; buy paper Інакша (550 UAH). Optional postcards suggestion opens after book is added; dismiss/add/details available.

Expected next action: Add postcards, open their details, or dismiss and proceed with the book.

Captures: desktop 1440 × 900, mobile 390 × 844, narrow 360 × 844; ordered left to right below. Viewport captures are shown. All originals, UTC times and exact exported dimensions are listed in captures.json. The environment and untested-state limitations above apply to this state.

![SCR-03-suggestion: desktop, mobile and narrow mobile](https://uploads.linear.app/7221c65b-38fd-4804-8810-e36f36e09ca7/f54a922a-f7a3-41bb-8cf5-ccf1251018d1/95614ebf-8698-431b-b33b-9700766a26c1)

Originals: `SCR-03-suggestion-1440x900.jpg`, `SCR-03-suggestion-360x844.jpg`, `SCR-03-suggestion-390x844.jpg`.

### SCR-04-empty — Empty cart

Route: `/books` (overlays retain this route).

Purpose: Show the cart with no items.

Customer must understand: There is no order to submit; close returns to the underlying catalog.

Setup: /books → cart; remove all items; empty cart.

Expected next action: Close the cart and choose a product.

Captures: desktop 1440 × 900, mobile 390 × 844, narrow 360 × 844; ordered left to right below. Viewport captures are shown. All originals, UTC times and exact exported dimensions are listed in captures.json. The environment and untested-state limitations above apply to this state.

![SCR-04-empty: desktop, mobile and narrow mobile](https://uploads.linear.app/7221c65b-38fd-4804-8810-e36f36e09ca7/27efa91d-93eb-4a5e-a906-caed39c65278/8630c346-1f2b-4c43-9618-f2ea243b0d1b)

Originals: `SCR-04-empty-1440x900.jpg`, `SCR-04-empty-360x844.jpg`, `SCR-04-empty-390x844.jpg`.

### SCR-04-paper — Physical cart item

Route: `/books/zvychajna` (overlays retain this route).

Purpose: Review one paper Звичайна.

Customer must understand: Quantity is one, unit/total price is 499 UAH; quantity, removal and promo controls are available.

Setup: normal; paper Звичайна quantity 1, 499 UAH; Купити opens cart.

Expected next action: Change quantity, remove, apply a promo or open checkout.

Captures: desktop 1440 × 900, mobile 390 × 844, narrow 360 × 844; ordered left to right below. Viewport captures are shown. All originals, UTC times and exact exported dimensions are listed in captures.json. The environment and untested-state limitations above apply to this state.

![SCR-04-paper: desktop, mobile and narrow mobile](https://uploads.linear.app/7221c65b-38fd-4804-8810-e36f36e09ca7/0b41fa09-6edb-4f0d-9589-e4081a41f527/4c73e6c7-d70f-4dec-8167-a3db028bc0a8)

Originals: `SCR-04-paper-1440x900.jpg`, `SCR-04-paper-360x844.jpg`, `SCR-04-paper-390x844.jpg`.

### SCR-04-paper-sequel — Sequel in cart

Route: `/books` (overlays retain this route).

Purpose: Review the sequel after the optional suggestion was dismissed.

Customer must understand: One paper Інакша costs 550 UAH; postcards are not in this cart.

Setup: One paper Інакша, 550 UAH; cart opened after suggestion.

Expected next action: Adjust the item or open checkout.

Captures: desktop 1440 × 900, mobile 390 × 844, narrow 360 × 844; ordered left to right below. Viewport captures are shown. All originals, UTC times and exact exported dimensions are listed in captures.json. The environment and untested-state limitations above apply to this state.

![SCR-04-paper-sequel: desktop, mobile and narrow mobile](https://uploads.linear.app/7221c65b-38fd-4804-8810-e36f36e09ca7/85b59819-3d9e-4e30-934b-953deb4154fc/375282c3-d2b5-4c75-81a2-c1b003ceb4e6)

Originals: `SCR-04-paper-sequel-1440x900.jpg`, `SCR-04-paper-sequel-360x844.jpg`, `SCR-04-paper-sequel-390x844.jpg`.

### SCR-04-digital — Digital-only cart

Route: `/books` (overlays retain this route).

Purpose: Review one electronic Звичайна.

Customer must understand: Price is 199 UAH and physical quantity controls are absent.

Setup: normal; digital Звичайна only; quantity 1; 199 UAH.

Expected next action: Remove, apply a promo or open the digital checkout.

Captures: desktop 1440 × 900, mobile 390 × 844, narrow 360 × 844; ordered left to right below. Viewport captures are shown. All originals, UTC times and exact exported dimensions are listed in captures.json. The environment and untested-state limitations above apply to this state.

![SCR-04-digital: desktop, mobile and narrow mobile](https://uploads.linear.app/7221c65b-38fd-4804-8810-e36f36e09ca7/e9d1d16f-b04b-4108-99ea-9d97caf50942/4d2fdd79-9cc7-409e-bf14-3a92631e404e)

Originals: `SCR-04-digital-1440x900.jpg`, `SCR-04-digital-360x844.jpg`, `SCR-04-digital-390x844.jpg`.

### SCR-04-mixed-quantity — Mixed cart and quantity change

Route: `/books` (overlays retain this route).

Purpose: Review multiple editions and a changed physical quantity.

Customer must understand: Digital quantity one plus paper quantity two totals 1197 UAH.

Setup: Digital Звичайна quantity 1 and paper quantity 2; total 1197 UAH.

Expected next action: Adjust paper quantity, remove an item or proceed with mixed checkout.

Captures: desktop 1440 × 900, mobile 390 × 844, narrow 360 × 844; ordered left to right below. Viewport captures are shown. All originals, UTC times and exact exported dimensions are listed in captures.json. The environment and untested-state limitations above apply to this state.

![SCR-04-mixed-quantity: desktop, mobile and narrow mobile](https://uploads.linear.app/7221c65b-38fd-4804-8810-e36f36e09ca7/ab09b1d5-08f5-4d14-9286-9c113c52ca33/c7de5a86-2cc7-4c76-955e-24f9f15c12db)

Originals: `SCR-04-mixed-quantity-1440x900.jpg`, `SCR-04-mixed-quantity-360x844.jpg`, `SCR-04-mixed-quantity-390x844.jpg`.

### SCR-04-removal — Cart after removal

Route: `/books` (overlays retain this route).

Purpose: Show the resulting cart after removing the digital item.

Customer must understand: Two paper copies remain, totalling 998 UAH.

Setup: Remove digital item from mixed cart; two paper copies, 998 UAH.

Expected next action: Continue adjusting the remaining item or open physical checkout.

Captures: desktop 1440 × 900, mobile 390 × 844, narrow 360 × 844; ordered left to right below. Viewport captures are shown. All originals, UTC times and exact exported dimensions are listed in captures.json. The environment and untested-state limitations above apply to this state.

![SCR-04-removal: desktop, mobile and narrow mobile](https://uploads.linear.app/7221c65b-38fd-4804-8810-e36f36e09ca7/cb9e0557-b427-4fb6-8e9f-6533118c9e8c/c514ca25-8e4a-4202-8389-b691d361a2bf)

Originals: `SCR-04-removal-1440x900.jpg`, `SCR-04-removal-360x844.jpg`, `SCR-04-removal-390x844.jpg`.

### SCR-04-promo-invalid — Rejected promo

Route: `/books/zvychajna` (overlays retain this route).

Purpose: Explain failure to apply INVALID.

Customer must understand: An error toast appears and the displayed total remains 499 UAH.

Setup: INVALID promo rejected; error toast; total stays 499 UAH.

Expected next action: Correct/retry the code or continue without a discount.

Captures: desktop 1440 × 900, mobile 390 × 844, narrow 360 × 844; ordered left to right below. Viewport captures are shown. All originals, UTC times and exact exported dimensions are listed in captures.json. The environment and untested-state limitations above apply to this state.

![SCR-04-promo-invalid: desktop, mobile and narrow mobile](https://uploads.linear.app/7221c65b-38fd-4804-8810-e36f36e09ca7/e4abaa4b-74c0-4fd8-b813-4a31330abe2f/672dea45-fe26-4675-89f9-5c4fbf4278ff)

Originals: `SCR-04-promo-invalid-1440x900.jpg`, `SCR-04-promo-invalid-360x844.jpg`, `SCR-04-promo-invalid-390x844.jpg`.

### SCR-04-promo-applied — Applied promo

Route: `/books/zvychajna` (overlays retain this route).

Purpose: Show the accepted controlled BASELINE10 code.

Customer must understand: The API double provides a global 10% promo. Current UI displays a 50 UAH discount and 449 UAH total; these are display values, not a payment reconciliation assertion.

Setup: Mock BASELINE10, 10%; displayed discount 50 UAH, total 449 UAH.

Expected next action: Remove/change the promo or proceed to checkout.

Captures: desktop 1440 × 900, mobile 390 × 844, narrow 360 × 844; ordered left to right below. Viewport captures are shown. All originals, UTC times and exact exported dimensions are listed in captures.json. The environment and untested-state limitations above apply to this state.

![SCR-04-promo-applied: desktop, mobile and narrow mobile](https://uploads.linear.app/7221c65b-38fd-4804-8810-e36f36e09ca7/e5a8e4dd-e06c-4fcd-8bd7-bc2fb3cc4350/767620d2-793e-49cc-b043-788150302655)

Originals: `SCR-04-promo-applied-1440x900.jpg`, `SCR-04-promo-applied-360x844.jpg`, `SCR-04-promo-applied-390x844.jpg`.

### SCR-05-paper — Physical checkout

Route: `/books/zvychajna` (overlays retain this route).

Purpose: Collect customer and shipping details while reviewing the discounted order.

Customer must understand: Names, email, phone and Nova Post branch are required; comment is optional. The form and order summary scroll within the dialog.

Setup: Paper plus BASELINE10 → blank physical checkout.

Expected next action: Fill required fields, select a branch and confirm the order.

Captures: desktop 1440 × 900, mobile 390 × 844, narrow 360 × 844; ordered left to right below. Viewport captures are shown. All originals, UTC times and exact exported dimensions are listed in captures.json. The environment and untested-state limitations above apply to this state.

![SCR-05-paper: desktop, mobile and narrow mobile](https://uploads.linear.app/7221c65b-38fd-4804-8810-e36f36e09ca7/90fc171a-6458-4963-b079-22ae7249fecc/d16afdf3-e547-46a5-8f04-236e626a755f)

Originals: `SCR-05-paper-1440x900.jpg`, `SCR-05-paper-360x844.jpg`, `SCR-05-paper-390x844.jpg`.

### SCR-05-digital — Digital checkout

Route: `/books` (overlays retain this route).

Purpose: Collect the information needed for digital delivery.

Customer must understand: Only names and email are required; comment is optional. Phone and shipping fields are absent.

Setup: Digital-only checkout; only names/email and optional note; no delivery or phone fields.

Expected next action: Complete the fields and confirm the order.

Captures: desktop 1440 × 900, mobile 390 × 844, narrow 360 × 844; ordered left to right below. Viewport captures are shown. All originals, UTC times and exact exported dimensions are listed in captures.json. The environment and untested-state limitations above apply to this state.

![SCR-05-digital: desktop, mobile and narrow mobile](https://uploads.linear.app/7221c65b-38fd-4804-8810-e36f36e09ca7/772e1e7d-6055-4649-96f6-eb49770b71eb/b35627b6-f451-4fd9-af3b-265d53c3894c)

Originals: `SCR-05-digital-1440x900.jpg`, `SCR-05-digital-360x844.jpg`, `SCR-05-digital-390x844.jpg`.

### SCR-05-summary — Checkout order summary

Route: `/books/inaksha` (overlays retain this route).

Purpose: Expose the lower form and order review at each size.

Customer must understand: This independent sample contains one paper Інакша at 550 UAH, no promo and blank customer fields. It is not the discounted Звичайна scenario.

Setup: Normal; buy paper Інакша 550 UAH; dismiss suggestion; open cart then checkout; scroll inside checkout to order summary. No promo, blank customer.

Expected next action: Review item/total, return to fields if necessary and confirm when complete.

Captures: desktop 1440 × 900, mobile 390 × 844, narrow 360 × 844; ordered left to right below. Viewport captures are shown. All originals, UTC times and exact exported dimensions are listed in captures.json. The environment and untested-state limitations above apply to this state.

![SCR-05-summary: desktop, mobile and narrow mobile](https://uploads.linear.app/7221c65b-38fd-4804-8810-e36f36e09ca7/c1321c9c-eaba-4a4e-bc4a-d618d2a9be78/1d05a225-a382-4fc7-9449-6f93188125a5)

Originals: `SCR-05-summary-1440x900.jpg`, `SCR-05-summary-360x844.jpg`, `SCR-05-summary-390x844.jpg`.

### SCR-05-validation — Required-field errors

Route: `/books/zvychajna` (overlays retain this route).

Purpose: Guide correction after submitting a blank physical form.

Customer must understand: Five required-field errors appear; no invoice request is made by this invalid submission.

Setup: Blank physical checkout submit; five required-field errors; no invoice request made.

Expected next action: Correct the highlighted fields and choose a delivery branch.

Captures: desktop 1440 × 900, mobile 390 × 844, narrow 360 × 844; ordered left to right below. Viewport captures are shown. All originals, UTC times and exact exported dimensions are listed in captures.json. The environment and untested-state limitations above apply to this state.

![SCR-05-validation: desktop, mobile and narrow mobile](https://uploads.linear.app/7221c65b-38fd-4804-8810-e36f36e09ca7/f8dadf8f-e12d-4afb-9362-7f92a215c28f/6a120ec8-3d34-4456-8193-14a73c62168b)

Originals: `SCR-05-validation-1440x900.jpg`, `SCR-05-validation-360x844.jpg`, `SCR-05-validation-390x844.jpg`.

### SCR-05-delivery-picker — Nova Post branch selection

Route: `/books/zvychajna` (overlays retain this route).

Purpose: Choose a shipping destination from the embedded external widget.

Customer must understand: The widget initially lists Kyiv branches. No geolocation permission was granted; content is live and may change.

Setup: External Nova Post picker; default Kyiv; no geolocation permission granted.

Expected next action: Choose a branch or close the picker; then continue checkout.

Captures: desktop 1440 × 900, mobile 390 × 844, narrow 360 × 844; ordered left to right below. Viewport captures are shown. All originals, UTC times and exact exported dimensions are listed in captures.json. The environment and untested-state limitations above apply to this state.

![SCR-05-delivery-picker: desktop, mobile and narrow mobile](https://uploads.linear.app/7221c65b-38fd-4804-8810-e36f36e09ca7/3058b614-1008-440a-9d04-527a76c92b7a/90d1cead-31f9-4fe9-89f2-25156ef3b684)

Originals: `SCR-05-delivery-picker-1440x900.jpg`, `SCR-05-delivery-picker-360x844.jpg`, `SCR-05-delivery-picker-390x844.jpg`.

### SCR-05-invoice-error — Order-request failure

Route: `/books/zvychajna` (overlays retain this route).

Purpose: Keep a completed form available after the controlled local API returns 500.

Customer must understand: An error toast appears and the synthetic customer, selected branch and note remain; no real order or payment was created.

Setup: invoice-error; synthetic customer, selected public Kyiv branch №1, 44-character note; local API returns 500; error toast and form retained for retry.

Expected next action: Retry or close/edit the form.

Captures: desktop 1440 × 900, mobile 390 × 844, narrow 360 × 844; ordered left to right below. Viewport captures are shown. All originals, UTC times and exact exported dimensions are listed in captures.json. The environment and untested-state limitations above apply to this state.

![SCR-05-invoice-error: desktop, mobile and narrow mobile](https://uploads.linear.app/7221c65b-38fd-4804-8810-e36f36e09ca7/8e7c4e8e-e81d-4d9d-877f-af8020ef91e5/5314d3a3-1231-495b-b45c-3228b420b4a5)

Originals: `SCR-05-invoice-error-1440x900.jpg`, `SCR-05-invoice-error-360x844.jpg`, `SCR-05-invoice-error-390x844.jpg`.

### SCR-05-submitting — Order-request loading

Route: `/books/zvychajna` (overlays retain this route).

Purpose: Communicate that confirmation is in progress.

Customer must understand: The controlled API waits 15 seconds; Обробка замовлення... replaces the button label and submission is disabled.

Setup: invoice-loading; retry valid physical form; API waits 15s; button shows Обробка замовлення... and is disabled.

Expected next action: Wait for the request result; this capture does not prove provider acceptance.

Captures: desktop 1440 × 900, mobile 390 × 844, narrow 360 × 844; ordered left to right below. Viewport captures are shown. All originals, UTC times and exact exported dimensions are listed in captures.json. The environment and untested-state limitations above apply to this state.

![SCR-05-submitting: desktop, mobile and narrow mobile](https://uploads.linear.app/7221c65b-38fd-4804-8810-e36f36e09ca7/bbd68fef-d561-4529-aa63-fcddb487bfbc/b026cffd-d5a4-4e3a-9580-4b4af294e038)

Originals: `SCR-05-submitting-1440x900.jpg`, `SCR-05-submitting-360x844.jpg`, `SCR-05-submitting-390x844.jpg`.

### SCR-06-return — Controlled handoff return

Route: `/` (overlays retain this route).

Purpose: Record the frontend response to a successful local mock invoice response.

Customer must understand: The mock redirect returns home, closes checkout and clears the cart. There is no payment confirmation or receipt on this screen.

Setup: Local mock invoice acceptance redirects to /; checkout closes and cart clears; no payment confirmation. Not verified Monobank success.

Expected next action: Use home navigation; real payment outcomes require separate verification.

Captures: desktop 1440 × 900, mobile 390 × 844, narrow 360 × 844; ordered left to right below. Viewport captures are shown. All originals, UTC times and exact exported dimensions are listed in captures.json. The environment and untested-state limitations above apply to this state.

![SCR-06-return: desktop, mobile and narrow mobile](https://uploads.linear.app/7221c65b-38fd-4804-8810-e36f36e09ca7/1cfefac9-de7d-4759-8e61-d8da925de17e/62f903f8-af39-446b-b261-28d5d9b23601)

Originals: `SCR-06-return-1440x900.jpg`, `SCR-06-return-360x844.jpg`, `SCR-06-return-390x844.jpg`.

### SCR-07-events — Events

Route: `/events` (overlays retain this route).

Purpose: Discover author appearances and their external detail links.

Customer must understand: All three entries are in the past group on the capture date; there is no dedicated event-detail route.

Setup: Normal catalog; /events; all events are grouped as past at capture date; first carousel images.

Expected next action: Open an external event link or return to the shop.

Captures: desktop 1440 × 900, mobile 390 × 844, narrow 360 × 844; ordered left to right below. Full-page supplements are shown; export heights vary. All originals, UTC times and exact exported dimensions are listed in captures.json. The environment and untested-state limitations above apply to this state.

![SCR-07-events: desktop, mobile and narrow mobile](https://uploads.linear.app/7221c65b-38fd-4804-8810-e36f36e09ca7/7e209cc4-9d11-432d-953a-88c0cca05cd1/fb08d8b9-9f15-4f8a-8952-4bcb6ca42fea)

Originals: `SCR-07-events-1440x900-full.jpg`, `SCR-07-events-360x844-full.jpg`, `SCR-07-events-390x844-full.jpg`.

### SCR-08-about — About the author

Route: `/about` (overlays retain this route).

Purpose: Introduce the author and offer contact paths.

Customer must understand: Read the biography and identify contact/social links in the footer.

Setup: /about; author introduction and contact links; no order state.

Expected next action: Browse books, events or an external contact destination.

Captures: desktop 1440 × 900, mobile 390 × 844, narrow 360 × 844; ordered left to right below. Full-page supplements are shown; export heights vary. All originals, UTC times and exact exported dimensions are listed in captures.json. The environment and untested-state limitations above apply to this state.

![SCR-08-about: desktop, mobile and narrow mobile](https://uploads.linear.app/7221c65b-38fd-4804-8810-e36f36e09ca7/26c228d0-8e71-411c-b382-15875802ba8a/a3543253-c2fe-4f48-b807-4a1479949428)

Originals: `SCR-08-about-1440x900-full.jpg`, `SCR-08-about-360x844-full.jpg`, `SCR-08-about-390x844-full.jpg`.

### SCR-09-policy — Returns and exchange

Route: `/return-policy` (overlays retain this route).

Purpose: Explain the storefront's published return/exchange process.

Customer must understand: Read conditions, steps and contact details before requesting assistance; this is documentation of displayed content, not legal verification.

Setup: /return-policy; returns/exchange content linked from footer.

Expected next action: Contact the author or return to browsing.

Captures: desktop 1440 × 900, mobile 390 × 844, narrow 360 × 844; ordered left to right below. Full-page supplements are shown; export heights vary. All originals, UTC times and exact exported dimensions are listed in captures.json. The environment and untested-state limitations above apply to this state.

![SCR-09-policy: desktop, mobile and narrow mobile](https://uploads.linear.app/7221c65b-38fd-4804-8810-e36f36e09ca7/2df516fd-cde9-46a7-a715-0db7e4cf4dd7/df1c98aa-89f3-419b-b530-8de4b3b32d10)

Originals: `SCR-09-policy-1440x900-full.jpg`, `SCR-09-policy-360x844-full.jpg`, `SCR-09-policy-390x844-full.jpg`.

### SCR-10-error — Product loading failure

Route: `/books/inaksha` (overlays retain this route).

Purpose: Provide recovery after a controlled product API 500.

Customer must understand: The branded Не вдалося завантажити сторінку screen offers retry and catalog navigation.

Setup: product-error; invalidate /books/inaksha cache then reload; API returns 500; branded recovery screen.

Expected next action: Retry after recovery or return to the catalog.

Captures: desktop 1440 × 900, mobile 390 × 844, narrow 360 × 844; ordered left to right below. Viewport captures are shown. All originals, UTC times and exact exported dimensions are listed in captures.json. The environment and untested-state limitations above apply to this state.

![SCR-10-error: desktop, mobile and narrow mobile](https://uploads.linear.app/7221c65b-38fd-4804-8810-e36f36e09ca7/ee16dbee-f65b-4eaa-a7c2-3875724daaee/1383a3b0-e771-45ae-9531-aa4a48487fed)

Originals: `SCR-10-error-1440x900.jpg`, `SCR-10-error-360x844.jpg`, `SCR-10-error-390x844.jpg`.

### SCR-10-recovered — Successful retry

Route: `/books/inaksha` (overlays retain this route).

Purpose: Show the product route recovering without a new URL.

Customer must understand: After restoring normal data and invalidating the cache, retry displays Інакша again.

Setup: Reset API normal, invalidate cache, click Спробувати ще раз; same product route recovers.

Expected next action: Resume selection or return to the catalog.

Captures: desktop 1440 × 900, mobile 390 × 844, narrow 360 × 844; ordered left to right below. Full-page supplements are shown; export heights vary. All originals, UTC times and exact exported dimensions are listed in captures.json. The environment and untested-state limitations above apply to this state.

![SCR-10-recovered: desktop, mobile and narrow mobile](https://uploads.linear.app/7221c65b-38fd-4804-8810-e36f36e09ca7/817a1564-b261-4eff-b42d-82a6dced7fa9/90dd5fe0-58c6-4b75-a936-62f75697a223)

Originals: `SCR-10-recovered-1440x900-full.jpg`, `SCR-10-recovered-360x844-full.jpg`, `SCR-10-recovered-390x844-full.jpg`.

### SCR-10-not-found — Missing product

Route: `/books/does-not-exist` (overlays retain this route).

Purpose: Explain a nonexistent product URL.

Customer must understand: The branded Цю сторінку не знайдено screen has a catalog action.

Setup: normal; /books/does-not-exist; missing product; branded 404 with catalog action.

Expected next action: Return to the catalog and choose an existing product.

Captures: desktop 1440 × 900, mobile 390 × 844, narrow 360 × 844; ordered left to right below. Viewport captures are shown. All originals, UTC times and exact exported dimensions are listed in captures.json. The environment and untested-state limitations above apply to this state.

![SCR-10-not-found: desktop, mobile and narrow mobile](https://uploads.linear.app/7221c65b-38fd-4804-8810-e36f36e09ca7/28ef7715-eb5a-4d09-9c65-d96fe70e3929/5e3926a6-bc7f-4662-99cd-944e66eec57e)

Originals: `SCR-10-not-found-1440x900.jpg`, `SCR-10-not-found-360x844.jpg`, `SCR-10-not-found-390x844.jpg`.
