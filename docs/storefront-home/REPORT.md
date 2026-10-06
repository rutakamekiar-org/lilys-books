# ZVY-61 — Mobile homepage offer order

Implemented locally on 2026-10-06, Europe/Kyiv, on `codex/zvy-61-mobile-home-order`, based on updated storefront `origin/main` at `919b057`. [Issue and approved scope](https://linear.app/zvychajna/issue/ZVY-61); [approved decisions](../storefront-review/DECISIONS.md#f-disc-006-earlier-home-action).

Owner refinement on 2026-10-06: move the mobile price and Детальніше above only the Goodreads button; preserve the rating position. The final mobile order is title/genre → rating → price → Детальніше → Goodreads reviews button → full description. Desktop keeps the original hierarchy.

## Result and acceptance criteria

| Criterion | Local result and evidence |
| --- | --- |
| Price and Детальніше before the long description at 390/360 px; full description and navigation available | Implemented. The mobile title, genre and original rating are followed by the starting price and Details link, then the Goodreads reviews button and full description. The existing 560 px mobile breakpoint is used. |
| Correct featured book, effective price, missing-data behavior, reading/focus order and unclipped controls | Implemented and tested. The existing product selection and `getMinPrice` rules remain. Discounted, undiscounted, free and absent editions are covered. Missing editions omit the price and retain Details; failed/empty refreshes retain the initial snapshot; a catalog initially empty shows no hero/offer and keeps navigation. Long mobile titles wrap. Keyboard activation reaches the featured book with zero invoice requests. |
| Preserve desktop hierarchy and cover/title arrangement; record matching evidence | Implemented. Desktop 1440×900 viewport captures have identical SHA-256 hashes. Cover/title bounding boxes, title font sizes and link destinations match before/after at all three widths. |

Desktop renders the original combined Goodreads controls. Mobile renders the same rating and reviews button separately, keeping the rating in its original position and placing only the button after Details. `display: none` removes unused responsive placements from layout and the accessibility tree. There is one accessible set of Goodreads links, one visible description, one price and one Details link. Reading/focus order matches the visible order. No viewport-dependent JavaScript or additional data requests are introduced.

## Before and after

Captured in Chromium against the approved historical [catalog snapshot](../storefront-baseline/catalog-snapshot.json), served locally by the existing [baseline API double](../storefront-baseline/capture-api.mjs). This is controlled evidence, not a current production check. Both phases run a production build with the API set to `http://127.0.0.1:4100` and the site to `http://127.0.0.1:3100`; browser requests outside loopback are blocked.

- [390×844 comparison](comparison-390x844.png)
- [360×844 comparison](comparison-360x844.png)
- [1440×900 comparison](comparison-1440x900.png)

Mobile comparisons show the title/offer area at the same scroll offset, preserving the sticky navigation and unedited screenshot pixels. Only the three final comparisons are retained; temporary viewport/full-page captures, capture measurements and debugging images were removed at the owner's request. The 390 px action moves from document y=1271 to y=807; at 360 px it moves from y=1247 to y=758. Rating crops matched the original pixels within one RGB step, accounting for the subtle card-background gradient as card height changes. The current large cover remains; arbitrary future titles have no first-viewport guarantee.

Desktop viewport SHA-256, identical before and after: `732734627EAAFFD7587E51B4F942583284FB5765CE5D49EE349DE3DCF8FB78E2`.

## Validation

- Production build with deterministic local API: passed.
- Repository lint and typecheck: passed. Final changed-file lint and typecheck also passed after test additions.
- Fixture contracts: all four fixtures passed.
- Focused browser checks: initial 12 passed; the expanded suite includes 15 ZVY-61 cases.
- Full browser suite before the Goodreads refinement: all 146 tests passed in 4.3 minutes, including all 15 ZVY-61 cases, across the existing desktop, 320 px and 390 px projects (ZVY-61 also explicitly exercises 360 px).
- Final button-only refinement: all 34 homepage, shared rating, accessibility and keyboard checks passed. Mobile tests enforce rating before price and Details before the reviews button, plus matching tab order. Production build, changed-file lint and typecheck passed again. Capture checks preserve original rating pixels (one RGB-step background tolerance), cover/title geometry and identical desktop screenshots.
- Diff whitespace check: passed.

Tests use the repository's local API double and make no real payment requests. Coverage includes physical/digital effective minimum prices, zero discounts, no editions, absent description, oversized titles, refresh failure/empty responses, genuinely empty initial catalog, retained navigation, reading order, hidden duplicate exclusion from the accessibility tree, keyboard focus/activation and axe scans at 1440/390/360 px. The full suite also covers existing book selection, excerpt/gallery, cart, checkout, navigation and performance behavior.

## Changed files and reproduction

- `src/components/organisms/Hero.tsx`: retain mobile rating above the offer; move only the reviews button and description below the single offer/action.
- `src/components/molecules/GoodreadsRating.tsx`: optional rating/reviews-only rendering, preserving combined rendering by default for all existing consumers.
- `src/app/page.module.css`: hide the mobile supporting placement by default and swap placements at 560 px; preserve desktop geometry and space the mobile supporting content.
- `tests/e2e/home-featured.spec.ts`: 15 deterministic browser regression cases.
- `docs/storefront-home/REPORT.md`: this result, evidence and handoff.
- `docs/storefront-home/capture.mjs`: reproducible capture, layout comparisons and side-by-side image assembly.
- `docs/storefront-home/comparison-{1440x900,390x844,360x844}.png`: labelled comparisons.

To reproduce a phase: start `node docs/storefront-baseline/capture-api.mjs`; run `node tests/support/test-app.mjs` with the loopback API/site URLs above, `NEXT_TELEMETRY_DISABLED=1` and `REVALIDATION_SECRET=local-home-capture`; after the production server is ready run `node docs/storefront-home/capture.mjs before` on base revision `919b057`, or `after` with the implementation. Use the same Chromium rendering environment for both phases. The capture command revalidates local data to remove stale test fixtures; the after command verifies rating pixels and cover/title invariants and generates the comparisons. Stop both servers before running `npm run test:e2e`.

Regenerate both phases when reproducing: the raw `before/` and `after/` images and measurements are temporary output and were removed after the final comparisons were assembled.

## Remaining handoff

Local implementation and self-review are complete and all local checks passed. Remote `verify` CI, code review and availability in the recorded verification environment remain required before final handoff to [ZVY-58](https://linear.app/zvychajna/issue/ZVY-58). No remote CI result has been retrieved for this local change; the branch has not been pushed or deployed. ZVY-61 remains In Progress.

These Chromium captures and tests are emulation evidence. Real-phone behavior, software keyboard interaction, actual screen-reader speech, provider/payment outcomes and final owner acceptance remain separate ZVY-58 evidence or explicit owner dispositions. No backend contracts or payment paths changed.
