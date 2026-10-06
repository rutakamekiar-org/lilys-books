# ZVY-59 — narrow cart promo row

Verified locally on 2026-10-06. [Issue](https://linear.app/zvychajna/issue/ZVY-59) · [approved scope](../storefront-review/DECISIONS.md#f-check-003-narrow-promo-row) · [original finding F-CHECK-003](../storefront-review/REPORT.md#f-check-003-the-promo-application-button-is-clipped-at-360-px).

## Problem and implementation

The historical 360 px cart had a flex input with an intrinsic minimum width. The input, 8 px gap and Apply button could not fit the available row width, clipping the action. Enter still applied the promo.

The required mobile fix is already in merged ZVY-60 commit `132025fc5748ed15aa4422c393e5ebfd034d43d3`: `.promoInput` has `min-width: 0`, and `.promoApplyBtn` does not shrink. Both retain a 44 px mobile height. This branch adds focused regression coverage and evidence rather than duplicating that application change. Desktop and 390 px application styling, Enter handling, focus styling, promo calculations and API contracts are unchanged.

The current 360 px row spans x=13…348 (335 px). The input is approximately 209.45 px wide and the complete Apply button is 117.55 px wide. Row scroll width equals client width. The 390 px and desktop rows also fit.

[Regression control measurements](regression-control.json) record a browser-only negative control. Overriding just the input's `min-width` to `auto` expands its width to 219 px at 360 px, making the row scroll width 345 px instead of 335 px. The new row-overflow assertion would catch this regression. Desktop and 390 px still fit in this control. This deliberately modified local DOM is not a production check or historical capture; application files were not changed.

## Environment and reproducibility

- Frontend branch: `codex/zvy-59-cart-promo-layout`, based on updated `origin/main` revision `9900f38c1c99bec6185805aec3da28d6a0fbd047`. This frontend repository has no `develop` branch; the backend repository's develop workflow was not used for this frontend-only work.
- Production Next.js 16.3.4 application at `http://127.0.0.1:3100`, Node 24.11.1 on Windows. Chromium 153.0.8010.12 (observed version also recorded in the control JSON).
- Deterministic local API at `http://127.0.0.1:4100`. The spec aborts requests to non-loopback hosts. Promo responses are controlled browser-route doubles: held loading request, 404 rejection, 503 outage and valid 10% promo. No production API, invoice submission or payment is used.
- Cart fixture: `Звичайна. Перша частина дилогії`, paper edition, quantity 2, effective unit price 399 UAH, subtotal 798 UAH. AUDIT10 preserves the existing whole-hryvnia percentage rounding: unit price 359 UAH, discount 80 UAH, total 718 UAH. Removing the promo restores 798 UAH. The spec asserts item IDs sent to validation, unchanged stored selection and zero invoice requests.
- CSS viewports: 1440×900, 390×844 and 360×844. Mobile tests enable emulated touch support; keyboard checks still use actual browser keyboard events. These are browser emulations, not real phones.

Run `npx playwright test cart-promo-layout --project=desktop-chromium` using the standard checked-in configuration. To regenerate the 15 current screenshots, set `ZVY59_EVIDENCE=1` for that command. Ordinary CI runs do not rewrite documentation screenshots.

The standard Windows runner completed all test cases but stalled during cleanup of its nested app process. For the successful local run, the same production app and API were started separately, and a temporary configuration imported the checked-in config with only `webServer` omitted. The runner then exited successfully. The temporary files are excluded from the review package. CI continues to use the standard configuration on Linux.

## Before/after evidence

The **before** links are original frozen ZVY-55 audit captures from 2026-10-04, retained unchanged. The **after** links are fresh local captures from this verification. Sizes and cart price/quantity/code are matched; surrounding content is synthetic in the new fixture and the merged ZVY-60 sheet/item changes are already present. This is a state comparison, not a pixel-identical baseline comparison or a new production-site observation. There is no extra application layout change between the current branch's base and this verification.

| State | Desktop 1440×900 | Mobile 390×844 | Narrow 360×844 |
| --- | --- | --- | --- |
| Entry | [Before](../storefront-checkout/screenshots/SCR-04-promo-entry-1440x900.jpg) / [After](after/SCR-04-promo-entry-1440x900.jpg) | [Before](../storefront-checkout/screenshots/SCR-04-promo-entry-390x844.jpg) / [After](after/SCR-04-promo-entry-390x844.jpg) | [Before](../storefront-checkout/screenshots/SCR-04-promo-entry-360x844.jpg) / [After](after/SCR-04-promo-entry-360x844.jpg) |
| Loading | [Before](../storefront-checkout/screenshots/SCR-04-promo-loading-1440x900.jpg) / [After](after/SCR-04-promo-loading-1440x900.jpg) | [Before](../storefront-checkout/screenshots/SCR-04-promo-loading-390x844.jpg) / [After](after/SCR-04-promo-loading-390x844.jpg) | [Before](../storefront-checkout/screenshots/SCR-04-promo-loading-360x844.jpg) / [After](after/SCR-04-promo-loading-360x844.jpg) |
| Invalid code | [Before](../storefront-checkout/screenshots/SCR-04-promo-invalid-1440x900.jpg) / [After](after/SCR-04-promo-invalid-1440x900.jpg) | [Before](../storefront-checkout/screenshots/SCR-04-promo-invalid-390x844.jpg) / [After](after/SCR-04-promo-invalid-390x844.jpg) | [Before](../storefront-checkout/screenshots/SCR-04-promo-invalid-360x844.jpg) / [After](after/SCR-04-promo-invalid-360x844.jpg) |
| Service error | [Before](../storefront-checkout/screenshots/SCR-04-promo-outage-1440x900.jpg) / [After](after/SCR-04-promo-outage-1440x900.jpg) | [Before](../storefront-checkout/screenshots/SCR-04-promo-outage-390x844.jpg) / [After](after/SCR-04-promo-outage-390x844.jpg) | [Before](../storefront-checkout/screenshots/SCR-04-promo-outage-360x844.jpg) / [After](after/SCR-04-promo-outage-360x844.jpg) |
| Applied | [Before](../storefront-checkout/screenshots/SCR-04-promo-applied-1440x900.jpg) / [After](after/SCR-04-promo-applied-1440x900.jpg) | [Before](../storefront-checkout/screenshots/SCR-04-promo-applied-390x844.jpg) / [After](after/SCR-04-promo-applied-390x844.jpg) | [Before](../storefront-checkout/screenshots/SCR-04-promo-applied-360x844.jpg) / [After](after/SCR-04-promo-applied-360x844.jpg) |

## Acceptance results and handoff

| Requirement | Result |
| --- | --- |
| Complete input and Apply action fit at 360 px, including loading and validation messages | Pass in local production Chromium: full rectangles inside row/cart, no horizontal overflow; rejection/outage toast also remains inside the page. All five states captured. |
| Preserve desktop/390 px layout, Enter and visible focus | Pass: controls share a row at all three widths; long/blank input, Tab/Shift+Tab focus and successful Enter application checked. Mobile enabled controls retain 44 px height. |
| Selection and amounts remain correct | Pass: two paper units retained through loading, 404, 503, success and promo removal; 798 → 718 → 798 UAH, zero invoice requests. |
| Check actual touch use separately | Outstanding: emulated touch is enabled, but actual phone taps, software keyboard obstruction and browser/device evidence are required separately. |
| Required green CI | Outstanding: local checks passed; no remote CI result has been retrieved for this branch. |
| Reviewed and available for ZVY-58 final journey verification | Outstanding: code/evidence review and the recorded shared verification environment remain handoff requirements. Local verification alone does not close ZVY-59 or ZVY-58. |

Local verification:

- `npm run lint`: pass.
- `npm run typecheck`: pass.
- `npm run test:fixtures`: pass, four deterministic fixture contracts (run outside the Windows sandbox because its TypeScript runner's OS user-information call is blocked there).
- `npm run build:ci`: pass, production build with deterministic API.
- Six new promo regression tests: pass, successful runner exit.
- 29 relevant browser tests: pass, successful runner exit (promo layout, mobile purchase, money precision, keyboard navigation and accessibility). Existing documented axe contrast exclusion remains unchanged.
- Browser-only shrink-rule regression control: pass; expected narrow overflow reproduced.

Review package: `tests/e2e/cart-promo-layout.spec.ts`, this report, `regression-control.json`, and 15 JPEG screenshots under `after/`. Application/backend files are unchanged.

Remaining risks are explicitly scoped: real-phone/screen-reader verification is not claimed; the pre-existing invalid-code message for service outages remains ZVY-71, and contrast redesign remains deferred by ZVY-57. The disabled loading button becomes narrower when its text is replaced by a spinner, as in the existing UI; it remains fully visible. No pricing, promo policy, shared focus redesign or other review finding is implemented here.

Conclusion: the inherited mobile fix satisfies ZVY-59's layout criteria in the local production app, and focused regression coverage protects it. ZVY-59 remains open until required remote CI and review/handoff evidence are obtained; actual-phone evidence or an explicit owner disposition is still needed for that separate check.
