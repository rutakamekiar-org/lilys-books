# ZVY-66: edition-level preorder disclosure

Verification date: 2026-10-07 (Europe/Kyiv). Issue: [ZVY-66](https://linear.app/zvychajna/issue/ZVY-66/keep-preorder-labels-consistent-across-catalog-book-details-and-cart). Approved scope: [ZVY-57](https://linear.app/zvychajna/issue/ZVY-57) and [decision F-DISC-002 / F-BOOK-003](../storefront-review/DECISIONS.md#f-disc-002-consistent-availability-and-preorder-disclosure). Final journey handoff: [ZVY-58](https://linear.app/zvychajna/issue/ZVY-58).

## Implementation and data contract

The catalog edition row and matching cart line now show **Передзамовлення** when the exact product item has `isAvailable=false` and `canPreorder=true`. Available editions take precedence even when `canPreorder=true`; unavailable non-preorder editions have no preorder label. A shared helper and text component implement this rule. The selected preorder edition's product-page hint says **Передзамовити або додати до кошика**. The existing purchase action already said **Передзамовити**; the historical hardcoded buy-now hint had been removed before this branch.

Status uses existing backend product-item fields through `ProductsProvider` and the existing cart synchronization. No product identity, selected format, quantity, effective price, purchase eligibility, API contract, or refresh/persistence policy changes. The backend remains authoritative for purchase eligibility. No dispatch date, shipping promise or checkout label is introduced. Backend-supplied edition notes remain intact. The completed ZVY-59/60/61 behavior is preserved; edition fallback and suggestion eligibility remain ZVY-63's scope.

Changed-file inventory:

- Modified `src/lib/product-item.helper.ts`: shared exact-edition preorder predicate.
- Created `src/components/atoms/PreorderLabel.tsx` and `src/components/atoms/PreorderLabel.module.css`: visible status text with safe wrapping.
- Modified `src/components/molecules/BookCard.tsx` and `src/components/molecules/BookCard.module.css`: status under the matching edition/price.
- Modified `src/components/organisms/BookDetail.tsx`: preorder-only supporting guidance.
- Modified `src/components/organisms/ShoppingCart.tsx`: status beside the matching cart edition.
- Created `tests/e2e/preorder-labels.spec.ts`: deterministic behavior checks and evidence capture.
- Created this report and the 18 JPEG files individually linked in the evidence table below.

## Recorded environment and fixture

- Repository: `rutakamekiar-org/lilys-books`; branch: `codex/zvy-66-preorder-labels`.
- Before application revision: `6d74fcb`, the updated frontend `main` base. After: this branch's application diff; the review PR identifies the exact reviewed head.
- Windows local **production** Next.js 16.3.4 application at `http://127.0.0.1:3100`; deterministic API double at `http://127.0.0.1:4100`. Playwright 1.63.0, bundled Chromium 153.0.8010.12; Node.js 24.11.1.
- Viewports: 1440×900, 390×844, 360×844; mobile widths enable emulated touch. Catalog/details screenshots use full-page capture with scroll reset to the top; cart captures use the viewport. All nine after captures were visually inspected.
- Controlled `pid_shepit_snihu` fixture: paper item `31000000-0000-4000-8000-000000000001`, preorder, base 399 / effective 349 UAH; ebook item `31000000-0000-4000-8000-000000000002`, available with preorder permission also true, effective 199 UAH. Its cover and supporting content are test substitutes, not a live product snapshot.
- The fixtures also exercise unavailable editions. Every new test blocks browser requests to non-local hosts and asserts no invoice requests where purchase/cart behavior is exercised. No production API or real payment was used.

## Matching before/after evidence

| State | Desktop 1440×900 | Mobile 390×844 | Narrow 360×844 |
| --- | --- | --- | --- |
| Catalog preorder edition | [Before](before/SCR-02-preorder-1440x900.jpg) / [After](after/SCR-02-preorder-1440x900.jpg) | [Before](before/SCR-02-preorder-390x844.jpg) / [After](after/SCR-02-preorder-390x844.jpg) | [Before](before/SCR-02-preorder-360x844.jpg) / [After](after/SCR-02-preorder-360x844.jpg) |
| Selected preorder edition | [Before](before/SCR-03-preorder-1440x900.jpg) / [After](after/SCR-03-preorder-1440x900.jpg) | [Before](before/SCR-03-preorder-390x844.jpg) / [After](after/SCR-03-preorder-390x844.jpg) | [Before](before/SCR-03-preorder-360x844.jpg) / [After](after/SCR-03-preorder-360x844.jpg) |
| Matching cart line | [Before](before/SCR-04-preorder-1440x900.jpg) / [After](after/SCR-04-preorder-1440x900.jpg) | [Before](before/SCR-04-preorder-390x844.jpg) / [After](after/SCR-04-preorder-390x844.jpg) | [Before](before/SCR-04-preorder-360x844.jpg) / [After](after/SCR-04-preorder-360x844.jpg) |

The original approved historical baseline remains linked through the decision log. These new before/after captures use identical deterministic data and viewport sizes on the current application base.

## Acceptance results

| Criterion | Result |
| --- | --- |
| Visible preorder label in catalog and cart; consistent product action/guidance | Implemented. Exact paper edition labeled in both locations; selected preorder action and hint use preorder wording. Switching to the available ebook removes the preorder hint. |
| Consistent desktop/mobile/narrow status without clipping, selection or price changes | Pass locally at all three sizes. Label/hint geometry stays inside the viewport without text overflow. A mixed cart retains paper/ebook IDs, formats and quantities; two paper copies plus one ebook total 897 UAH. Cart reload, Escape and focus restoration preserve selection. |
| Authoritative data; available editions not mislabeled; no timing promise | Implemented. All four availability/preorder combinations are covered across fixtures and live transitions. Status changes preserve the same cart item and 349 UAH unit price; a completed 503 refresh retains last API-confirmed data. Existing unavailable controls remain disabled. |

## Validation and reproduction

- `npm run lint`: pass.
- `npm run typecheck`: pass.
- `npm run test:fixtures`: pass, four deterministic fixture contracts.
- `npm run build:ci`: pass, standalone production build with the local API double.
- `npm run test:e2e -- preorder-labels`: all 12 new tests pass.
- 69 related tests pass: accessibility, cover layout, excerpt behavior, catalog ratings/quick-add, promo layout, money precision, keyboard navigation, mobile purchase, product SEO and the catalog-to-checkout journey. The broader 81-test run initially had two new test-selector failures for the inherited mobile button wording; correcting those expectations and rerunning the complete 12-test preorder suite passed. No application change was required for those failures.
- Regression control on the unchanged base: the new exact-edition test fails at the missing catalog **Передзамовлення** label. After implementation the same assertion passes.
- `git diff --check`: pass.

Reproduce in the repository with `npm run test:e2e -- preorder-labels`. To regenerate after captures, set `ZVY66_EVIDENCE_PHASE=after` and run that command. The capture-only scenarios do not skip or replace the separate label, price, status-change and unavailable-state assertions. Before captures were taken with the four changed UI files at the base revision, using the same capture scenarios; implementation files were backed up and restored automatically.

## Review and final verification handoff

The PR's required `verify` check is the authoritative remote CI gate for the exact review head; local passes alone do not satisfy it. Code review and availability in the recorded shared verification environment are still required before ZVY-58's final journey verification. This report records the local production environment and evidence; it does not claim deployment, owner approval, or final journey completion.

Real-phone interaction, mobile software-keyboard obstruction, screen-reader speech and real provider/payment outcomes were not tested. Emulated touch and keyboard tests are separate evidence. Existing brand contrast exceptions remain unchanged, as approved in ZVY-57. These gaps must retain their separate evidence or owner disposition in ZVY-58.

Conclusion: the approved preorder labeling behavior is implemented and verified locally, with regression tests and matching evidence ready for review. ZVY-66's review/environment handoff and required remote CI gate must be satisfied before closing the issue.
