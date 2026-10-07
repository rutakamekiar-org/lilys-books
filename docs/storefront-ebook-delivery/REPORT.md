# ZVY-65: EPUB delivery explanation before checkout

Verification date: 2026-10-07 (Europe/Kyiv). Issue: [ZVY-65](https://linear.app/zvychajna/issue/ZVY-65). Approved scope: [ZVY-57](https://linear.app/zvychajna/issue/ZVY-57) and [decision F-BOOK-005](../storefront-review/DECISIONS.md#f-book-005-explain-digital-delivery). Final journey handoff: [ZVY-58](https://linear.app/zvychajna/issue/ZVY-58).

## Implemented behavior and changed files

When the currently selected product item is digital, its purchase controls show **Формат EPUB. Файл надійде на вашу електронну пошту.** above the buttons. Both purchase buttons reference this text through `aria-describedby`. The explanation disappears when the customer chooses paper, and follows the selected item through live price, preorder and availability changes. A failed refresh retains the last confirmed selection and its explanation.

The paragraph uses the existing muted text color, a .875rem (14px at the default root size) font and wrapping at narrow widths. Its top margin is 4px, reduced from 10px, with a 4px left inset; it stays close to the selected option and above the purchase buttons. The exact selected item continues to determine the effective price, purchase eligibility, notes and cart identity. Product specifications, cart/checkout copy, edition preferences, navigation and dialog behavior are preserved. There are no delivery-time or reader-compatibility promises, API changes or backend changes. Completed preorder guidance from ZVY-66 is preserved; initial ebook fallback remains ZVY-63's scope.

Changed-file inventory:

- Modified `src/components/organisms/BookDetail.tsx`: conditional selected-ebook explanation and purchase-button accessible descriptions.
- Modified `src/components/organisms/BookDetail.module.css`: readable wrapping and paragraph/button spacing.
- Created `tests/e2e/ebook-delivery.spec.ts`: 12 deterministic tests covering both book routes, selected edition/price, keyboard purchase, cart identity/quantity/amount, Escape/focus restoration, live price/preorder/unavailability and failed refresh.
- Created this report, 18 before/after JPEG evidence files and six previous-note captures linked below.
- Modified frontend `AGENTS.md` and `README.md`: Netlify deployments require explicit approval; frontend commits and PR titles include `[skip netlify]` by default. Backend instructions are unchanged.

## Recorded environment and fixtures

- Repository: `rutakamekiar-org/lilys-books`; branch: `codex/zvy-65-ebook-delivery`.
- Before application revision: `563c7049b8fb124b49a749ae51d9f7e5ae1d57ed`, updated frontend `main`. After application: this branch's UI diff; the review PR identifies the exact head revision.
- Local production Next.js 16.3.4 at `http://127.0.0.1:3100`, with the deterministic API double at `http://127.0.0.1:4100`; Node.js 24.11.1, Playwright 1.63.0 and bundled Chromium 153.0.8010.12.
- Matching viewport captures at 1440×900, 390×844 and 360×844; mobile widths use emulated touch. Fonts and product images finish loading before capture. All nine after images were visually inspected.
- Controlled `/books/zvychajna` fixture: paper 499 UAH; ebook base 199 / effective 179 UAH, item `31000000-0000-4000-8000-000000000012`.
- Controlled `/books/inaksha` fixture: paper 499 UAH; ebook 249 UAH, item `31000000-0000-4000-8000-000000000022`.
- Covers are repository assets; descriptions, specifications and edition notes are test substitutes. These are controlled evidence, not live catalog/pricing claims. The sequel screenshot retains the first book's ebook in the cart, consistently before and after.
- Every new browser test blocks requests to non-local hosts and asserts zero invoice requests. No production API or payment was used.

## Matching before/after evidence

| State | Desktop 1440×900 | Mobile 390×844 | Narrow 360×844 |
| --- | --- | --- | --- |
| SCR-03-digital: selected Звичайна ebook | [Before](before/SCR-03-digital-1440x900.jpg) / [After](after/SCR-03-digital-1440x900.jpg) | [Before](before/SCR-03-digital-390x844.jpg) / [After](after/SCR-03-digital-390x844.jpg) | [Before](before/SCR-03-digital-360x844.jpg) / [After](after/SCR-03-digital-360x844.jpg) |
| SCR-03-sequel-digital: selected Інакша ebook | [Before](before/SCR-03-sequel-digital-1440x900.jpg) / [After](after/SCR-03-sequel-digital-1440x900.jpg) | [Before](before/SCR-03-sequel-digital-390x844.jpg) / [After](after/SCR-03-sequel-digital-390x844.jpg) | [Before](before/SCR-03-sequel-digital-360x844.jpg) / [After](after/SCR-03-sequel-digital-360x844.jpg) |
| SCR-04-digital: matching cart item and amount | [Before](before/SCR-04-digital-1440x900.jpg) / [After](after/SCR-04-digital-1440x900.jpg) | [Before](before/SCR-04-digital-390x844.jpg) / [After](after/SCR-04-digital-390x844.jpg) | [Before](before/SCR-04-digital-360x844.jpg) / [After](after/SCR-04-digital-360x844.jpg) |

The approved historical baseline remains linked from the issue and decision log. These new captures compare the unchanged current base with this change using identical controlled data and viewport dimensions. Cart evidence verifies preservation of the selected ebook; its copy has not changed.

The owner requested a shorter, smaller and lighter explanation closer to the selected ebook on 2026-10-07, choosing the final wording above. The `after` images show that refinement; `previous` preserves the initial note for comparison:

| Previous note | Desktop 1440×900 | Mobile 390×844 | Narrow 360×844 |
| --- | --- | --- | --- |
| Звичайна ebook | [Previous](previous/SCR-03-digital-1440x900.jpg) | [Previous](previous/SCR-03-digital-390x844.jpg) | [Previous](previous/SCR-03-digital-360x844.jpg) |
| Інакша ebook | [Previous](previous/SCR-03-sequel-digital-1440x900.jpg) | [Previous](previous/SCR-03-sequel-digital-390x844.jpg) | [Previous](previous/SCR-03-sequel-digital-360x844.jpg) |

## Acceptance results and validation

| Acceptance criterion | Local result |
| --- | --- |
| Clearly explain EPUB/email before checkout, readable at all three widths | Pass. Visible above the selected ebook's purchase action on both routes; geometry assertions check wrapping and bounds, and all after captures were visually inspected. |
| Edition/delivery information stays consistent with selected item/price without physical-shipment or timing/compatibility promises | Pass. Paper selection removes the paragraph; discounted and full ebook prices, exact cart IDs, digital quantity 1 and totals are asserted. Preorder/unavailable transitions preserve the deliberate ebook selection and existing eligibility protection. |

Local validation:

- `npm run lint`: pass.
- `npm run typecheck`: pass.
- `npm run test:fixtures`: pass, four fixture contracts.
- The initial implementation passed standalone `npm run build:ci` with the deterministic local API. The refined version's browser-suite setup also built and ran the production application successfully.
- Initial implementation: `npm run test:e2e -- ebook-delivery preorder-labels accessibility keyboard-navigation book-excerpt mobile-purchase purchase-flow`: **63 passed**, including all 12 new checks.
- Owner-requested refinement: `npm run test:e2e -- ebook-delivery accessibility keyboard-navigation`: **26 passed**. Added assertions verify that the note stays close to the selected option and its text is smaller than body copy; item/amount, wrapping and keyboard checks remain intact.
- Left-padding follow-up: `npm run test:e2e -- ebook-delivery`: **12 passed**, including all three viewport capture scenarios; production-suite setup built the padded layout successfully. The final screenshots include the 4px inset.
- Regression control on the unchanged base: the selected-ebook test fails at the missing delivery paragraph at all three widths. The same assertion passes after implementation.
- `git diff --check`: pass.

Reproduce the focused checks with `npm run test:e2e -- ebook-delivery`. Set `ZVY65_EVIDENCE_PHASE=after` to regenerate the nine after images. Before captures used the same capture scenarios while application files remained unchanged at the base revision. Capture-only scenarios are separate from the delivery, price, eligibility and keyboard assertions.

## Review and final verification handoff

The review PR's required `verify` check is the remote CI gate for its exact head. Its results are recorded on the PR; local checks alone do not satisfy that requirement. Code review and availability in the recorded shared verification environment remain required before ZVY-58's final journey verification. This report records the local production environment, and does not claim final journey completion.

The owner explicitly requested `[skip netlify]` for the refinement. Both follow-up commits and PR #39's title carry the tag; deployment requires separate explicit approval. The earlier provider preview for the initial application revision `e61326f` is not evidence of the refined UI. The updated screenshots and local production test environment above record the current behavior; shared provider verification remains deferred.

Real-phone interaction, mobile software-keyboard obstruction, screen-reader speech and real provider/payment outcomes require separate evidence or explicit owner disposition in ZVY-58. Emulated touch, accessible-description assertions and keyboard tests are separate evidence. The approved existing brand contrast exception is preserved.

Conclusion: the EPUB/email explanation is implemented and locally verified, with matching before/after evidence and regression coverage ready for review. Review, required green remote CI and shared-environment availability are handoff gates; retain ZVY-58's separate final journey and owner-acceptance requirements.
