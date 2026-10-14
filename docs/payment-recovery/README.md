# Payment confirmation and unpaid recovery — ZVY-40

Implemented against the approved ZVY-57 handoff. The owner selected **tab-only recovery** on 2026-10-14 after discussing security. [Issue](https://linear.app/zvychajna/issue/ZVY-40/confirm-payment-outcomes-and-recover-unpaid-orders).

## Behavior and retention

- Invoice creation retains the cart and captures the submitted item/quantity/format/selection identities before awaiting the response.
- Recovery stores only invoice ID, opaque reference, provider URL, item IDs, quantities, formats, selection identities and promo code in `sessionStorage`. Contact, address and order-note data stay in the existing in-memory checkout draft.
- Existing cart and promo browser persistence remains intact. Recovery records belong to the browser's tab session, survive same-tab reload/provider handoff, and are consumed on trusted success. Browser tab duplication/session restoration may copy or restore session data; this is browser-managed session storage, not a server-enforced token expiry.
- New paid/free invoices return to `/payment#reference=...`. Receipt reads are no-store and disclose only order ID, verified status, amount and currency.
- Signed stored `hold` is confirmed authorization/received; `success`/`delivered` are successful. Pending, failure/expiry, cancellation and unverified outcomes have separate copy. Redirects, URL status claims and saved snapshots cannot prove payment.
- Monobank omits expiry webhooks. The backend reconciles only overdue pending invoices through a bounded, authenticated provider read; failures are unverified, and a newer signed stored callback wins. Reconciliation performs no persistence, fulfillment or notifications.
- Trusted success removes only purchased lines whose selection identities and quantities remain unchanged. Quantity edits, removed/re-added lines and unrelated new items survive. Successful snapshots are consumed once, so a revisited receipt cannot remove subsequently added books.
- Non-success review explicitly restores absent snapshot items with their original selection identity, without overwriting newer quantities. Manual remove/re-add creates a new identity. Review retrieves a fresh catalogue and revalidates promo eligibility. Unavailable/missing items and service failures block recovery. Expired promo is removed with visible feedback and current prices are shown before another invoice can be submitted.
- The ordinary cart/checkout path also validates fresh data for recovery attempts. A changed price or discount returns the customer to the updated cart before any new invoice POST. Edits during new pre-invoice checks cannot post an older captured selection. The excluded late-response behavior after invoice POST has already started is preserved.
- An unchanged pending/unverified selection returns to its original receipt instead of creating another invoice. Original invoice amount is visible before continuing to the stored provider URL. Changing the selection or promo intentionally creates a distinct order after fresh validation; the original payment is not silently canceled.
- Malformed session records fail closed; provider URLs accept only known Monobank HTTPS destinations or the same-origin receipt route (loopback tests additionally allow `example.invalid`). Storage failures keep the in-memory/cart and receipt usable without unsafe cart clearing; recovery snapshots cannot survive handoff when session storage is unavailable.

## Security and accessibility

The reference is a read-only bearer capability for basic status/amount. Session storage reduces persistence but is readable by same-origin JavaScript and does not revoke a copied URL. The backend documents token/logging limits in `PAYMENT_CONFIRMATION.md`; server expiry/authenticated cross-session recovery is separate work.

The reference is kept in the URL fragment rather than query analytics. GA explicitly receives a fragment-free page location, and Clarity initialization skips the receipt page. Cart recovery uses buttons without token-bearing href attributes. Receipt metadata disables indexing and referrers.

Status copy uses a polite live region. Manual recheck → success preserves focus on the receipt heading; later background polls do not steal focus. Existing navigation, dialog keyboard behavior and brand focus treatment are retained. Retry feedback appears inside the cart instead of covering its total/actions with a toast. Recovery controls remain visible on desktop as well as mobile.

## Acceptance mapping

| Criterion | Implementation/evidence |
| --- | --- |
| Successful payment opens confirmation | Paid/free return URLs, `PaymentResult`, backend redirect tests, controlled successful handoff |
| Success distinct from pending/failed/canceled/unverified | Trusted status mapping; forged URL, unknown reference and provider failure tests |
| Refresh/revisit has no payment side effects | Read-only receipt endpoint; existing signed webhook/fulfillment guards; consumed snapshot and repeated-read tests |
| Non-success retains review/retry context | Tab-only snapshot + retained cart; pending/failed/canceled/unknown return tests |
| Retry rechecks current price/availability/promo | Fresh provider result and checkout guard; changed price, expired promo, unavailable/empty catalogue and outage tests |
| New cart edits survive later outcomes | Line selection identities; remove/re-add, newer quantity, consumed receipt and async precheck/review race tests |
| Desktop/mobile/narrow and accessibility | 1440×900, 390×844, 360×844 screenshots; keyboard and axe checks |
| Reviewed and green build/test pipeline | Subagent plan/source/screenshot review with suggestions applied; local results below; final remote checks on companion PRs |

## Verification and evidence

Local verification environment: production Next.js application at `http://127.0.0.1:3100`, deterministic API double at `http://127.0.0.1:4100`. Production, real provider payments and external delivery systems were not used.

- Backend: Release restore/build, **300 tests**, publish passed. Existing compiler/analyzer warnings remain; local NuGet vulnerability lookup was unavailable.
- Frontend: lint, typecheck and four deterministic fixture checks passed; production build ran as part of Playwright.
- Local full frontend run: 536 passed, 18 intentional opt-in evidence skips, one gallery loading failure. That failure exposed initial slide loading priority changing during navigation; the immutable initial-index fix and settled-scroll assertion passed the 33 gallery/performance checks. Twelve final restoration/edit/race checks also passed. Final full regression is required in the frontend PR's `verify` CI job.
- Remote CI results belong to the final PR heads. Backend companion: [BookPreorder PR #41](https://github.com/Rutakamekiar/BookPreorder/pull/41). The final delivery links both PRs and reports only retrieved check results.

`after/` contains receipt, recovery and fresh retry screenshots for all required viewports. `before/` contains copies of the previously approved historical unverified-return screenshots, originally captured by the storefront audit; they are labeled as historical baseline, not a new production or before-run check.

The requested subagent reviewed the plan, backend/frontend source, and desktop/mobile/narrow screenshots. Applied findings include reference-safe finalization, stale receipt reset, truthful hold/amount copy, focus preservation, active-attempt checks after awaits, fresh retry enforcement at the submission boundary, visible desktop recovery controls and feedback inside the cart.

## Release and handoff

Both repositories use `codex/zvy-40-payment-outcomes`. Backend is based on updated `develop`; frontend is based on updated `main` under its own instructions. Frontend commits/PR title carry `[skip netlify]` and retain normal GitHub verification.

**No Netlify deployment is authorized or performed.** `/payment` redirects require the frontend route, so coordinate backend/frontend release rather than releasing either independently to customer traffic. After code review, merge and coordinated release, run the recorded journey verification for ZVY-58 in the agreed environment. Real-phone, actual-provider/payment and manual screen-reader checks remain explicit evidence gaps; browser emulation and axe do not claim those passes.

## Files

Backend: `Models/Common/RedirectResponse.cs`; new `Models/Invoices/InvoiceStatusResponse.cs`, `Models/MonoInvoice/MonoInvoiceStatus.cs`, `Services/PaymentReturnUrl.cs`; `Services/MonoInvoiceService.cs`, `Infrastructure/InvoiceRepository.cs`, `Controllers/InvoiceController.cs`; controller/service tests; new `PAYMENT_CONFIRMATION.md`.

Frontend: `src/lib/types.ts`, `api.ts`, new `payment.ts`; `CartProvider.tsx`, `ProductsProvider.tsx`; `NavBar.tsx`, `ShoppingCart.tsx` and CSS; new `PaymentResult.tsx` and CSS, `src/app/payment/page.tsx`; analytics/layout/Clarity; mock API; new payment/unpaid recovery specs; realistic long-cart UUID fixtures in `mobile-purchase.spec.ts`; narrow initial-loading fix in `ImageCarousel.tsx` and its settled-navigation regression in `performance.spec.ts`; `ACCESSIBILITY.md`; this document and before/after screenshots.
