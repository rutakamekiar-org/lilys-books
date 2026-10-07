# ZVY-73: mobile catalog text and quick-add sizing

Verified on 2026-10-07 (Europe/Kyiv). [ZVY-73](https://linear.app/zvychajna/issue/ZVY-73), approved scope [F-DISC-004](../storefront-review/DECISIONS.md#f-disc-004-mobile-readability-and-targets). Final journey handoff: [ZVY-58](https://linear.app/zvychajna/issue/ZVY-58).

## Implemented result

Within the existing `max-width: 520px` breakpoint, format labels remain above their bold prices, with each price centered beside a circular quick-add button. Format and price text is 14 CSS px (previously 11.2px); buttons retain their 44 × 44 CSS px tap target (previously 26 × 26). Long format labels and amounts can wrap instead of clipping. Preorder disclosure remains below the price/action row.

After reviewing the initial After design, the owner requested tighter spacing between each format and price, slightly more separation between editions, less unused height for single-option cards, prominent bold prices, and a less dominant button background. This explicit refinement preserves the stacked format/price arrangement rather than restoring the original inline row. The label occupies the price column and uses spare space beside the button; price padding protects wrapped text. Option-to-option margin/padding increases from 3/5px to 6/7px. The pale button background mixes 45% of the original accent surface with the white card surface; its circle and tap target remain 44px.

The two-column phone grid, covers, title arrangement, two-line title clamp, ratings, separator appearance, price/label colors, focus treatment, and edition-selection behavior are preserved. All application changes are in `src/components/molecules/BookCard.module.css`. The existing non-semantic format wrappers use `display: contents` on mobile so their children participate in the row grid. No component markup, cart rules, API contracts or backend code changed.

Created files: `tests/e2e/catalog-mobile-sizing.spec.ts`, this report, full-page screenshots and measurement JSONs under `before`, `initial-after` and `after`, original-to-refined comparisons `comparison-360.jpg`/`comparison-390.jpg`, initial-After-to-refined comparisons `refinement-360.jpg`/`refinement-390.jpg`, and the cropped purchase-area comparison `refinement-details-390.jpg`. Initial comparisons are retained under `initial-after`. Comparisons use actual screenshots without rescaling.

## Environment and evidence provenance

Branch `codex/zvy-73-mobile-catalog-sizing`, based on updated frontend `main` at `34a608fa2dc8db4761ce13290bd09016621844fe`. Next.js 16.3.4 production build, Node.js 24.11.1, Playwright 1.63.0 and bundled Chromium. Local application: `http://127.0.0.1:3100`; deterministic API double: `http://127.0.0.1:4100`. Phone contexts emulate touch. Tested route: `/books`.

Matching captures use all six products from the approved historical [catalog snapshot](../storefront-baseline/catalog-snapshot.json), supplied through a browser route double after the normal provider refresh. Image URLs are normalized to repository assets. The local build uses the standard deterministic test API; browser requests to non-local hosts are blocked. All three phases use the same snapshot, viewport, fonts and image readiness checks, empty cart and scroll position. Before captures use the original base stylesheet. The initial After at `9a71d97879acaa7cddd6ac6e963f6bda4ec0d510` is preserved under `initial-after`; current `after` captures use the owner-requested refinement. This is controlled local evidence, not a fresh production inspection.

| Viewport | Before | After | Comparison |
| --- | --- | --- | --- |
| 390 × 844 | [Screenshot](before/SCR-02-default-390x844.jpg) / [Measurements](before/SCR-02-default-390x844.json) | [Screenshot](after/SCR-02-default-390x844.jpg) / [Measurements](after/SCR-02-default-390x844.json) | [Side by side](comparison-390.jpg) |
| 360 × 844 | [Screenshot](before/SCR-02-default-360x844.jpg) / [Measurements](before/SCR-02-default-360x844.json) | [Screenshot](after/SCR-02-default-360x844.jpg) / [Measurements](after/SCR-02-default-360x844.json) | [Side by side](comparison-360.jpg) |
| 1440 × 900 | [Screenshot](before/SCR-02-default-1440x900.jpg) / [Measurements](before/SCR-02-default-1440x900.json) | [Screenshot](after/SCR-02-default-1440x900.jpg) / [Measurements](after/SCR-02-default-1440x900.json) | Original JPEG bytes are identical |

## Browsing tradeoff

In this six-product snapshot, the refined one-edition format block measures approximately 66.8px, compared with 75.8px in the initial After and 36px in the original Before. A two-edition block measures approximately 138.6px, compared with 151.6px and 72px respectively. The preorder block measures approximately 82.4px, compared with 96.4px and 43px. Thus the refinement removes 9px from a one-option block, 13px from a two-option block and 14px from the preorder block. Grid widths and title size, line height and clamp match both earlier versions.

| Width | Original Before | Initial After | Refined After | Change from initial After |
| --- | ---: | ---: | ---: | ---: |
| 360px | 1561px | 1733px | 1697px | −36px |
| 390px | 1628px | 1801px | 1765px | −36px |
| 1440px | 1553px | 1553px | 1553px | 0px |

Initial After versus refined: [390px full page](refinement-390.jpg), [360px full page](refinement-360.jpg), [390px purchase details](refinement-details-390.jpg). At 390px the refined page is 36px shorter than the initial After and remains 137px (8.4%) taller than the original Before. At 360px it remains 136px (8.7%) taller. The first product row is 9px shorter and the two-edition row is 13px shorter than the initial After; their covers and title/rating blocks are unchanged.

Larger text and targets require more scrolling to browse the same products. The initial phone viewport exposes less of the next product row. These measurements describe this snapshot only; no conversion improvement or real-phone comfort improvement is assumed.

## Verification

- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run test:fixtures`: four deterministic fixture contracts passed.
- Production build through the standard Playwright `tests/support/test-app.mjs`: passed for both capture phases.
- Before capture: three matching snapshot captures passed.
- `ZVY73_EVIDENCE_PHASE=after npm run test:e2e -- catalog-mobile-sizing books-grid-rating preorder-labels keyboard-navigation accessibility`: 45 passed.
- Layout assertions cover 320, 360, 390, 520, 521, 640, 768 and 1440px. Mobile tests check two columns, full label/price containment, 14px text, 44px targets, stacked format/price text without overlap, price prominence, centered price/button alignment, tighter within-option spacing than between-option spacing, no overlapping buttons and no page overflow. Edge data includes a long merchandise label and 12345.67 UAH amount. Desktop keeps the original long-label handling; it is outside this mobile change. A 320px wrapped-label/price overlap found during refinement was corrected and the strengthened test now passes.
- Interaction tests at 360/390/1440px assert intended item IDs, formats and quantities for touch/click, Enter and Space. They exercise discounted paper preorder (449 UAH), available ebook (199 UAH), total 648 UAH, disabled unavailable editions, reopening an existing cart item without duplicating it, and Escape/focus restoration. Invoice request count stays zero.
- Existing ratings, preorder, keyboard and axe checks pass with the repository's established color-contrast exception. No new accessibility rule exceptions were introduced.
- Spacing tests compare the rendered within-option glyph gap with the text size and between-option gap, allowing system-font metrics to differ across Windows and Linux. They retain independent non-overlap, containment, price weight, alignment and tap-target assertions.
- Final portable-assertion check: lint and typecheck passed; `npm run test:e2e -- catalog-mobile-sizing` passed 11 tests, with three opt-in evidence captures skipped. The production build passed. No application styling changed in this test adjustment.
- Desktop card measurements and full-page height match before; full-page JPEG bytes are identical. Phone horizontal positions, widths and title styling match before.
- `git diff --check`: passed. The application diff contains only rules inside the existing mobile media query. Self-review found no changes to selection, pricing, navigation, title layout or desktop styling.
- Required GitHub `verify` is checked on the PR's current head, with its actual result recorded in the PR handoff. Local checks alone do not satisfy that gate.

To repeat after captures, set `ZVY73_EVIDENCE_PHASE=after` and run `npm run test:e2e -- catalog-mobile-sizing --grep "records matching"`. Before captures require restoring the base stylesheet as well as setting the phase to `before`; the variable alone does not restore the old design. Capture tests skip in ordinary CI because repository evidence writing is opt-in.

## Acceptance and handoff

| Acceptance criterion | Result |
| --- | --- |
| Two columns, current titles, stacked format/price, minimum sizing, owner-requested spacing and background refinement | Implemented; 320/360/390/520px layout tests and matching captures pass; 390px catalog is 36px shorter than initial After |
| Full format/amount/currency, intended touch/keyboard edition, non-overlapping targets | Implemented and tested with ordinary, long-label, discounted, preorder, digital, unavailable and in-cart states |
| Existing mobile breakpoint only; desktop and intermediate/reflow checks | Implemented; 521/640/768/1440px checks pass and desktop screenshot is identical |
| Baseline comparison, increased-scroll tradeoff, final owner review | Evidence and tradeoff recorded; implemented result presented for owner review, acceptance remains pending |
| Green CI, code review and availability in the recorded final verification environment | CI result is recorded on the PR; code review and final verification-environment handoff remain required |

Netlify is explicitly skipped: commit subjects and PR title carry `[skip netlify]`, and the eventual merge/squash subject must preserve it. No Netlify deploy or provider-preview result is claimed. The local production environment above is the recorded implementation-verification environment; final ZVY-58 journey verification must record its own reviewed revision and environment.

The owner must accept the implemented mobile result before ZVY-58 sign-off and may reject it. Real-phone/browser behavior, screen-reader speech, 200% enlargement and final journey/provider/payment checks have no new evidence here; emulation is not a real-phone pass. Deferred contrast/cover-title work and rejected extra labels, title-layout and shared focus-outline redesign remain outside scope. Do not mark this issue fully accepted based only on automated checks or provisional approval to implement.
