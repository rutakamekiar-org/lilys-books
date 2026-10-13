# ZVY-70 — checkout delivery cost disclosure

## Approved scope

The owner approved the implementation plan and supplied revised UI requirements in this chat on 2026-10-13. Those requirements replace the earlier proposed wording and additional unknown-cost paragraph.

- Rename the checkout total to **До сплати за товари:**.
- Directly beneath the physical/mixed total, show exactly: **Доставка оплачується окремо за тарифами Нової пошти. Її вартість визначається перевізником.**
- Use secondary text with a decorative info icon and compact spacing.
- Remove **Доставка здійснюється Новою Поштою.** beneath the selector.
- Digital-only checkout retains its email delivery note and has no shipping fields/disclosure.
- Keep the existing modal, total prominence, confirmation action, calculations, validation and payment behavior.
- Skip Netlify. Preserve `[skip netlify]` in commits and the pull request title.

This incorporates the separately customer-paid delivery policy from [ZVY-57](https://linear.app/zvychajna/issue/ZVY-57) and the owner's carrier-tariff wording. No fee, collection time or calculator is introduced. [ZVY-48](https://linear.app/zvychajna/issue/ZVY-48) remains responsible for Merchant diagnostics and commerce policy configuration.

## Implementation

| Layer | Files | Behavior |
| --- | --- | --- |
| UI | `src/components/organisms/CheckoutForm.tsx` | New total label; conditional disclosure; remove redundant physical delivery note; retain digital note. |
| Styles | `src/components/organisms/CheckoutForm.module.css` | Secondary wrapping disclosure, 8px spacing and icon alignment; amount stays on one line while the label can wrap. |
| Existing icon component | `src/components/atoms/Icon.tsx` | Add the installed Font Awesome Free circle-info artwork, retaining attribution and decorative accessibility behavior. |
| Regression | `tests/e2e/delivery-cost.spec.ts` | Physical, mixed, mixed promo, zero-total physical and digital cases at all three requested widths. |
| Existing regression | `tests/e2e/checkout-draft.spec.ts`, `tests/e2e/delivery-picker.spec.ts`, `tests/e2e/promo-allocation.spec.ts` | Update the total-label assertions without weakening amount checks. |

## Verification environment and evidence

Before revision: frontend `main` at `240addd2aae9061b1507b87c967b7000bdb453c9`. Implementation branch: `codex/zvy-70-delivery-cost`.

Local production Next.js application at `http://127.0.0.1:3100`, deterministic API double at `http://127.0.0.1:4100`. Browser requests to external hosts are blocked in the new scenarios. No production/provider requests or real payments are used.

The test runner builds the production application before serving it. Chromium viewports: 1440×900, 390×844 and 360×844. Mobile widths emulate touch; they do not establish real-phone behavior.

Matched screenshots are in `before/` and `after/`, using `SCR-05-{paper,mixed,mixed-promo,paper-zero,digital}-{width}x{height}.jpg`. Capture with `ZVY70_EVIDENCE_PHASE=before` on the baseline or `after` on this branch. Default execution asserts the implemented behavior. The before mode records historical behavior and must not be used to accept the implementation.

Tests assert exact totals and selected item IDs/quantities, one physical disclosure or none for digital, no repeated old note, secondary visual hierarchy, compact placement below the total, full viewport visibility without overflow, accessible confirmation action, validation without invoice requests, and Escape/focus restoration. Existing tests cover preserved drafts, delivery selection, mock invoice payloads, money precision, promo allocation, keyboard navigation and axe scans.

## Results and handoff

- Lint: passed.
- Typecheck: passed.
- Before evidence: all 15 scenarios passed their assertions and produced screenshots. The Windows runner was interrupted during server cleanup after all scenarios completed; a clean process exit is not claimed for that capture run.
- Production build, focused regression suite and after evidence: in progress.
- Self-review: complete. Only presentation, decorative icon artwork and test label references change; delivery detection, state, price arithmetic, validation, submission and footer layout are preserved. Physical, mixed/promo, zero-total and digital screenshots were inspected across the requested widths.
- Required GitHub `verify` CI: pending.

The Windows temporary Playwright cache initially denied access to a previously existing file. The retry uses `PWTEST_CACHE_DIR=node_modules/.cache/zvy70-playwright` inside the workspace; no test assertions or application behavior are changed for this workaround.

An initial visibility assertion demanded an exact IntersectionObserver ratio of 1 and failed on fractional line-height rounding (ratios 0.9936–0.9944). The assertion permits subpixel rounding with a 0.99 ratio and retains the no-overflow checks. The confirmation button also receives a trial click, so screenshot capture waits until any existing transient promo toast no longer obstructs the action.

Netlify deployment is skipped as requested. Independent code review and owner acceptance remain handoff requirements for [ZVY-58](https://linear.app/zvychajna/issue/ZVY-58). Real phones, provider integration, actual payment and assistive-technology manual checks are outside this deterministic evidence; the existing axe color-contrast exception remains in force.
