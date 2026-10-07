# ZVY-63: initial ebook fallback and exact-edition suggestions

Verification date: 2026-10-07 (Europe/Kyiv). Issue: [ZVY-63](https://linear.app/zvychajna/issue/ZVY-63). Approved scope: [ZVY-57](https://linear.app/zvychajna/issue/ZVY-57), F-BOOK-001 and F-BOOK-002 in the [local decision log](../../storefront-review/DECISIONS.md). Final journey handoff: [ZVY-58](https://linear.app/zvychajna/issue/ZVY-58).

## Behavior and file inventory

On initial product entry, select the available ebook when paper cannot be bought or preordered. Available or preorderable paper retains its existing default. An ebook that is only preorderable does not trigger this fallback. Apply the same initial rule to the first live detail response only if the customer has not chosen a format or used a purchase action. Later visibility refreshes update prices and eligibility without selecting a different format. Remounting detail state by product slug prevents a previous book's selection from becoming the next book's initial choice.

The add-on remains the intended paper edition of `inaksha-art`. Check that edition's availability/preorder flags and cart presence before opening the suggestion. Pin its item ID while the dialog is open: display, effective price, preorder label and cart addition all use that same ID. Another edition or a replacement ID is never substituted. A refreshed unavailable or removed item disables Add and shows a status message tied to the button's accessible description. Recovery to availability/preorder re-enables the same item with its current effective price, including a zero discount price.

An ineligible suggestion lets desktop Buy continue directly to cart. The existing mobile Buy flow already continues directly to cart, and remains intact. Tests of an open dialog at 390/360 pixels open it at desktop and then resize; they do not claim that mobile Buy now opens a suggestion. Close/Escape, focus trapping and focus restoration are preserved. ZVY-64's explicit continuation action is separate work. The completed EPUB explanation from ZVY-65 and preorder behavior from ZVY-66 are preserved.

Changed files:

- `src/lib/product-item.helper.ts`: shared available/preorder eligibility predicate and narrowly scoped initial-format rule.
- `src/components/organisms/BookDetail.tsx`: initial selection, deliberate-choice protection, purchase guards, suggestion eligibility and pinned item ID.
- `src/app/books/[slug]/page.tsx`: slug key so each book entry initializes its own selection.
- `src/components/molecules/SuggestionDialog.tsx`: exact-item display/addition, effective price, existing preorder label and changed-eligibility explanation.
- `src/components/molecules/SuggestionDialog.module.css`: disabled button treatment and wrapping explanation.
- `tests/e2e/product-selection.spec.ts`: 27 deterministic tests, including capture scenarios and behavior assertions at all three widths.
- This report and 33 JPEGs: 15 matching before images, 18 after images including the newly reachable ebook cart.

Backend contracts, payment requests, product data, shared focus styling and the accepted contrast exception are unchanged.

## Environment and controlled data

- Repository: `rutakamekiar-org/lilys-books`; branch: `codex/zvy-63-product-selection`, based on updated `main` at `4488c165d5e199c3e2d408f15a75d71fc3b54b19`, as explicitly authorized by the owner.
- Local production Next.js 16.3.4 at `http://127.0.0.1:3100`, API double at `http://127.0.0.1:4100`, Node.js 24.11.1 and Playwright 1.63.0 with bundled Chromium.
- Viewports: 1440×900, 390×844 and 360×844; mobile widths use emulated touch. Fonts and images load before captures, and suggestion entrance animation finishes before capture. All 18 after images were visually inspected.
- `/books/zvychajna`: unavailable paper 499 UAH; available ebook base 199 / effective 179 UAH, item `31000000-0000-4000-8000-000000000012`.
- `/books/inaksha`: available paper base 499 / effective 449 UAH, item `31000000-0000-4000-8000-000000000031`.
- `/books/inaksha-art`: exact paper add-on base 150 / effective 125 UAH, item `31000000-0000-4000-8000-000000000021`. Tests also use an eligible alternative digital item priced 25 UAH, a zero-price preorder, a removed/replaced ID and recovery to a 99 UAH preorder.
- Covers are repository assets; names, descriptions, specifications and prices are controlled substitutes, not production catalog claims. Before and after captures use the same corrected fixtures. The sequel intentionally uses the first book's cover asset.
- Every new browser test blocks non-local hosts and asserts zero invoice requests. No production API or payment was used.

## Evidence

| State | Desktop 1440×900 | Mobile 390×844 | Narrow 360×844 |
| --- | --- | --- | --- |
| Initial paper unavailable, ebook available | [Before](before/SCR-03-paper-unavailable-1440x900.jpg) / [After](after/SCR-03-paper-unavailable-1440x900.jpg) | [Before](before/SCR-03-paper-unavailable-390x844.jpg) / [After](after/SCR-03-paper-unavailable-390x844.jpg) | [Before](before/SCR-03-paper-unavailable-360x844.jpg) / [After](after/SCR-03-paper-unavailable-360x844.jpg) |
| Unavailable merch detail | [Before](before/SCR-03-merch-unavailable-1440x900.jpg) / [After](after/SCR-03-merch-unavailable-1440x900.jpg) | [Before](before/SCR-03-merch-unavailable-390x844.jpg) / [After](after/SCR-03-merch-unavailable-390x844.jpg) | [Before](before/SCR-03-merch-unavailable-360x844.jpg) / [After](after/SCR-03-merch-unavailable-360x844.jpg) |
| Buy with ineligible suggestion | [Before](before/SCR-03-suggestion-unavailable-1440x900.jpg) / [After](after/SCR-03-suggestion-unavailable-1440x900.jpg) | [Before](before/SCR-03-suggestion-unavailable-390x844.jpg) / [After](after/SCR-03-suggestion-unavailable-390x844.jpg) | [Before](before/SCR-03-suggestion-unavailable-360x844.jpg) / [After](after/SCR-03-suggestion-unavailable-360x844.jpg) |
| Settled eligible suggestion | [Before](before/SCR-03-suggestion-1440x900.jpg) / [After](after/SCR-03-suggestion-1440x900.jpg) | [Before](before/SCR-03-suggestion-390x844.jpg) / [After](after/SCR-03-suggestion-390x844.jpg) | [Before](before/SCR-03-suggestion-360x844.jpg) / [After](after/SCR-03-suggestion-360x844.jpg) |
| Eligibility lost while dialog open | [Before](before/SCR-03-suggestion-changed-1440x900.jpg) / [After](after/SCR-03-suggestion-changed-1440x900.jpg) | [Before](before/SCR-03-suggestion-changed-390x844.jpg) / [After](after/SCR-03-suggestion-changed-390x844.jpg) | [Before](before/SCR-03-suggestion-changed-360x844.jpg) / [After](after/SCR-03-suggestion-changed-360x844.jpg) |
| Cart reached from initial ebook fallback | [After](after/SCR-04-fallback-ebook-1440x900.jpg) | [After](after/SCR-04-fallback-ebook-390x844.jpg) | [After](after/SCR-04-fallback-ebook-360x844.jpg) |

The fallback cart has no matching before capture because the baseline initial Buy action is disabled. At mobile widths, the ineligible-suggestion Buy captures show the existing direct-cart journey both before and after. The separate resized-dialog captures demonstrate its responsive presentation and changed eligibility. The historical audit evidence remains linked from the Linear issue.

## Acceptance and validation

| Acceptance criterion | Result |
| --- | --- |
| Initial available ebook fallback, enabled purchase action and effective price without replacing deliberate choices | Implemented and locally verified at all widths, including a pending first live response with and without a deliberate customer choice. |
| Exact ebook item/price reaches cart; available-paper default and all-unavailable protection remain | Implemented and locally verified. Ebook quantity stays one on repeated Buy; paper/preorder defaults and unavailable/preorder-only ebook edge cases are asserted. |
| Suppress ineligible exact suggestion; disable and explain eligibility lost while open; no silent substitution | Implemented and locally verified, including an eligible alternative edition, loss of availability, missing pinned ID and recovery of that same ID. |
| Available/preorder status and intended item/price stay consistent; suppressed Buy continues to cart | Implemented and locally verified. Digital-first API ordering, discounted and zero-priced add-ons, preorder labels, totals, original-item quantity and cart focus are asserted. |
| Current/changed eligibility at all widths with settled visual evidence | Implemented and locally verified. 33 captures; open-dialog keyboard/focus and axe checks at each width. |
| Green required remote CI, code review and recorded shared verification availability | The review PR's exact-head `verify` result is the remote gate. Code review and shared-environment availability remain handoffs for ZVY-58; local validation does not satisfy those gates. |

Local results:

- Lint and typecheck: pass after the final test corrections.
- Deterministic fixture contracts: pass, four fixtures.
- Production build: standalone `npm run build:ci` and browser-suite setup both built the implementation successfully with the local API double.
- Focused new checks: `npm run test:e2e -- product-selection`: **27 passed**.
- Existing EPUB, preorder, accessibility, keyboard, excerpt, mobile-purchase and purchase-flow checks: **63 passed** in the broader run. The initial new-test failures came from duplicate fixture IDs, test cart reset and the existing mobile View cart label; these were corrected before the focused 27-test pass.
- Regression controls: the unchanged base fails initial ebook selection at all three widths. With the corrected fixtures, it also fails desktop suppression by opening the unavailable suggestion instead of cart; mobile suppression controls already pass because mobile Buy bypasses suggestions. The same assertions pass on the implementation.
- `git diff --check`: pass.

Reproduce the behavior checks with `npm run test:e2e -- product-selection`. Set `ZVY63_EVIDENCE_PHASE=after` to regenerate the 18 after images. For before captures, use the same test file with application source from the recorded base revision and `ZVY63_EVIDENCE_PHASE=before`; capture scenarios are separate from the bug assertions. The baseline sources were temporarily restored only for evidence/control runs, then the implementation was restored automatically.

## Handoff

Netlify was explicitly skipped. Frontend commit subjects and the review PR title must retain `[skip netlify]`; deployment and shared provider verification require separate authorization. No shared provider preview is claimed for this change.

Self-review checked initial-only selection, cached/static-to-live behavior, slug navigation, exact-item identity, price semantics, missing editions, unavailable/preorder recovery and existing dialog operation. ZVY-64's optional continuation, rejected title/context/focus redesign and deferred contrast/cover-title changes remain outside scope.

Real-phone interaction, screen-reader speech, provider/payment outcomes and final owner journey acceptance remain separate evidence or explicit gaps for ZVY-58. Emulated touch, axe and keyboard checks are not a real-phone or screen-reader pass. This implementation is ready for review; it does not complete the final journey handoff.
