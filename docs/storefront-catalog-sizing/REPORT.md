# ZVY-73: mobile catalog text and quick-add sizing

Verified on 2026-10-07 (Europe/Kyiv). [ZVY-73](https://linear.app/zvychajna/issue/ZVY-73), approved scope [F-DISC-004](../storefront-review/DECISIONS.md#f-disc-004-mobile-readability-and-targets). Final journey handoff: [ZVY-58](https://linear.app/zvychajna/issue/ZVY-58).

## Implemented result

Within the existing `max-width: 520px` breakpoint, format labels now occupy the full row above price and quick-add. Format and price text is 14 CSS px (previously 11.2px); buttons are 44 × 44 CSS px (previously 26 × 26). Long format labels and amounts can wrap instead of clipping. Preorder disclosure remains below the price/action row.

The two-column phone grid, cover and title arrangement, two-line title clamp, colors, focus treatment, and edition-selection behavior are preserved. All application changes are in `src/components/molecules/BookCard.module.css`. The existing non-semantic format wrappers use `display: contents` on mobile so their children participate in the row grid. No component markup, cart rules, API contracts or backend code changed.

Created files: `tests/e2e/catalog-mobile-sizing.spec.ts`, this report, six full-page before/after JPEGs, six matching measurement JSON files, and two labeled comparison JPEGs in this directory. The comparisons place the original screenshots side by side without rescaling.

## Environment and evidence provenance

Branch `codex/zvy-73-mobile-catalog-sizing`, based on updated frontend `main` at `34a608fa2dc8db4761ce13290bd09016621844fe`. Next.js 16.3.4 production build, Node.js 24.11.1, Playwright 1.63.0 and bundled Chromium. Local application: `http://127.0.0.1:3100`; deterministic API double: `http://127.0.0.1:4100`. Phone contexts emulate touch. Tested route: `/books`.

Matching captures use all six products from the approved historical [catalog snapshot](../storefront-baseline/catalog-snapshot.json), supplied through a browser route double after the normal provider refresh. Image URLs are normalized to repository assets. The local build uses the standard deterministic test API; browser requests to non-local hosts are blocked. Both phases use the same snapshot, viewport, fonts and image readiness checks, empty cart and scroll position. The before captures ran with the original base stylesheet, before applying the mobile change. This is controlled local evidence, not a fresh production inspection.

| Viewport | Before | After | Comparison |
| --- | --- | --- | --- |
| 390 × 844 | [Screenshot](before/SCR-02-default-390x844.jpg) / [Measurements](before/SCR-02-default-390x844.json) | [Screenshot](after/SCR-02-default-390x844.jpg) / [Measurements](after/SCR-02-default-390x844.json) | [Side by side](comparison-390.jpg) |
| 360 × 844 | [Screenshot](before/SCR-02-default-360x844.jpg) / [Measurements](before/SCR-02-default-360x844.json) | [Screenshot](after/SCR-02-default-360x844.jpg) / [Measurements](after/SCR-02-default-360x844.json) | [Side by side](comparison-360.jpg) |
| 1440 × 900 | [Screenshot](before/SCR-02-default-1440x900.jpg) / [Measurements](before/SCR-02-default-1440x900.json) | [Screenshot](after/SCR-02-default-1440x900.jpg) / [Measurements](after/SCR-02-default-1440x900.json) | Original JPEG bytes are identical |

## Browsing tradeoff

In this six-product snapshot, a one-edition format block grows from 36px to approximately 75.8px; a two-edition block grows from 72px to approximately 151.6px. The preorder block grows from approximately 43px to 96.4px. The second product row starts about 39.8px lower on both phones; the third starts about 119.4px lower. Grid widths and title size, line height and clamp match their respective before measurements.

| Width | Before full-page height | After full-page height | Increase |
| --- | ---: | ---: | ---: |
| 360px | 1561px | 1733px | 172px (11.0%) |
| 390px | 1628px | 1801px | 173px (10.6%) |
| 1440px | 1553px | 1553px | 0px |

Larger text and targets require more scrolling to browse the same products. The initial phone viewport exposes less of the next product row. These measurements describe this snapshot only; no conversion improvement or real-phone comfort improvement is assumed.

## Verification

- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run test:fixtures`: four deterministic fixture contracts passed.
- Production build through the standard Playwright `tests/support/test-app.mjs`: passed for both capture phases.
- Before capture: three matching snapshot captures passed.
- `ZVY73_EVIDENCE_PHASE=after npm run test:e2e -- catalog-mobile-sizing books-grid-rating preorder-labels keyboard-navigation accessibility`: 45 passed.
- Layout assertions cover 320, 360, 390, 520, 521, 640, 768 and 1440px. Mobile tests check two columns, full label/price containment, 14px text, 44px targets, label-above-action placement, no overlapping buttons and no page overflow. Edge data includes a long merchandise label and 12345.67 UAH amount. Desktop keeps the original long-label handling; it is outside this mobile change.
- Interaction tests at 360/390/1440px assert intended item IDs, formats and quantities for touch/click, Enter and Space. They exercise discounted paper preorder (449 UAH), available ebook (199 UAH), total 648 UAH, disabled unavailable editions, reopening an existing cart item without duplicating it, and Escape/focus restoration. Invoice request count stays zero.
- Existing ratings, preorder, keyboard and axe checks pass with the repository's established color-contrast exception. No new accessibility rule exceptions were introduced.
- Desktop card measurements and full-page height match before; full-page JPEG bytes are identical. Phone horizontal positions, widths and title styling match before.
- `git diff --check`: passed. The application diff contains only rules inside the existing mobile media query. Self-review found no changes to selection, pricing, navigation, title layout or desktop styling.
- Required GitHub `verify` is checked on the PR's current head, with its actual result recorded in the PR handoff. Local checks alone do not satisfy that gate.

To repeat after captures, set `ZVY73_EVIDENCE_PHASE=after` and run `npm run test:e2e -- catalog-mobile-sizing --grep "records matching"`. Before captures require restoring the base stylesheet as well as setting the phase to `before`; the variable alone does not restore the old design. Capture tests skip in ordinary CI because repository evidence writing is opt-in.

## Acceptance and handoff

| Acceptance criterion | Result |
| --- | --- |
| Two columns, current titles, format above price/button, minimum sizing | Implemented; 320/360/390/520px layout tests and matching captures pass |
| Full format/amount/currency, intended touch/keyboard edition, non-overlapping targets | Implemented and tested with ordinary, long-label, discounted, preorder, digital, unavailable and in-cart states |
| Existing mobile breakpoint only; desktop and intermediate/reflow checks | Implemented; 521/640/768/1440px checks pass and desktop screenshot is identical |
| Baseline comparison, increased-scroll tradeoff, final owner review | Evidence and tradeoff recorded; implemented result presented for owner review, acceptance remains pending |
| Green CI, code review and availability in the recorded final verification environment | CI result is recorded on the PR; code review and final verification-environment handoff remain required |

Netlify is explicitly skipped: commit subjects and PR title carry `[skip netlify]`, and the eventual merge/squash subject must preserve it. No Netlify deploy or provider-preview result is claimed. The local production environment above is the recorded implementation-verification environment; final ZVY-58 journey verification must record its own reviewed revision and environment.

The owner must accept the implemented mobile result before ZVY-58 sign-off and may reject it. Real-phone/browser behavior, screen-reader speech, 200% enlargement and final journey/provider/payment checks have no new evidence here; emulation is not a real-phone pass. Deferred contrast/cover-title work and rejected extra labels, title-layout and shared focus-outline redesign remain outside scope. Do not mark this issue fully accepted based only on automated checks or provisional approval to implement.
