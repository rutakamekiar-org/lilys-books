# ZVY-73: mobile catalog readability and density

Verified on 2026-10-07 (Europe/Kyiv). [ZVY-73](https://linear.app/zvychajna/issue/ZVY-73), approved scope [F-DISC-004](../storefront-review/DECISIONS.md#f-disc-004-mobile-readability-and-targets). Final journey handoff: [ZVY-58](https://linear.app/zvychajna/issue/ZVY-58).

## Implemented result

Within the existing `max-width: 520px` breakpoint, format labels remain on separate lines above their bold prices. Format/price text is 14 CSS px (originally 11.2px), with one 44 × 44 CSS px circular quick-add target per edition (originally 26 × 26). The price stays left, centered beside the button on the right. Long format labels and amounts wrap rather than clip. Preorder disclosure remains below the price/action row.

The owner explicitly requested several refinements after reviewing the initial After design: tighter format/price grouping, more separation between editions, compact single-format cards, a subtler button background, a 4–6px button inset and less space before subsequent separators. The current version retains the 5px right inset and mixes 45% of the original pale accent background with the card surface. Prices remain weight 800, labels weight 600; targets stay 44px.

The latest owner request adds an approximately 8–12% purchase-section height reduction and a smaller, tighter mobile page heading. Section top padding is now 4px; purchase rows have no additional vertical padding; subsequent rows retain a separator, 1px margin above and 6px padding below it. Labels use spare space alongside the target; price padding protects wrapped glyphs. Between-format spacing remains larger than label-to-price spacing. This preserves the stacked hierarchy without restoring the original inline design.

The page heading retains the exact text “Книги та мерч” and weight 700. Its mobile size is 29px, compared with 32px previously; its top margin is 11px and its following grid gap is 13px. These values reduce the rendered space above the heading by approximately 9px and below it by approximately 8px. The first product row starts 23.7px earlier at 390px. The heading remains clearly larger than 13.76px product titles. This page-heading change is explicitly authorized by the latest owner request; it does not change product-title layout.

The two-column phone grid, covers, product-title arrangement and two-line clamp, ratings, separator appearance, focus treatment, and edition-selection behavior are preserved. Application changes are limited to `src/components/molecules/BookCard.module.css`, `src/app/books/books.module.css`, and the heading class/import in `src/app/books/page.tsx`. Non-semantic format wrappers use `display: contents` on mobile. No cart rules, data providers, API contracts or backend code changed.

## Verification environment and evidence

Branch `codex/zvy-73-mobile-catalog-sizing`, based on updated frontend `main` at `34a608fa2dc8db4761ce13290bd09016621844fe`. Next.js 16.3.4 production build, Node.js 24.11.1, Playwright 1.63.0 and bundled Chromium. Local application: `http://127.0.0.1:3100`; deterministic API double: `http://127.0.0.1:4100`. Phone contexts emulate touch. Tested route: `/books`.

All captures use the same six products from the approved historical [catalog snapshot](../storefront-baseline/catalog-snapshot.json), supplied through a browser route double after provider refresh. Image URLs resolve to repository assets. Non-local browser requests are blocked; fonts and images finish loading before capture. Cart state and scroll position match. These are controlled local comparisons, not fresh production evidence.

Preserved phases:

- `before`: original base design.
- `initial-after`: first readability improvement, revision `9a71d97879acaa7cddd6ac6e963f6bda4ec0d510`.
- `previous-refinement`: first compact refinement, revision `66736743005fefdaa997d38514782813e509e42b`.
- `density-before`: design immediately preceding the latest density/heading request, revision `39262caf7d12a2792224ca70841c33c8f1eb0bfc`.
- `after`: current result, with heading and purchase-section density refinements.

| Viewport | Current Before | Current After | Latest comparison |
| --- | --- | --- | --- |
| 390 × 844 | [Screenshot](density-before/SCR-02-default-390x844.jpg) / [Measurements](density-before/SCR-02-default-390x844.json) | [Screenshot](after/SCR-02-default-390x844.jpg) / [Measurements](after/SCR-02-default-390x844.json) | [First viewport](density-390.jpg), [purchase details](density-details-390.jpg) |
| 360 × 844 | [Screenshot](density-before/SCR-02-default-360x844.jpg) / [Measurements](density-before/SCR-02-default-360x844.json) | [Screenshot](after/SCR-02-default-360x844.jpg) / [Measurements](after/SCR-02-default-360x844.json) | [First viewport](density-360.jpg) |
| 1440 × 900 | [Screenshot](before/SCR-02-default-1440x900.jpg) / [Measurements](before/SCR-02-default-1440x900.json) | [Screenshot](after/SCR-02-default-1440x900.jpg) / [Measurements](after/SCR-02-default-1440x900.json) | Original JPEG bytes are identical |

Original-to-current full-page comparisons: [390px](comparison-390.jpg), [360px](comparison-360.jpg). Initial-After-to-current: [390px](refinement-390.jpg), [360px](refinement-360.jpg), [purchase details](refinement-details-390.jpg). Earlier-refinement-to-current: [390px](adjustment-390.jpg), [360px](adjustment-360.jpg), [purchase details](adjustment-details-390.jpg). Each comparison retains source pixels without scaling.

## Density and browsing tradeoff

| Purchase section at 390px | Current Before | Current After | Reduction |
| --- | ---: | ---: | ---: |
| One format | 66.8px | 59.8px | 10.5% |
| Two formats | 134.6px | 122.6px | 8.9% |
| One preorder format | 82.4px | 75.4px | 8.5% |

The same section reductions hold at 360px. Button dimensions remain 44 × 44px. Horizontal card positions, widths, and product-title sizing, line height and clamp match the original and all intermediate versions.

| Width | Original Before | Initial After | Current Before | Current After |
| --- | ---: | ---: | ---: | ---: |
| 360px | 1561px | 1733px | 1693px | 1644px |
| 390px | 1628px | 1801px | 1761px | 1711px |
| 1440px | 1553px | 1553px | 1553px | 1553px |

At 390px the page is 50px shorter than Current Before and 90px shorter than Initial After. It remains 83px (5.1%) taller than Original Before, reflecting the larger text and targets. At 360px it remains 83px (5.3%) taller than Original Before. The first viewport exposes more of the second row than Current Before. These measurements apply to this snapshot; no conversion improvement or real-phone comfort improvement is assumed.

## Verification

- `npm run lint` and `npm run typecheck`: passed.
- `npm run test:fixtures`: four deterministic fixture contracts passed.
- Production build through the standard `tests/support/test-app.mjs`: passed.
- `ZVY73_EVIDENCE_PHASE=after npm run test:e2e -- catalog-mobile-sizing books-grid-rating preorder-labels keyboard-navigation accessibility`: 45 passed, including three matching evidence captures.
- Layout coverage: 320, 360, 390, 520, 521, 640, 768 and 1440px. Assertions cover two mobile columns, 14px format/price text, 44px targets, full glyph containment, stacked non-overlapping label/price, stronger price weight, centered price/button alignment, larger between-edition spacing, non-overlapping buttons, and no page overflow. Edge data includes a long merchandise label and 12345.67 UAH price. Glyph-gap assertions allow Windows/Linux system-font differences.
- Heading checks assert 28–30px sizing and bold weight on mobile, prominence over product titles, and unchanged 32px desktop sizing. Matching mobile captures verify 8–12% section reduction and an earlier first row.
- Interaction tests at 360/390/1440px assert intended item IDs, formats and quantities for touch/click, Enter and Space. They cover discounted paper preorder (449 UAH), available ebook (199 UAH), total 648 UAH, disabled unavailable editions, reopening an existing item without duplicating it, and Escape/focus restoration. Invoice request count remains zero.
- Existing ratings, preorder, keyboard and axe checks pass with the established color-contrast exception. No new accessibility exceptions.
- Desktop card metrics and page height match the original; full-page JPEG bytes are identical. Mobile cover/grid/product-title structure is unchanged.
- Self-review: application styles remain inside the existing mobile breakpoint; heading markup adds only a scoped class. No changes to pricing, selection, navigation or desktop styling. `git diff --check` passed.
- Required GitHub `verify` must be green on the current PR head; its retrieved result is recorded in the PR handoff. Prior-revision success is not evidence for a new head.

Repeat After evidence by setting `ZVY73_EVIDENCE_PHASE=after` and running `npm run test:e2e -- catalog-mobile-sizing --grep "records matching"`. Original Before captures require restoring the base stylesheet and heading markup, not only changing the phase variable. Capture tests skip in ordinary CI because writing repository evidence is opt-in.

## Acceptance and handoff

| Acceptance criterion | Result |
| --- | --- |
| Two columns, unchanged product-title layout, stacked format/price, 14px text and 44px targets | Implemented; layout and interaction checks pass |
| Full format/amount/currency, intended touch/keyboard edition, no overlapping targets | Implemented and tested across long-label, discounted, preorder, digital, unavailable and in-cart states |
| Latest owner request: 8–12% purchase-section reduction; compact single-format cards; bold 28–30px page heading with tighter margins | Implemented; measured 8.5–10.5% reduction, 29px heading and first row 23.7px earlier at 390px |
| Existing mobile breakpoint only; desktop preservation and intermediate/reflow checks | Implemented; 521/640/768/1440px checks pass, desktop JPEG identical |
| Baseline comparison, increased-scroll tradeoff, final owner acceptance | Evidence and tradeoff recorded; final owner acceptance remains pending |
| Green CI, code review and reviewed environment for final journey verification | CI status recorded on the PR; code review and ZVY-58 verification handoff remain required |

Netlify is explicitly skipped: commit subjects and the PR title carry `[skip netlify]`; the eventual merge/squash subject must preserve it. No deployment or provider-preview result is claimed. The local production environment above is the implementation-verification environment. ZVY-58 must record its reviewed revision/environment before final journey sign-off.

The owner must accept this result and may reject it. Real-phone/browser behavior, screen-reader speech, 200% enlargement and final journey/provider/payment checks have no new evidence here; emulation is not a real-phone pass. Deferred contrast/cover-title work and rejected extra labels/shared-outline redesign remain outside scope. Do not mark the issue fully accepted from implementation approval or automated checks alone.

The complete changed-file manifest, including all screenshots, measurement files, application files and tests, is linked in [PR #42](https://github.com/rutakamekiar-org/lilys-books/pull/42).
