# ZVY-68 — visible delivery-picker exit

[Issue](https://linear.app/zvychajna/issue/ZVY-68) · [approved finding](../storefront-review/DECISIONS.md#f-check-002-visible-delivery-picker-exit) · [final journey verification](https://linear.app/zvychajna/issue/ZVY-58)

## Behavior and scope

The mobile picker previously hid its entire host header below 768px, including Close. A pending or failed provider could therefore leave a blank screen with no visible host exit. The owner requested reuse of the cart/excerpt sheet in the implementation conversation on 2026-10-08.

At widths up to 640px the picker now uses their existing `useSheetDismiss` hook and matching sheet layout: a 56px backdrop area, rounded top corners, white header, drag handle, 44px minimum Close target, downward header swipe, backdrop dismissal, and reduced-motion behavior. The owner requested the white header, matching the cart, in a subsequent review on 2026-10-08. The iframe occupies the remaining height below the header. Header gestures do not attach to provider content. Between 641px and 767px the existing full-screen presentation retains a compact visible header. Desktop keeps its centered 80% dialog and visible exit.

The picker inherits checkout's existing visual-viewport height variable. This supports the host layout when checkout updates its available height; it is not evidence that a real software keyboard or the live provider works correctly.

Close, Escape from host controls, backdrop dismissal and header swipes return to the existing checkout draft and restore focus to its branch-selection button. Selecting a branch continues through the existing message handler. Customer fields, phone, optional note, cart items and total remain unchanged. Backend/payment contracts and the shared dialog/gesture hooks were not changed.

## Acceptance results

| Criterion | Result and evidence |
| --- | --- |
| Visible operable host exit during loading, loaded results, no results and controlled provider failure | Implemented. All four states tested at 1440×900, 390×844 and 360×844, with both no previous selection and a previous branch. Additional host layout checks cover widths 320, 640, 641, 767, 768 and 1024. |
| Closing preserves checkout and previous branch; selection updates only delivery | Implemented. Tests assert all customer values and the verbatim note, cart item ID/quantity and 350 UAH total. A replacement branch survives another close without selection and is checked in the actual local invoice payload, alongside unchanged customer/items/note. |
| Host keyboard activation, Escape and restored opener focus; header does not overlap iframe or overflow | Implemented. Enter, Space and Escape are exercised from the host Close button at all three evidence sizes. Tests assert header/frame boundaries, viewport containment, no horizontal overflow, and that checkout stays open. |
| Reuse cart/excerpt sheet | Implemented per owner's request. Touch emulation tests cover short/slow/cancelled drags, downward swipe dismissal, reopen, backdrop and reduced motion. A separate touch test scrolls the controlled iframe and confirms the host stays open. Cart/excerpt regressions pass. |
| Real-phone scrolling, software keyboard, back navigation and keyboard inside the live cross-origin iframe | Follow-up required. No real phone or live provider was tested. Controlled iframe scrolling and host keyboard events are not live-provider verification. |
| Review, recorded verification environment and required green CI | Local environment recorded below; self-review complete. Associated PR carries the remote `verify` result and remains subject to reviewer approval. Netlify was explicitly skipped, so no provider preview/deployment is claimed. |

## Environment and evidence

Recorded on 2026-10-08, Windows, Node 24.11.1, npm 11.6.2, repository Playwright Chromium. Before application revision: `ee73badfd4177f6a03b1b328122059d3c7262eb0`. After application revision: the implementation commit containing this report on `codex/zvy-68-delivery-picker-sheet`; inspect the associated PR head for its exact SHA.

The production application runs at `http://127.0.0.1:3100` with the deterministic API at `http://127.0.0.1:4100`. The screenshot journey uses `/books/test-book` and the fixture's physical item (`11000000-0000-4000-8000-000000000001`, quantity 1, price/total 350 UAH). The provider URL is intercepted locally. Loading holds navigation pending, loaded/empty return controlled HTML, and failure aborts the provider request. All non-local requests are blocked except explicitly fulfilled test doubles. Invoice submission goes only to the local API and its mocked `example.invalid` handoff; no real payment is submitted.

The initial baseline captured all 12 before screenshots. Desktop passed; both mobile sizes failed on the intended assertion: all four Close controls were hidden. After evidence uses the same journey and dimensions. The fixture's heading and main-landmark names were subsequently corrected for its accessibility scan without changing the visible provider treatment. This fake provider content is deliberately distinguishable from real carrier UI.

All 24 screenshots were visually inspected. Desktop layout remains visually consistent; mobile now reserves header space without covering provider content. Loading/failure can remain blank inside the provider area, while the host exit remains visible.

| Viewport | Loading | Loaded | No results | Failure |
| --- | --- | --- | --- | --- |
| 1440×900 | [Before](before/SCR-05-delivery-picker-loading-1440x900.jpg) / [After](after/SCR-05-delivery-picker-loading-1440x900.jpg) | [Before](before/SCR-05-delivery-picker-loaded-1440x900.jpg) / [After](after/SCR-05-delivery-picker-loaded-1440x900.jpg) | [Before](before/SCR-05-delivery-picker-empty-1440x900.jpg) / [After](after/SCR-05-delivery-picker-empty-1440x900.jpg) | [Before](before/SCR-05-delivery-picker-failure-1440x900.jpg) / [After](after/SCR-05-delivery-picker-failure-1440x900.jpg) |
| 390×844 | [Before](before/SCR-05-delivery-picker-loading-390x844.jpg) / [After](after/SCR-05-delivery-picker-loading-390x844.jpg) | [Before](before/SCR-05-delivery-picker-loaded-390x844.jpg) / [After](after/SCR-05-delivery-picker-loaded-390x844.jpg) | [Before](before/SCR-05-delivery-picker-empty-390x844.jpg) / [After](after/SCR-05-delivery-picker-empty-390x844.jpg) | [Before](before/SCR-05-delivery-picker-failure-390x844.jpg) / [After](after/SCR-05-delivery-picker-failure-390x844.jpg) |
| 360×844 | [Before](before/SCR-05-delivery-picker-loading-360x844.jpg) / [After](after/SCR-05-delivery-picker-loading-360x844.jpg) | [Before](before/SCR-05-delivery-picker-loaded-360x844.jpg) / [After](after/SCR-05-delivery-picker-loaded-360x844.jpg) | [Before](before/SCR-05-delivery-picker-empty-360x844.jpg) / [After](after/SCR-05-delivery-picker-empty-360x844.jpg) | [Before](before/SCR-05-delivery-picker-failure-360x844.jpg) / [After](after/SCR-05-delivery-picker-failure-360x844.jpg) |

## Verification

Lint, typecheck and deterministic fixture validation passed. The standard Playwright server setup successfully built and ran the production application. The implementation regression run passed **92 checks**, including **47 picker checks** with evidence capture enabled, checkout draft/order-note/money, purchase validation, accessibility, keyboard and cart/excerpt sheet behavior. Following the owner's white-header adjustment, lint, typecheck, the production build and all **47 picker checks** passed again; all eight mobile after screenshots were refreshed and visually inspected. Three picker screenshot tests are explicitly skipped in ordinary CI unless evidence capture is requested; the other 44 picker scenarios remain active.

The initial accessibility scan identified heading-order and duplicate-main-landmark problems in the controlled provider fixture; correcting its semantics resolved them with no additional axe exceptions. An initial concurrent lint attempt hit Playwright's test-output-directory cleanup; the sequential rerun passed. The application diff was self-reviewed and `git diff --check` passed.

```powershell
npm run lint
npm run typecheck
npm run test:fixtures
$env:ZVY68_EVIDENCE_PHASE='after'
npm run test:e2e -- delivery-picker checkout-draft checkout-order-note checkout-money purchase-flow accessibility keyboard-navigation sheet-dismiss --project=desktop-chromium
Remove-Item Env:ZVY68_EVIDENCE_PHASE
```

Use `before` on the original application revision to reproduce the expected hidden-exit failure and matching baseline screenshots. Ordinary CI does not write evidence files. The required remote `verify` gate is checked on the PR separately from these local results.

## Files and handoff

- Modified `src/components/organisms/NovaPoshtaWidget.tsx` to reuse the existing sheet gesture hook.
- Modified `src/components/organisms/NovaPoshtaWidget.module.css` for the visible header, iframe sizing and matching mobile sheet layout.
- Added `tests/e2e/delivery-picker.spec.ts` for deterministic host/provider-double regression scenarios.
- Added this report and all 24 screenshot files linked above under `before/` and `after/`.

The host implementation is ready for code review. Keep live provider/real-phone scrolling, software-keyboard obstruction, device/browser back navigation, iframe keyboard behavior and screen-reader speech as explicit unverified evidence gaps for ZVY-68/ZVY-58. Record the actual device/browser and review environment when those checks are performed. Emulation does not satisfy them. No final owner approval or deployment is claimed; skipping Netlify does not waive the remaining acceptance/handoff gates.
