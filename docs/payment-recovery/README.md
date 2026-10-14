# Payment return evidence — ZVY-40

## Owner-approved revision

On 2026-10-14 the owner deferred order-status and unpaid-order recovery UI, requested simple successful/unsuccessful returns, and chose separate bank success/failure redirects. The owner will arrange activation with Monobank. This supersedes the earlier acceptance mapping for detailed pending/canceled/unverified status views, invoice identifiers and recovery controls.

## Current customer flow

1. Checkout keeps the cart when creating an invoice and navigates to the existing bank payment page.
2. Monobank redirects successful payment to `/payment/success#reference=<UUID>`. The page reads only the backend's saved confirmation flag, never Monobank's status API. Saved hold/success/delivered (or free-order success) displays confirmation and removes unchanged purchased selections.
3. Monobank redirects unsuccessful payment to `/payment/failure`. This static page retains the cart and offers return to store/current cart. It does not query or modify an invoice.
4. If the signed webhook has not arrived, the success route briefly waits using at most five local reads, three seconds apart, with five-second request bounds. Missing/unreachable confirmation displays a neutral explanation and a contact link; it does not label a paid order failed or clear the cart. Direct success URLs and fabricated query parameters cannot confirm a payment.
5. Cart changes made after checkout survive older confirmations. Reload/revisit performs no fulfillment, notifications or delivery. Ordinary checkout refreshes catalogue and promo eligibility; changed prices/discounts require reviewing the total before submitting again.

No order ID, amount, raw status, previous-payment panel, check-status button, resume-payment button or explicit recovery/restoration UI remains. The promo message shown during a fresh checkout is ordinary total validation, separate from the removed previous-order flow.

## Release instructions

**Ask Monobank support to activate successUrl/failUrl redirects for the merchant.** The backend sends successUrl `<Mono:ReturnUrl>/payment/success#reference=<UUID>` and failUrl `<Mono:ReturnUrl>/payment/failure`, with no common redirectUrl. Activation is unavailable by default according to [Monobank invoice documentation](https://monobank.ua/api-docs/acquiring/methods/ia/post--api--merchant--invoice--create). Verify successful hold and unsuccessful returns with Monobank after activation. Stopping payment or closing the bank tab does not itself guarantee a redirect.

Review the backend/frontend PRs together and coordinate release so both new routes exist before customers receive their URLs. Preserve [skip netlify] in frontend commit/PR/merge messages. No Netlify deployment is authorized. Real-provider/payment, real-phone and manual screen-reader verification are separate evidence gaps and belong in ZVY-58.

## Storage and security

The hidden sessionStorage key `paymentSelections` contains reference plus item ID/quantity/format/selection revision only. It excludes invoice ID, payment URL, promo and customer name/email/phone/address/order note. The former paymentAttempts key is discarded. The regular cart remains in localStorage; contacts remain in memory. Snapshots are consumed after saved confirmation. Browser tab duplication/session restoration can copy or restore sessionStorage; it is not server-side token expiry.

The backend confirmation endpoint exposes only a boolean and cannot invoke Monobank or invoice side effects. Unknown references return 404. A copied reference may reveal that boolean while the invoice remains stored. Payment metadata is noindex/no-referrer; GA location excludes fragments, and Clarity initialization is excluded for the complete payment route subtree. Signed callback validation, stale-update protection and fulfillment idempotency are unchanged.

## Acceptance and verification

| Agreed behavior | Evidence |
| --- | --- |
| Separate success/failure URLs | Backend MonoInvoiceServiceTests paid payload assertions and free-order controller test |
| Trusted success, no provider status calls | Backend confirmation theories include overdue states and assert zero bank requests; frontend forged/missing/malformed/delayed confirmation tests |
| Simple failure keeps cart | Static failure and cart tests assert zero confirmation requests, retained selections and no previous-order panel |
| Safe cleanup and refresh | Session snapshot consumption/revisit/newer-item/re-add tests; backend repeated reads assert no queues/promo/delivery effects |
| Fresh total before a new invoice | Ordinary checkout promo-invalid test blocks another POST until the changed total is reviewed |
| Responsive/accessibility | Deterministic axe scans, keyboard cart/focus checks, layout overflow checks at 1440x900, 390x844, 360x844 |
| Reviewed/green pipeline | Subagent source/screenshot review and checks recorded on final PR heads |

Current screenshots are in `separate-redirects/`: success, failure, neutral unconfirmed return, failure with ordinary cart, and changed-promo checkout at all three viewports. Screens are captured from deterministic local fixtures (Test Book), not production, a real phone, or a real payment. `before/` remains the historical approved audit baseline. `after/` contains screenshots of the superseded implementation; they are retained only as historical evidence and do not describe the current UI.

Run the focused deterministic suite with ZVY40_EVIDENCE=after and `npx playwright test payment-recovery unpaid-recovery --project=desktop-chromium` to recapture the current screenshots. The test harness builds a production Next.js app against its local API double. Run lint separately from Playwright because Playwright replaces its output directory while starting. Backend contract details: [backend PR #41](https://github.com/Rutakamekiar/BookPreorder/pull/41), including PAYMENT_CONFIRMATION.md.

## Local verification

The final local run passed all 48 focused browser tests with a fresh production build and recaptured all 15 screenshots. Lint, TypeScript and all 4 fixture contracts passed. The subagent reviewed source and screenshots; all suggestions were applied, with no remaining source/visual blockers. Full remote checks are recorded on the final PR heads. An initial Windows test-helper shutdown needed cleanup; the final 48-test run completed normally.

## Changed files

Frontend routes: src/app/payment/layout.tsx, payment/page.tsx (neutral old route), payment/success/page.tsx, payment/failure/page.tsx. UI/state: PaymentResult.tsx/CSS, CartProvider.tsx, NavBar.tsx, ShoppingCart.tsx/CSS. API/types/storage: src/lib/api.ts, types.ts, payment.ts. Privacy: ClarityInit.tsx (existing fragment-free analytics remains). Tests: payment-recovery.spec.ts, unpaid-recovery.spec.ts, mock-api.mjs. Documentation: this README, ACCESSIBILITY.md and current screenshots. Backend: invoice controller/repository, PaymentConfirmationResponse, Monobank invoice service/return URL helper, associated tests and PAYMENT_CONFIRMATION.md; old invoice/provider status models removed.
