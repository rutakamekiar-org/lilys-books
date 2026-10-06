# ZVY-60 — Mobile product, cart, excerpt and gallery

Verified 2026-10-06 on `codex/zvy-60-mobile-excerpt`, based on `main` at `05ff8248771aafcec160e2f3afdb71feb9f312bb`. The approved scope includes the mobile purchase mockup and subsequent reader, gesture and gallery refinements.

## Final behaviour

- Mobile: a 104–112 px cover sits beside the title, rating and “Читати уривок”, with 12 px above the excerpt action. Format selection and a single Buy action follow. Buy adds the selected edition once and opens the existing cart; an already-added edition shows “Переглянути кошик” without increasing its quantity.
- Desktop: the inline cover carousel and two purchase actions remain. Add to cart adds once, shows a confirmation toast and stays on the page. Buy opens the cart through the existing postcard suggestion flow. Buy has no toast at any viewport.
- Cart: clearer mobile item cards, 44 px quantity/remove controls, promo entry, tighter checkout spacing and “Продовжити покупки”. The selected item scrolls into view. Existing items, digital quantity limits, prices, discounts and checkout contracts are preserved.
- Excerpt: original cream background, a two-line mobile header, keyboard-scrollable reading area and the same sheet geometry as the cart. Close/Escape and backdrop taps restore focus; background scrolling is locked.
- Sheets: drag the header to dismiss at 27% height, or at least 48 px with recent downward velocity of 0.65 px/ms. Small/cancelled drags snap back over 180 ms; successful dismissals slide fully offscreen over 220 ms. Reduced motion disables animations. Reading-area swipes scroll the text.
- Gallery: the tappable mobile cover has a subtle zoom indicator and pressed state. The enlarged viewer shows only the book title, uncropped images, arrows and a current/total counter. It starts on the cover and remembers the selected image during the same visit. Equivalent absolute/relative storefront URLs are deduplicated. Other carousel images retain lazy loading; a 192 px image candidate supports compact covers.
- “Назад до книг” and the transitional cart-opening hint are removed. Missing excerpts expose no dead action. Tablet widths keep the larger cover and two purchase actions, with sampling ahead of the description.

## Visual evidence

Only representative final evidence is retained; intermediate captures and generated manifests were removed.

- [Mobile product before/after, 390 px](comparison-SCR-03-paper-390x844.png)
- [Mobile cart before/after, 390 px](comparison-cart-review-390x844.png)
- [Final excerpt, 390 px](after/SCR-03-excerpt-390x844.png)
- [Final gallery, 390 px](after/book-gallery-390x844.png)
- [Desktop product before/after, 1440 px](comparison-SCR-03-paper-1440x900.png)

Product comparisons use the original main layout. The cart comparison uses the intermediate excerpt-only layout, whose cart preceded the approved purchase mockup. Comparison labels surround unedited screenshot pixels.

## Validation

All 128 browser tests passed across desktop, 320 px and 390 px projects. Production build, lint, typecheck, four fixture contract checks and diff whitespace checks passed. Tests use the deterministic local API and do not submit payments or call the production API.

Regression coverage includes excerpt placement at 1440/390/360 px, selected edition and price retention, duplicate prevention, cart/checkout entry, keyboard focus, axe scans, failed excerpt requests, swipe thresholds, snap-back, exit animation, reduced motion, image ordering and remembered gallery position. Image sizing checks cover 320–1280 px. See `tests/e2e/book-excerpt.spec.ts`, `mobile-purchase.spec.ts`, `sheet-dismiss.spec.ts`, `book-gallery.spec.ts` and the existing accessibility, keyboard, performance and pricing suites. `ACCESSIBILITY.md` documents the dialog and keyboard changes; no additional axe exceptions were introduced.

## Remaining handoff

Before merging, run the required remote `verify` pipeline, obtain code review and product-owner acceptance in the verification environment. ZVY-58 owns final journey verification and acceptance; local validation alone does not mark the Linear issue Done. No push, merge or deployment is included here.

Recommended final review: check real iOS/Android phones for header dragging versus text scrolling, viewport changes, and restored gallery selection. Verify the desktop postcard suggestion flow. Further UI adjustments should follow that review rather than adding another redesign now.
