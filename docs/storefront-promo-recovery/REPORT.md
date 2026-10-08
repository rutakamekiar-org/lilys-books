# ZVY-71 — promo rejection and temporary failure recovery

[Issue](https://linear.app/zvychajna/issue/ZVY-71) · [approved decision F-CHECK-008](../storefront-review/DECISIONS.md#f-check-008-distinguish-promo-rejection-from-outage) · [original finding](../storefront-review/REPORT.md#f-check-008-a-promo-service-outage-is-reported-as-an-invalid-code)

## Implementation

HTTP 400, 404 and 422 responses show persistent correction feedback beside the promo input. Network failures and other HTTP failures, including 503, 500, 429 and 401, show a temporary-failure explanation and a **Повторити** (Retry) button. The entered code is retained. Retry uses the same provider/API path and unchanged cart selection; a recovered service can apply the unchanged valid code.

The promo row and feedback have a 6 px gap. Retry uses a neutral outline button while checkout retains its orange primary treatment. Retry keeps that secondary appearance during loading.

The API error includes the actual response status even for non-JSON failure bodies. Promo requests propagate their errors to the cart, which owns the persistent feedback, avoiding a second generic network toast. Other API notification paths retain their existing behavior.

During validation, the button is disabled, the input is read-only, and a synchronous request guard also prevents repeated Enter events from sending duplicate requests. The loading action has an accessible name. Failure feedback uses `role="alert"`, is associated with the input through `aria-describedby`, and marks only rejected codes as `aria-invalid`. It remains until the customer edits the code, retries, or succeeds, including when the cart is closed and reopened in the same page session.

CartProvider updates the applied promo only after a successful request. No cart mutation or price calculation was added to failure handling. Success, removal, stored applied promos and discount allocation retain their existing behavior. Inspection confirmed there is **no applied-promo refresh request/failure state**: stored applied promos are restored locally. The regression suite verifies that reloading an applied promo sends no new validation request. No new refresh policy is introduced.

### Changed files

- `src/models/ApiError.ts`: transport status metadata.
- `src/lib/api.helper.ts`: attach actual HTTP status when a response fails.
- `src/lib/api.ts`: propagate promo network failures to the cart.
- `src/components/organisms/ShoppingCart.tsx`: persistent failure states, Retry, accessible associations and duplicate-request protection.
- `src/components/organisms/ShoppingCart.module.css`: wrapping and spacing for inline feedback.
- `tests/e2e/cart-promo-layout.spec.ts`: replace the former outage-as-invalid/toast-expiry assertions with the new persistent feedback expectations.
- `tests/e2e/promo-recovery.spec.ts`: controlled rejection, outage, recovery, loading, persistence, amounts and evidence coverage.
- This report and 27 JPG captures: 12 before, 12 matching after, and three additional after-only retry-loading captures.

## Environment and reproducibility

Verified locally on 2026-10-08, on branch `codex/zvy-71-promo-recovery`, based on updated frontend `main` revision `7798a9aa61e5b9ade072f78437da83b6b9f6788a`. The frontend repository has no `develop` branch. The BookPreorder backend is unchanged.

The environment is a production Next.js 16.3.4 application at `http://127.0.0.1:3100` with the deterministic API at `http://127.0.0.1:4100`, Node 24.11.1 on Windows and Playwright Chromium. CSS viewports are 1440×900, 390×844 and 360×844; the mobile widths enable emulated touch. Browser requests to non-loopback hosts are aborted. No production API, invoice submission or payment is used; every new browser scenario asserts zero invoice requests.

The shared fixture is a paper edition of «Звичайна. Перша частина дилогії», quantity 2, effective unit price 399 UAH, subtotal/undiscounted total 798 UAH. `AUDIT10` gives the existing rounded unit price 359 UAH, discount 80 UAH and total 718 UAH. Tests assert the validation code and item IDs, stored cart selection, unchanged undiscounted failure amounts, recovered total and stored applied-promo behavior.

Run the standard suite with:

```powershell
npm run lint
npm run typecheck
npm run test:fixtures
npm run build:ci
npm run test:e2e -- promo-recovery cart-promo-layout promo-allocation accessibility keyboard-navigation --project desktop-chromium
```

Set `ZVY71_EVIDENCE_PHASE=after` for the browser command to regenerate current screenshots. The three evidence-only tests skip in ordinary CI. To reproduce before captures, build application sources from the recorded base revision, then run the same evidence test with `ZVY71_EVIDENCE_PHASE=before`. The regression tests still target the implemented behavior; the evidence-only test deliberately distinguishes the old rejection toast from current inline feedback.

Local Windows verification starts the same mock API and built production app independently and uses a temporary config that imports the checked-in Playwright config with only `webServer: []`. This avoids repeated builds and nested-process cleanup issues; it does not change tests, fixture endpoints, projects or browser settings. That temporary config is excluded from the PR. CI uses the normal checked-in runner.

## Before/after evidence

These are matching local controlled captures of the recorded base and implementation, not observations of the production website. Sizes, product, quantity, price and code match. The before outage shows the misleading invalid-code toast; the after outage shows persistent inline temporary-failure feedback and Retry. Recovered amounts and selections match.

| State | Width | Before | After |
| --- | --- | --- | --- |
| Loading | 1440 | [Before](before/SCR-04-promo-loading-1440x900.jpg) | [After](after/SCR-04-promo-loading-1440x900.jpg) |
| Invalid | 1440 | [Before](before/SCR-04-promo-invalid-1440x900.jpg) | [After](after/SCR-04-promo-invalid-1440x900.jpg) |
| Outage | 1440 | [Before](before/SCR-04-promo-outage-1440x900.jpg) | [After](after/SCR-04-promo-outage-1440x900.jpg) |
| Applied | 1440 | [Before](before/SCR-04-promo-applied-1440x900.jpg) | [After](after/SCR-04-promo-applied-1440x900.jpg) |
| Loading | 390 | [Before](before/SCR-04-promo-loading-390x844.jpg) | [After](after/SCR-04-promo-loading-390x844.jpg) |
| Invalid | 390 | [Before](before/SCR-04-promo-invalid-390x844.jpg) | [After](after/SCR-04-promo-invalid-390x844.jpg) |
| Outage | 390 | [Before](before/SCR-04-promo-outage-390x844.jpg) | [After](after/SCR-04-promo-outage-390x844.jpg) |
| Applied | 390 | [Before](before/SCR-04-promo-applied-390x844.jpg) | [After](after/SCR-04-promo-applied-390x844.jpg) |
| Loading | 360 | [Before](before/SCR-04-promo-loading-360x844.jpg) | [After](after/SCR-04-promo-loading-360x844.jpg) |
| Invalid | 360 | [Before](before/SCR-04-promo-invalid-360x844.jpg) | [After](after/SCR-04-promo-invalid-360x844.jpg) |
| Outage | 360 | [Before](before/SCR-04-promo-outage-360x844.jpg) | [After](after/SCR-04-promo-outage-360x844.jpg) |
| Applied | 360 | [Before](before/SCR-04-promo-applied-360x844.jpg) | [After](after/SCR-04-promo-applied-360x844.jpg) |

The updated secondary Retry loading state is also captured at [1440×900](after/SCR-04-promo-retry-loading-1440x900.jpg), [390×844](after/SCR-04-promo-retry-loading-390x844.jpg), and [360×844](after/SCR-04-promo-retry-loading-360x844.jpg).

## Acceptance criteria and handoff

| Criterion | Result |
| --- | --- |
| Rejections provide correction; network/503 failures provide temporary feedback and Retry while retaining the code | Implemented; deterministic browser checks |
| Recovery accepts the unchanged valid code; loading blocks duplicates; failures preserve quantities/prices | Implemented; request-count, selection, line-price and total assertions |
| Persistent/announced feedback, all required widths, applied-promo refresh policy if supported | Implemented with alert/field associations and overflow checks; no applied-promo refresh state exists |
| Before/after captures at the three required viewports | Recorded locally for loading, invalid, outage and success |
| Lint, typecheck, production build and relevant Playwright checks | Verification results recorded below |
| Required green GitHub CI | The current PR head's required `verify` check is authoritative; see [branch CI runs](https://github.com/rutakamekiar-org/lilys-books/actions?query=branch%3Acodex%2Fzvy-71-promo-recovery). Final status is reported in the PR/task handoff. |
| Review and availability in the final journey verification environment | Review/merge and chosen environment remain handoff requirements |

Netlify deployment is skipped at the owner's explicit request. Keep `[skip netlify]` in the PR title and final merge/squash subject. Real-phone, software-keyboard, screen-reader speech, provider and payment verification are separate evidence gaps; browser emulation and axe checks do not establish those passes. Final ZVY-58 journey verification and product-owner acceptance remain separate required handoffs.

## Verification results

- Lint, TypeScript typecheck and deterministic product fixture validation passed. The fixture validator checked four deterministic product fixtures.
- Production build passed against the local API, including the final build after restoring implementation sources from the baseline capture.
- The initial focused production-build run passed 78 checks across promo layout, allocation, recovery, accessibility and keyboard navigation. Three unrelated allocation evidence-only checks skipped as intended.
- The final expanded promo-recovery run passed all 33 checks, including 400/422 rejection, network/503/500/429/401 failure recovery, both feedback kinds outliving the old five-second toast, error-state axe scans at all three widths, readonly loading input and repeated Enter protection.
- The matched before and after evidence runs each passed all three viewport scenarios. Captures preserve toast animations because forcibly finishing them can remove the baseline feedback while taking a screenshot.
- Regression control: the new desktop `503 retains code and amounts` test was run against application sources built from the recorded base revision. It failed at the expected temporary-failure feedback assertion because the cart had no inline alert. The same scenario passed after the implementation. This deliberate baseline failure is evidence that the regression catches the defect, not an outstanding implementation failure.
- Visual review checked the misleading baseline toast, persistent after feedback, Ukrainian wrapping, Retry and preserved cart navigation at the required widths. No horizontal overflow was found; quantities and undiscounted/recovered totals match the fixture.
- Self-review covered the complete application/test diff, actual HTTP status handling for non-JSON bodies, duplicate request locking, async failure recovery, field/error associations, applied-promo persistence, unchanged allocation logic and documentation links. No outstanding implementation defects were found.

### Owner refinements

The owner requested tighter feedback spacing and a less dominant Retry action. The gap was reduced from 10 px to 6 px, and Retry now has a neutral outline treatment. A loading action distinguishes apply from retry so that the spinner remains secondary during retry. Invalid-code correction and temporary-failure Retry messages remain distinct.

Lint, typecheck and the deterministic production build passed after these refinements. The updated promo-recovery and cart-layout run passed all 39 checks. The 503 scenarios hold the retry request open and assert a visible spinner, disabled action, readonly code, preserved secondary hierarchy, unchanged cart/total, and exactly one retry despite repeated mouse clicks and Enter. Error-state accessibility checks continue to pass at all three widths. The after captures were refreshed and three retry-loading captures added; the original before captures remain unchanged.

Visual review confirmed the tighter grouping, secondary idle/loading Retry and primary checkout hierarchy on desktop and narrow mobile. Current-head CI remains authoritative through the linked PR/branch checks above.

The implementation is ready for code review once the current-head required CI check passes. Deployment/merge and final ZVY-58 journey verification remain the handoffs described above.
