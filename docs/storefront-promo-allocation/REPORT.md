# ZVY-62: promo item amounts reconcile with cart and checkout

Verification date: 2026-10-07 (Europe/Kyiv). Issue: [ZVY-62](https://linear.app/zvychajna/issue/ZVY-62). Approved scope: [ZVY-57](https://linear.app/zvychajna/issue/ZVY-57), [F-CHECK-010](../storefront-review/DECISIONS.md#f-check-010-consistent-promo-allocation). Final journey handoff: [ZVY-58](https://linear.app/zvychajna/issue/ZVY-58).

## Result and changed files

The limited-use allocation now includes zero for every eligible item that receives no discounted unit. The shared cart provider also supplies zero for an absent allocation, matching the existing cart-total calculation. Cart and checkout already use this provider for item discounts. The payable calculation and payment contract are unchanged.

For ONE10, two paper units at 499 UAH and one digital unit at 199 UAH produce paper 948, digital 199, discount 50 and payable total 1147 UAH. Previously the digital line incorrectly displayed 179, so displayed lines summed to 1127 despite the correct 1147 summary. Undiscounted digital now has no promo badge or crossed-out price.

Changed files:

- `src/lib/promocode.helper.ts`: explicit zero allocations for eligible items; existing selection order and discount rules preserved.
- `src/components/molecules/CartProvider.tsx`: zero fallback when reading an item's allocation.
- `tests/e2e/promo-allocation.spec.ts`: allocation regression, eight promo scenarios at all three widths, quantity/promo/item removal, exhausted-code rejection, selection and zero-invoice assertions, opt-in evidence captures.
- This report and 12 JPEGs: matching cart and checkout screenshots before and after, at all three viewports. No product content, styling, navigation or dialog behavior changed.

## Environment and controlled scenarios

Frontend branch: `codex/zvy-62-promo-allocation`, based on updated `main` at `904be053944b5035fe47663e05bf9efac0cc8aa6`. Local production Next.js 16.3.4 at `http://127.0.0.1:3100`, deterministic API at `http://127.0.0.1:4100`, Node.js 24.11.1 and Playwright 1.63.0 with bundled Chromium. Viewports: 1440×900, 390×844 and 360×844; mobile uses emulated touch.

Route: `/books/zvychajna`. Paper item `31000000-0000-4000-8000-000000000001`, quantity 2; digital item `31000000-0000-4000-8000-000000000002`, quantity 1. Effective prices are 499 and 199 UAH; neither has a catalogue discount. Product metadata is a controlled substitute; covers use repository assets.

| Fixture | Paper line | Digital line | Discount | Payable total |
| --- | ---: | ---: | ---: | ---: |
| ONE10, one percentage-discounted unit | 948 | 199 | 50 | 1147 |
| UNLIMITED10, all eligible units | 898 | 179 | 120 | 1077 |
| ZERO10, zero remaining units | 998 | 199 | 0 | 1197 |
| PAPER10, unrestricted usage on paper only | 898 | 199 | 100 | 1097 |
| DIGITAL10, digital only | 998 | 179 | 20 | 1177 |
| FIXED50, existing global order discount | 998 | 199 | 50 | 1147 |
| PAPER50, fixed discount on one paper unit | 948 | 199 | 50 | 1147 |
| CAPPED500, one fixed discount capped at unit price | 499 | 199 | 499 | 698 |

FIXED50 retains the existing order-wide deduction: displayed lines sum to the subtotal, then the separately displayed 50 UAH order discount gives the payable total. It is not also deducted from the lines. Other fixtures allocate discounts to units and their displayed final lines sum directly to the payable total.

ZERO10 is a defensive zero-allocation response fixture, not a claim that the live API validates exhausted promos. A separate 404 exhausted-code scenario verifies unchanged selection and undiscounted totals in cart and checkout. Existing layout tests cover invalid codes, loading, service failure and recovery. All new browser scenarios block non-local hosts and assert zero invoice requests. No real promo, production API or payment was used.

## Evidence

Before captures use the original provider/helper from the base commit; after captures use this fix. Both use the same fixtures and navigation. The success toast is dismissed so totals are readable; checkout is scrolled to its order summary at every width. The opt-in before capture explicitly expects the historical wrong digital line and does not count as an acceptance pass.

| State | Desktop 1440×900 | Mobile 390×844 | Narrow 360×844 |
| --- | --- | --- | --- |
| Cart ONE10 | [Before](before/SCR-04-promo-one10-1440x900.jpg) / [After](after/SCR-04-promo-one10-1440x900.jpg) | [Before](before/SCR-04-promo-one10-390x844.jpg) / [After](after/SCR-04-promo-one10-390x844.jpg) | [Before](before/SCR-04-promo-one10-360x844.jpg) / [After](after/SCR-04-promo-one10-360x844.jpg) |
| Checkout ONE10 summary | [Before](before/SCR-05-promo-one10-1440x900.jpg) / [After](after/SCR-05-promo-one10-1440x900.jpg) | [Before](before/SCR-05-promo-one10-390x844.jpg) / [After](after/SCR-05-promo-one10-390x844.jpg) | [Before](before/SCR-05-promo-one10-360x844.jpg) / [After](after/SCR-05-promo-one10-360x844.jpg) |

To capture after evidence on this branch, set `ZVY62_EVIDENCE_PHASE=after` and run `npm run test:e2e -- promo-allocation --grep "records matching"`. Before capture requires the base provider/helper as well as `ZVY62_EVIDENCE_PHASE=before`; setting the variable alone does not restore the original source.

## Verification and acceptance

- Before the fix, the new allocation assertion failed with missing zero, and ONE10 browser regressions failed at all three widths with digital 179 instead of 199. These failures reproduce the intended defect.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run test:fixtures`: four deterministic fixture contracts passed.
- Production `next build`, invoked by the standard Playwright `tests/support/test-app.mjs` with local API settings: passed.
- `ZVY62_EVIDENCE_PHASE=after npm run test:e2e -- promo-allocation checkout-money cart-promo-layout keyboard-navigation`: 49 passed, exit 0. Includes ZVY-33's 0.05, exact-zero and integer-minor-unit regressions and existing keyboard/focus/dialog checks.
- Final capture-only runs: three before reproductions and three after acceptance captures. Capture tests are skipped in ordinary CI runs because evidence writing is opt-in.
- Required GitHub `verify` must pass on the PR's current head before merge. Its live result is recorded in the PR handoff; local results alone do not satisfy that gate.

| Acceptance criterion | Result |
| --- | --- |
| Shared allocation, explicit zero for eligible undiscounted items | Implemented; helper and provider regression, all width scenarios pass |
| ONE10 paper 948, digital 199, discount 50, total 1147; lines reconcile | Implemented and tested in cart and checkout at all three widths |
| Unlimited, exhausted, restricted and fixed cases; currency precision retained | Implemented and tested with the scenarios above and existing ZVY-33 regressions |
| Matching desktop/mobile/narrow evidence | Recorded in the 12 linked captures |
| Required green CI, review and recorded verification environment | CI is checked on the PR; code review and availability in the final journey environment remain handoff gates |

## Backend check and limits

Inspected backend checkout code at BookPreorder revision `2e95266`; after fetching, `origin/develop` is `d238a9e` and has no differences in `InvoiceController.cs`, `PromoCodeService.cs` or `MonoInvoiceService.cs`. This is a source inspection and arithmetic check, not a live Monobank or deployed-backend test. No backend code or contracts changed, and no new backend build/test result is claimed.

`InvoiceController.CreateInvoiceV2` resolves authoritative prices, selects eligible units by descending price and caps by remaining usage. For ONE10 it calculates `floor(499 × 0.9) = 449`, then `449 + 499 + 199 = 1147`. It splits the paper basket into one discounted and one undiscounted entry, and sends 114700 minor units. The inspected server calculation is correct for this fixture.

A separate pre-existing rule difference remains: backend percentage prices use `Math.Floor`, frontend uses `Math.round`. For example, 50% off 199 gives a backend unit price of 99 and a frontend unit price of 100. The ONE10 and unlimited-10% fixtures here agree under both rules. Broader frontend/server percentage-rule alignment needs a separate agreed follow-up; this display-allocation change does not alter the approved rounding or payable calculation. The synthetic global FIXED50 fixture preserves the existing frontend order-discount path; it does not redefine the backend's item-scoped promo contract.

Netlify is explicitly skipped. Commit subjects and PR title retain `[skip netlify]`, including the eventual merge/squash subject. Provider preview/deployment, review, real-phone/provider/payment outcomes and screen-reader speech have no new evidence in this task. Emulation does not count as a real-phone pass. ZVY-58 retains final journey verification and owner acceptance; the issue should not be treated as fully accepted solely because these local tests pass.
