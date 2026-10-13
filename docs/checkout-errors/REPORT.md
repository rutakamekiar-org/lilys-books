# ZVY-67 — actionable checkout rejections and correction on blur

[Issue](https://linear.app/zvychajna/issue/ZVY-67) · [approved decisions](../storefront-review/DECISIONS.md#f-check-005-actionable-server-rejection) · [final journey verification](https://linear.app/zvychajna/issue/ZVY-58)

Implementation and local verification date: 2026-10-13. Branch: `codex/zvy-67-checkout-errors`, based on updated frontend `main` at `240addd`. The verification environment is a local Next.js production build at `http://127.0.0.1:3100`, backed by the deterministic API at `http://127.0.0.1:4100`. Browser requests to other hosts are blocked except fulfilled local provider/payment fixtures. No production order or payment is submitted.

## Result and boundaries

Checkout now owns invoice failure feedback. Known customer paths become safe Ukrainian inline messages, and a persistent summary links to each field or rejected cart line. Item indices are resolved against the submitted selection, rather than a later cart ordering. A rejected line has an edit/remove action that opens its existing cart controls and focuses Remove. Cart-wide and promo errors offer cart correction; unknown, hidden-field, out-of-range and malformed paths have safe recovery feedback. Neither server exception text nor validation message text is rendered.

Temporary failures have a persistent Retry action. Invoice rejection, network failure, HTTP 500, and malformed successful responses retain the draft, items, quantities and promo. Only a successful response with a redirect URL closes checkout and clears the cart. Existing submission deduplication remains in place.

After a failed field is edited, blur reruns its local rules and clears obsolete messages and invalid semantics only when the new value is valid. An unchanged value does not dismiss a server rejection. Opening checkout and leaving untouched fields do not introduce invalid feedback. Full validation still runs on submission. Existing name/email length limits from the backend are included in this correction check. The optional comment retains its 500-character input limit.

The rejection summary receives focus and uses `role="alert"`; inline errors use descriptions and alerts. Summary links focus and scroll to correction locations. Nova Post's button retains the existing description-based error association because role=button does not support `aria-invalid`. Its mouse activation is adjusted to open reliably when correction-on-blur removes a preceding error row: focus moves to the picker opener on click before the nested dialog opens, preserving focus restoration on close. Shared dialog hooks, focus styling, pricing, backend contracts and payment processing are unchanged.

## Files

| File | Change |
| --- | --- |
| `src/lib/checkout-errors.ts` | New bounded path interpretation and safe field/item/cart/promo messages; distinction between rejection and temporary failure. |
| `src/lib/api.ts` | Invoice failures propagate to checkout without the former network toast. |
| `src/components/organisms/NavBar.tsx` | Propagate failures, guard malformed success, preserve state on failure, and connect targeted cart correction. |
| `src/components/organisms/CheckoutForm.tsx` | Persistent recovery, inline errors, summary links, announcements/focus, and correction on blur. |
| `src/components/organisms/CheckoutForm.module.css` | Local summary and correction-action layout. |
| `src/components/organisms/ShoppingCart.tsx` | Focus the affected line's existing removal control after targeted opening. |
| `src/components/organisms/NovaPoshtaWidget.tsx` | Preserve click activation and opener focus while a preceding corrected error disappears. |
| `tests/e2e/checkout-errors.spec.ts` | Deterministic response interpretation and browser regressions; exact submitted selection, promo, customer and note assertions. |
| `docs/checkout-errors/REPORT.md` | This review and verification record. |
| `docs/checkout-errors/captures.json` | Enumerates every new screenshot, phase, viewport, UTC time, size and SHA-256 hash. |
| `docs/checkout-errors/before/*.jpg`, `after/*.jpg` | 24 matched before/after captures per phase, plus three supplemental after item-correction captures; individual files are listed in the manifest. |

## Acceptance criteria

| Criterion | Local result |
| --- | --- |
| Controlled 400 customer paths show associated inline errors; item paths identify the affected line and allow edit/remove; summary links reach corrections | Implemented. Customer, indexed item, quantity, cart-wide and promo paths are covered. Item correction removes the rejected digital line and subsequently submits the retained physical order with exact payload assertions. |
| Unknown paths have persistent safe explanation and recovery; backend exception details never displayed | Implemented. Unknown, mixed known/unknown, malformed and out-of-range paths are covered; synthetic secret strings are absent from rendered feedback. |
| Controlled 500/network failures provide retry; form/cart/promo retained; no success or redirect after error | Implemented. Retry retains exact digital selection, quantity, customer details, note and promo. Malformed successful responses also retain the draft. |
| Rejection focus, programmatic association and announcement; subsequent corrected submission proceeds | Implemented and covered by focus, accessible-description, alert, axe and exact-submission assertions. Actual screen-reader speech remains separate evidence. |
| Correcting and leaving a failed field removes stale message/aria-invalid; invalid fields retain feedback; untouched fields are not invalid on opening | Implemented. Includes unchanged server-rejected values, invalid corrections, and supported name/email length boundaries. |
| Feedback updates do not send invoices or clear values; later submission still validates | Implemented. Correction asserts zero additional invoice calls; invalid requests remain blocked; subsequent valid submissions proceed through local payment fixtures. |
| Required lint, typecheck, production build, relevant Playwright checks and green CI | Local verification is recorded below. The required `verify` result is tracked on [PR #49's latest head](https://github.com/rutakamekiar-org/lilys-books/pull/49/checks) and must be green before handoff. |
| Reviewed implementation available in the recorded environment before ZVY-58 | Local production verification is available. Independent review, merge and availability in the agreed final journey environment remain handoff requirements. Netlify is skipped at the owner's request. |

## Verification

- Lint and type checking: passed on the implementation.
- Fixture contracts: four deterministic product fixtures passed.
- Isolated production build with deterministic API: passed, exit 0.
- Relevant Playwright suite: **156 passed, six skipped, exit 0** (5.3 minutes). All 30 ZVY-67 checks passed. The six skipped checks are opt-in screenshot-only scenarios for ZVY-68 and ZVY-62; their behavior and accessibility checks ran successfully.
- Diff whitespace and complete source/test self-review: passed. All confirmed findings were corrected before final verification.
- Remote CI: the required GitHub `verify` job runs on [PR #49](https://github.com/rutakamekiar-org/lilys-books/pull/49/checks). Check the current head revision and result there; local success is not a substitute. The final handoff reports the retrieved result for that exact head.

PR integration verification: [PR #49](https://github.com/rutakamekiar-org/lilys-books/pull/49) initially conflicted with the newly merged ZVY-70 delivery-cost update. Frontend `main` at `ea87f1a` was merged into this feature branch; the only manual conflict was adjacent imports in `CheckoutForm.tsx`, resolved by retaining both the checkout-error helper and delivery icon imports. The merged delivery disclosure and goods-total label remain intact. Lint and typecheck passed, and the reconciled production build passed **121 Playwright checks, three optional capture-only checks skipped, exit 0** (5.2 minutes), covering checkout errors, retained drafts, delivery costs, picker focus, accessibility and keyboard behavior. The original screenshot evidence remains tied to the earlier implementation/base documented above. Remote CI is being checked on the updated PR head.

Commands:

```powershell
npm run lint
npm run typecheck
npm run test:fixtures
npm run build:ci
$env:PWTEST_CACHE_DIR='node_modules/.cache/zvy67-playwright'
npm run test:e2e -- checkout-errors checkout-draft checkout-order-note checkout-money promo-allocation purchase-flow accessibility keyboard-navigation mobile-purchase sheet-dismiss delivery-picker --project=desktop-chromium
```

On this host the sandboxed baseline runner completed 21 capture scenarios, then stalled during test-server cleanup and was interrupted (exit 1). This is capture evidence, not a passing acceptance-suite result. Subsequent runners use process cleanup permissions and a workspace Playwright cache. The sandboxed fixture run failed in Node's user-information call; its unrestricted retry passed. An overlapping build attempt encountered the already-running local fixture port; it is excluded as standalone evidence, and the later isolated build passed cleanly.

Regression tests exposed a picker click lost when clearing the phone-error row. Suppressing premature mouse-down focus fixed activation, and explicitly focusing the opener during click preserved close/Escape focus restoration. The first recovery-edge test used an ambiguous amount locator; it now asserts the digital line's amount directly. These failures and fixes are retained here as diagnostic history, not accepted gaps.

## Evidence and handoff

Before and after cover validation, corrected-field feedback, server validation, item rejection, unknown rejection, malformed rejection, temporary invoice failure and network failure at 1440×900, 390×844 and 360×844. Supplemental after captures show the rejected line and its correction action. The original captures use the unmodified application build from base `240addd`. Capture-mode early returns are solely for the original behavior and do not assert acceptance. Normal CI does not set `ZVY67_EVIDENCE_PHASE`, so all acceptance assertions run.

After evidence can be reproduced by setting `ZVY67_EVIDENCE_PHASE=after` before the checkout-errors Playwright run. Screenshot paths, exported dimensions and timestamps are in [captures.json](captures.json). Screenshots are inspected for layout; desktop/mobile browser emulation does not establish real-phone or software-keyboard behavior.

| State | 1440×900 before / after | 390×844 before / after | 360×844 before / after |
| --- | --- | --- | --- |
| Corrected-field feedback | [Before](before/SCR-05-corrected-errors-1440x900.jpg) / [After](after/SCR-05-corrected-errors-1440x900.jpg) | [Before](before/SCR-05-corrected-errors-390x844.jpg) / [After](after/SCR-05-corrected-errors-390x844.jpg) | [Before](before/SCR-05-corrected-errors-360x844.jpg) / [After](after/SCR-05-corrected-errors-360x844.jpg) |
| Known customer rejection | [Before](before/SCR-05-server-validation-1440x900.jpg) / [After](after/SCR-05-server-validation-1440x900.jpg) | [Before](before/SCR-05-server-validation-390x844.jpg) / [After](after/SCR-05-server-validation-390x844.jpg) | [Before](before/SCR-05-server-validation-360x844.jpg) / [After](after/SCR-05-server-validation-360x844.jpg) |
| Unknown rejection | [Before](before/SCR-05-unknown-rejection-1440x900.jpg) / [After](after/SCR-05-unknown-rejection-1440x900.jpg) | [Before](before/SCR-05-unknown-rejection-390x844.jpg) / [After](after/SCR-05-unknown-rejection-390x844.jpg) | [Before](before/SCR-05-unknown-rejection-360x844.jpg) / [After](after/SCR-05-unknown-rejection-360x844.jpg) |
| Temporary invoice failure | [Before](before/SCR-05-invoice-error-1440x900.jpg) / [After](after/SCR-05-invoice-error-1440x900.jpg) | [Before](before/SCR-05-invoice-error-390x844.jpg) / [After](after/SCR-05-invoice-error-390x844.jpg) | [Before](before/SCR-05-invoice-error-360x844.jpg) / [After](after/SCR-05-invoice-error-360x844.jpg) |
| Item correction action (supplemental) | [After](after/SCR-05-item-correction-1440x900.jpg) | [After](after/SCR-05-item-correction-390x844.jpg) | [After](after/SCR-05-item-correction-360x844.jpg) |

Self-review covers the complete source/test diff, safe error interpretation, submission/side-effect ordering, snapshot-based item association, local correction rules, focus restoration and failure/retry paths. The backend is unchanged, so no backend contract migration, build or test result is claimed.

The owner explicitly authorized using the existing GitHub credentials to push this branch, open a `[skip netlify]` review PR and verify CI on 2026-10-13. An earlier authentication check was rejected by automatic approval review before that authorization; the rejected command did not execute. Commit/PR subjects must retain `[skip netlify]`; no Netlify action is authorized here.

Independent code review, merge and final availability remain required before ZVY-58. Real-phone, live carrier/provider/payment outcomes, screen-reader speech and software-keyboard obstruction remain explicit verification gaps. Existing accepted brand contrast treatment remains unchanged. The issue is not declared fully done while these required handoffs and remote CI are pending.
