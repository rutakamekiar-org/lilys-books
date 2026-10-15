# Payment return evidence — ZVY-40

## Owner-approved revision

On 2026-10-14 the owner deferred order-status and unpaid-order recovery UI, requested simple successful/unsuccessful returns, and chose separate bank success/failure redirects. The owner will arrange activation with Monobank. This supersedes the earlier acceptance mapping for detailed pending/canceled/unverified status views, invoice identifiers and recovery controls.

## Current customer flow

1. Checkout keeps the cart when creating an invoice and navigates to the existing bank payment page.
2. Monobank redirects successful payment to `/payment/success#reference=<UUID>`. The page reads only the backend's saved confirmation flag, never Monobank's status API. Saved hold/success/delivered (or free-order success) displays confirmation and subtracts the purchased quantities from the cart once.
3. Monobank redirects unsuccessful payment to `/payment/failure`. This static page retains the cart and offers return to store/current cart. It does not query or modify an invoice.
4. If the signed webhook has not arrived, the success route briefly waits using at most five local reads, three seconds apart, with five-second request bounds. Network errors, timeouts and 5xx responses use the same retries; unknown references (404) and malformed answers stop at once. Missing/unreachable confirmation displays a neutral explanation and a contact link; it does not label a paid order failed or clear the cart. Direct success URLs and fabricated query parameters cannot confirm a payment.
5. Items added or quantities increased after checkout survive the confirmation. A success return in a different tab of the same browser (for example after the bank app) cleans the cart too, and other open tabs pick up the change. A return in another browser or in-app webview, or a confirmation that arrives after the page stops waiting, leaves the paid items in the cart; the page asks the customer not to pay again. Reload/revisit performs no fulfillment, notifications or delivery. Prices, eligibility and promo validity for a new checkout are validated by the backend at invoice creation, as before.

No order ID, amount, raw status, previous-payment panel, check-status button, resume-payment button or explicit recovery/restoration UI remains.

## Release instructions

**Ask Monobank support to activate successUrl/failUrl redirects for the merchant.** The backend sends successUrl `<Mono:ReturnUrl>/payment/success#reference=<UUID>` and failUrl `<Mono:ReturnUrl>/payment/failure`, with no common redirectUrl. Activation is unavailable by default according to [Monobank invoice documentation](https://monobank.ua/api-docs/acquiring/methods/ia/post--api--merchant--invoice--create). Verify successful hold and unsuccessful returns with Monobank after activation. Stopping payment or closing the bank tab does not itself guarantee a redirect.

Review the backend/frontend PRs together and coordinate release so both new routes exist before customers receive their URLs. Preserve [skip netlify] in frontend commit/PR/merge messages. No Netlify deployment is authorized. Real-provider/payment, real-phone and manual screen-reader verification are separate evidence gaps and belong in ZVY-58.

## Storage and security

Each checkout stores a localStorage entry `paymentSelection:<reference>` containing only `createdAt` and the purchased item IDs/quantities. It excludes invoice ID, payment URL, promo and customer name/email/phone/address/order note. The regular cart remains in localStorage; contacts remain in memory. The entry is consumed by the first saved confirmation and ignored/pruned after 24 hours; this is a client-side cleanup window, not server-side token expiry. If storage is unavailable the cart is simply left as it is.

The backend confirmation endpoint exposes only a boolean and cannot invoke Monobank or invoice side effects. Unknown references return 404. A copied reference may reveal that boolean while the invoice remains stored. Payment metadata is noindex/no-referrer; GA location excludes fragments, and Clarity initialization is excluded for the complete payment route subtree. Signed callback validation, stale-update protection and fulfillment idempotency are unchanged.

## Acceptance and verification

| Agreed behavior | Evidence |
| --- | --- |
| Separate success/failure URLs | Backend MonoInvoiceServiceTests paid payload assertions and free-order controller test |
| Trusted success, no provider status calls | Backend confirmation theories include overdue states and assert zero bank requests; frontend forged/missing/malformed/delayed confirmation tests |
| Simple failure keeps cart | Static failure and cart tests assert zero confirmation requests, retained selections and no previous-order panel |
| Safe cleanup and refresh | Snapshot consumption/revisit/newer-item/new-tab/expiry tests; backend repeated reads assert no queues/promo/delivery effects |
| Temporary confirmation errors | A 503 followed by saved confirmation still shows success |
| Responsive/accessibility | Deterministic axe scans, keyboard cart/focus checks, layout overflow checks at 1440x900, 390x844, 360x844 |
| Reviewed/green pipeline | Subagent source/screenshot review and checks recorded on final PR heads |

The ten retained screenshots in `separate-redirects/` show success, failure and unavailable confirmation at 1440x900, 390x844 and 360x844 (nine images), plus the ordinary retained cart at 390x844 (one image). Superseded screens, copied historical baselines and duplicate cart/promo captures were removed. The capture tests generate only this set. These are deterministic local fixtures (Test Book), not production, a real phone or a real payment.

Run the focused deterministic suite with ZVY40_EVIDENCE=after and `npx playwright test payment-recovery payment-cart --project=desktop-chromium` to recapture the current screenshots. The test harness builds a production Next.js app against its local API double. Run lint separately from Playwright because Playwright replaces its output directory while starting. Backend contract details: [backend PR #41](https://github.com/Rutakamekiar/BookPreorder/pull/41), including PAYMENT_CONFIRMATION.md.

## Verification

Follow-up simplification (cart snapshot in localStorage, transient-error retries, https-only redirect check, return-URL path handling) was verified locally with the backend suite (all ZVY-40 tests pass; one pre-existing Goodreads notification test fails only under the uk-UA machine culture, also on the unchanged branch), the focused payment-recovery/payment-cart/mobile-purchase browser specs on a fresh production build, lint and TypeScript, and a separate subagent code review. Screenshots were not recaptured: the payment pages and the cart drawer render as before.

Backend tests retain saved-outcome mapping coverage. Frontend tests use one confirmed-response scenario per viewport because the client receives only a boolean; duplicate bank-status mapping cases were removed. The retained tests cover late/missing/malformed/temporarily failing confirmation, forged URLs, replay safety, new-tab returns and current-cart preservation. Build/test results and source/screenshot review are recorded on the final PR heads.

## Changed files

Frontend routes: src/app/payment/layout.tsx, payment/success/page.tsx, payment/failure/page.tsx. UI/state: PaymentResult.tsx/CSS, CartProvider.tsx, NavBar.tsx. API/types/storage: src/lib/api.ts, types.ts, payment.ts. Privacy: ClarityInit.tsx (existing fragment-free analytics remains). Tests: payment-recovery.spec.ts, payment-cart.spec.ts, mock-api.mjs. Documentation: this README, ACCESSIBILITY.md and current screenshots. Backend: invoice controller/repository, PaymentConfirmationResponse, RedirectResponse, Monobank invoice service/return URL helper, associated tests and PAYMENT_CONFIRMATION.md. No invoice-validity override, raw invoice status model or provider status lookup remains. Creation responses contain only redirectUrl/reference; the unused invoiceId field was removed. Internal invoice identifiers continue to support normal webhook processing and delivery.
