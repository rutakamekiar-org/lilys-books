# ZVY-64: explicit continuation from the Buy suggestion

Verification date: 2026-10-13 (Europe/Kyiv). Issue: [ZVY-64](https://linear.app/zvychajna/issue/ZVY-64). Approved finding: F-BOOK-004 in [ZVY-57](https://linear.app/zvychajna/issue/ZVY-57) and the [decision log](../../storefront-review/DECISIONS.md#f-book-004-continue-without-an-add-on). Final journey handoff: [ZVY-58](https://linear.app/zvychajna/issue/ZVY-58).

## Agreed behavior

The owner approved the implementation plan on 2026-10-13 with these refinements: name the secondary action **Перейти до кошика**, keep **Книгу вже додано до кошика** subtle, retain the suggested product's **Додати до кошика** as the primary action, confirm accepting the suggestion opens cart with both products, cover rapid repeated clicks, and preserve/document the existing mobile flow. These refinements define the implemented copy and action hierarchy.

Buy already puts the selected original edition in cart before showing the optional paper illustrations. The new outlined secondary button closes the suggestion and opens cart without adding anything. The small, muted one-line note is also the button's accessible description. The orange Add action remains primary; accepting adds the exact eligible edition once and opens cart with both products, retaining the original quantity and effective price. This preserves the completed ZVY-63 eligibility and acceptance behavior.

Synchronous guards prevent queued Buy/Add clicks from adding the original edition repeatedly before cart state commits and prevent repeated suggestion actions from adding the illustrations repeatedly before the dialog closes. The guards reset for later purchases; tests remove both products and buy/accept again. CartProvider's ordinary quantity-increase behavior is preserved.

Close, Escape, backdrop dismissal and product Details retain their existing behavior. Ordinary detail-page Add keeps the customer on the page. Digital Buy and ineligible suggestions continue directly to cart.

**Mobile flow:** Buy at widths up to 640 pixels already opens cart directly and does not present suggestions by default. This task preserves that behavior. The 390/360-pixel suggestion checks open the dialog at desktop and resize it, exercising a dialog that remains open across the breakpoint. Those captures are responsive-dialog evidence, not evidence that mobile Buy now shows suggestions.

## File inventory

- [SuggestionDialog.tsx](../../../src/components/molecules/SuggestionDialog.tsx): copy, secondary action, accessible description and repeated-action guard.
- [SuggestionDialog.module.css](../../../src/components/molecules/SuggestionDialog.module.css): subtle note and outlined secondary button.
- [BookDetail.tsx](../../../src/components/organisms/BookDetail.tsx): original-edition guard shared by Buy and Add.
- [suggestion-continuation.spec.ts](../../../tests/e2e/suggestion-continuation.spec.ts): 34 deterministic scenarios across the required viewports, including screenshots, focus, quantities, prices, eligibility loss and repeated actions.
- This report and all 21 JPEG files linked in the evidence table below: six before suggestion captures, six after suggestion captures and nine after cart captures.

## Environment and controlled data

Frontend branch: `codex/zvy-64-suggestion-continuation`, based on updated frontend `origin/main`, revision `13b8ad5`. Backend source and contracts are unchanged. Chromium via Playwright, Node.js 24.11.1, local production Next.js build at `http://127.0.0.1:3100`, deterministic API double at `http://127.0.0.1:4100`.

The two routes are `/books/inaksha` and `/books/zvychajna-and-inaksha`, each with distinct product/edition IDs. Controlled paper prices are 499 UAH with a 449 UAH effective discount price; ebook prices are 199/179 UAH; illustrations are 150/125 UAH. Continuation with three existing paper copies preserves 1,347 UAH; acceptance adds one 125 UAH illustration edition for 1,472 UAH. The fixtures use repository cover assets, including the first book's cover for the sequel/bundle. They do not represent current production catalog content or prices.

Every new scenario blocks non-local hosts and asserts zero invoice requests. Existing keyboard/purchase regressions use the local API double, including a mocked invoice redirect; no real provider, production API or payment is used.

## Evidence

| State | Desktop 1440×900 | Mobile 390×844 | Narrow 360×844 |
| --- | --- | --- | --- |
| Inaksha settled suggestion | [Before](before/SCR-03-inaksha-suggestion-1440x900.jpg) / [After](after/SCR-03-inaksha-suggestion-1440x900.jpg) | [Before](before/SCR-03-inaksha-suggestion-390x844.jpg) / [After](after/SCR-03-inaksha-suggestion-390x844.jpg) | [Before](before/SCR-03-inaksha-suggestion-360x844.jpg) / [After](after/SCR-03-inaksha-suggestion-360x844.jpg) |
| Bundle settled suggestion | [Before](before/SCR-03-zvychajna-and-inaksha-suggestion-1440x900.jpg) / [After](after/SCR-03-zvychajna-and-inaksha-suggestion-1440x900.jpg) | [Before](before/SCR-03-zvychajna-and-inaksha-suggestion-390x844.jpg) / [After](after/SCR-03-zvychajna-and-inaksha-suggestion-390x844.jpg) | [Before](before/SCR-03-zvychajna-and-inaksha-suggestion-360x844.jpg) / [After](after/SCR-03-zvychajna-and-inaksha-suggestion-360x844.jpg) |
| Inaksha continuation, original quantity three | [After](after/SCR-04-inaksha-original-only-1440x900.jpg) | [After](after/SCR-04-inaksha-original-only-390x844.jpg) | [After](after/SCR-04-inaksha-original-only-360x844.jpg) |
| Bundle continuation, original quantity three | [After](after/SCR-04-zvychajna-and-inaksha-original-only-1440x900.jpg) | [After](after/SCR-04-zvychajna-and-inaksha-original-only-390x844.jpg) | [After](after/SCR-04-zvychajna-and-inaksha-original-only-360x844.jpg) |
| Accepted suggestion, original three plus one illustration edition | [After](after/SCR-04-accepted-suggestion-1440x900.jpg) | [After](after/SCR-04-accepted-suggestion-390x844.jpg) | [After](after/SCR-04-accepted-suggestion-360x844.jpg) |

The new continuation has no before cart capture because that action did not exist. Before/after suggestion captures use identical viewports and controlled fixtures with fonts/images loaded and animations disabled. Visual inspection confirms that the Add action remains prominent and the note/cart action fit the required viewports.

## Acceptance and validation

| Criterion | Result |
| --- | --- |
| Named continuation action explains the selected original and opens cart without the suggestion | Implemented with the owner's agreed Ukrainian copy; verified on both routes at all three widths. |
| Original edition, quantity and price preserved; focus enters cart at all widths | Verified by exact item IDs/formats/quantities, effective unit prices/totals, keyboard activation and cart focus assertions. |
| Primary Add acceptance opens cart with both products and preserves ZVY-63 | Verified by new rapid-acceptance scenarios and the existing eligible/preorder, zero-price and changed-eligibility tests. |
| Rapid clicks do not duplicate additions; later purchases remain possible | Verified for original Buy, ordinary Add, suggestion Add and continuation, including remove-and-buy-again scenarios. |
| Preserve existing navigation, dismissal and mobile flow | Verified by Close/Escape/reopen, digital bypass, ordinary Add and existing mobile/keyboard journey tests. Mobile default bypass is documented above. |
| Before/after evidence, local production validation and green required CI | Local evidence/checks pass as recorded below. The draft PR's required `verify` check is the separate remote gate; its result must be read for the final PR head. |
| Review and availability in the recorded shared verification environment | Handoff remains for code review and ZVY-58. Local evidence does not establish shared provider availability or final owner approval. |

Local validation:

- Lint and typecheck: pass.
- Fixture contracts: four fixtures pass. The sandbox's Windows account lookup caused an infrastructure error on the first fixture run; the normal-host rerun passed.
- Production build: standalone `npm run build:ci` passed after restoring the final implementation. The browser suite's `test-app.mjs` setup also built and ran the implementation with `next build` followed by `next start` against the API double.
- Relevant Playwright suite: **82 passed**, including all **34** new scenarios plus **48** existing product-selection, accessibility, keyboard-navigation, mobile-purchase and purchase-flow checks.
- Baseline regression control: **12 intentionally failed, six capture scenarios passed** against `13b8ad5`, followed by automatic restoration of the implementation. Both routes fail the missing explanation/action check at all three widths. Five queued Buy clicks produce quantity five instead of one; five queued suggestion Add clicks produce five add-ons and 1,972 UAH instead of one add-on and 1,472 UAH. The same assertions pass in the implementation's 82-check run.

Reproduce with `npm run test:e2e -- suggestion-continuation product-selection accessibility keyboard-navigation mobile-purchase purchase-flow`. Set `ZVY64_EVIDENCE_PHASE=after` to regenerate the 15 after images. For before captures/controls, run the same spec with the three changed application files from `13b8ad5` and `ZVY64_EVIDENCE_PHASE=before`; use `--grep 'capture settled|rapid acceptance|rapid Buy|inaksha: keyboard continuation'`. Restore the implementation afterward. Screenshot scenarios are separate from the intentionally failing regression assertions.

## Review and handoff

Self-review covers the complete source/test diff, guard reset behavior, cart quantities/prices, exact-edition eligibility and dialog focus. No backend schema, validation or payment contract changes are required.

Netlify is explicitly skipped. Commit subjects and the draft PR title carry `[skip netlify]`; GitHub CI remains enabled. Do not mark shared deployment verification complete based on these local runs. Code review, shared-environment availability and final owner journey approval remain ZVY-58 handoffs. Real-phone, real-provider/payment and screen-reader checks were not performed; viewport/touch emulation and axe/keyboard checks are separate evidence. The existing documented brand contrast exception remains unchanged.
