# Payment returns — ZVY-40

## Decision — 2026-10-16

Monobank redirects customers to separate success and failure pages. The pages trust the redirect only for what the customer sees; payment state and fulfillment (delivery, emails, promo usage) are handled by the backend's signed Monobank webhook. The earlier confirmation polling, payment reference and cart snapshots were removed as unnecessary for this shop: a forged visit to the success page can only show a thank-you message and clear the visitor's own cart.

## Customer flow

1. Checkout creates the invoice and navigates to the bank payment page. The cart is kept. The redirect must be https (plain http only on localhost).
2. Successful payment → `/payment/success`: "Дякуємо за покупку!" with a green check, the order email is the receipt (with a spam-folder/contact hint), and the cart and applied promo are cleared. Other open tabs of the store pick up the cleared cart.
3. Unsuccessful payment → `/payment/failure`: "Оплату не завершено" with a red exclamation mark, the cart is kept; the primary "Спробувати ще раз" opens the cart, the secondary link returns to the store, and a contact hint covers money that was charged anyway. No request is made and no invoice is changed.
4. Free orders (total 0) go straight to the success page.

Payment pages are noindex and send no referrer.

## Known limits

- Opening `/payment/success` directly clears that visitor's cart (no payment or fulfillment happens).
- A success return in a different browser or in-app webview cannot clear the cart stored in the original browser.
- Closing the bank page without paying leaves the customer on the bank side; the cart is unchanged.

## Release

Monobank confirmed activation of separate success/failure redirects (2026-10-16). Make one real successful and one cancelled payment after release and check both returns. Deploy this frontend before or together with the backend (BookPreorder `PAYMENT_RETURNS.md`). Preserve `[skip netlify]` unless a deployment is approved. Real-phone and screen-reader checks belong to ZVY-58.

## Tests

`tests/e2e/payment-return.spec.ts` covers both returns at 1440, 390 and 360px (axe, overflow, keyboard/focus), cart clearing on success including a new tab, and cart retention on failure.
