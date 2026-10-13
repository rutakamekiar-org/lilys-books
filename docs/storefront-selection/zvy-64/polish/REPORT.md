# Suggestion dialog: minor UX polish

Verified on 2026-10-13 (Europe/Kyiv), following the owner's requested refinements to [ZVY-64](https://linear.app/zvychajna/issue/ZVY-64) in draft PR #47. Before source revision: `c627da0`. The [initial implementation report](../REPORT.md) records the original behavior, fixtures and handoff.

## Changes

The description is now **Доповніть книгу ілюстраціями:**. The confirmation is **Книгу додано до кошика**, preceded by a small muted check-circle using the existing decorative check icon. The confirmation remains a compact secondary row between the suggested product card and the outlined **Перейти до кошика** action. **Додати до кошика** retains its orange primary styling.

At mobile widths, body/card padding and gaps are slightly reduced. The illustration stays 120×180 pixels with the same 2:3 aspect ratio. The panel is limited to the dynamic viewport height minus 24 pixels. Its header does not scroll; the body scrolls internally when necessary, with contained overscroll. Close stays available while keyboard focus scrolls either CTA into view. No action handlers, cart state, effective prices, eligibility rules, navigation, trigger rules or shared focus/Escape logic changed.

## Verification

- **99 relevant Playwright checks passed**: 51 suggestion-continuation checks plus 48 existing selection, accessibility, keyboard, mobile-purchase and purchase-flow regressions. The production application built successfully in the test setup against the deterministic local API double. Lint and typecheck passed.
- Normal-text checks cover 1440×900, 390×844, 360×844 and 360×640. Both routes retain correct quantities/amounts and move focus into cart after either action. Close/Escape/reopening, rapid clicks, eligibility loss, digital bypass and default mobile direct-cart behavior remain covered.
- Six additional checks simulate 200% text at the three mobile viewports. They assert the panel remains inside the viewport, no dialog content overflows horizontally, the image remains 120×180, forward Tab reaches Add, Shift+Tab reaches the secondary CTA, Close stays visible, the header position remains stable while scrolling, and both keyboard actions retain the correct selected items. Axe checks use the existing documented contrast exception.
- Text enlargement is simulated by setting the root/body text size and dialog action text in the test page. This exercises reflow; it is not a claim of testing every browser's font preference or a real phone.
- Before-source control: eight ordinary screenshot scenarios passed; all three enlarged-text accept scenarios failed because the old panel extended outside the viewport. The same layout assertions pass after the polish.
- Visual comparisons show the smaller vertical footprint, unchanged illustration dimensions, secondary confirmation row and primary/secondary CTA hierarchy. At 360×640 with normal text, Close and both actions fit. Enlarged content requires internal scrolling rather than shrinking the illustration or clipping the panel.

## Before/after comparisons

Fonts/images are loaded and animations are disabled for captures. The existing controlled catalog fixtures and repository images are used; names/prices are test data. Mobile suggestion captures open at desktop and resize, preserving the existing mobile Buy bypass. All 22 JPEG files created for this follow-up are linked below.

| Route/state | 1440×900 | 390×844 | 360×844 | 360×640 |
| --- | --- | --- | --- | --- |
| Inaksha suggestion | [Before](before/SCR-03-inaksha-suggestion-1440x900.jpg) / [After](after/SCR-03-inaksha-suggestion-1440x900.jpg) | [Before](before/SCR-03-inaksha-suggestion-390x844.jpg) / [After](after/SCR-03-inaksha-suggestion-390x844.jpg) | [Before](before/SCR-03-inaksha-suggestion-360x844.jpg) / [After](after/SCR-03-inaksha-suggestion-360x844.jpg) | [Before](before/SCR-03-inaksha-suggestion-360x640.jpg) / [After](after/SCR-03-inaksha-suggestion-360x640.jpg) |
| Bundle suggestion | [Before](before/SCR-03-zvychajna-and-inaksha-suggestion-1440x900.jpg) / [After](after/SCR-03-zvychajna-and-inaksha-suggestion-1440x900.jpg) | [Before](before/SCR-03-zvychajna-and-inaksha-suggestion-390x844.jpg) / [After](after/SCR-03-zvychajna-and-inaksha-suggestion-390x844.jpg) | [Before](before/SCR-03-zvychajna-and-inaksha-suggestion-360x844.jpg) / [After](after/SCR-03-zvychajna-and-inaksha-suggestion-360x844.jpg) | [Before](before/SCR-03-zvychajna-and-inaksha-suggestion-360x640.jpg) / [After](after/SCR-03-zvychajna-and-inaksha-suggestion-360x640.jpg) |
| Inaksha with simulated 200% text, initial scroll position | — | [Before](before/SCR-03-inaksha-suggestion-large-text-390x844.jpg) / [After](after/SCR-03-inaksha-suggestion-large-text-390x844.jpg) | [Before](before/SCR-03-inaksha-suggestion-large-text-360x844.jpg) / [After](after/SCR-03-inaksha-suggestion-large-text-360x844.jpg) | [Before](before/SCR-03-inaksha-suggestion-large-text-360x640.jpg) / [After](after/SCR-03-inaksha-suggestion-large-text-360x640.jpg) |

## File inventory and reproduction

- [SuggestionDialog.tsx](../../../../src/components/molecules/SuggestionDialog.tsx): presentation copy and decorative icon markup only.
- [SuggestionDialog.module.css](../../../../src/components/molecules/SuggestionDialog.module.css): compact confirmation, mobile spacing, bounded panel and internal scrolling.
- [suggestion-continuation.spec.ts](../../../../tests/e2e/suggestion-continuation.spec.ts): updated copy, shorter viewport, enlarged-text accessibility/behavior checks and separate polish evidence destination.
- [Initial report](../REPORT.md): pointer to this follow-up. This report and the 22 linked JPEGs are new; earlier evidence is preserved.

Run `npm run test:e2e -- suggestion-continuation product-selection accessibility keyboard-navigation mobile-purchase purchase-flow`. Set `ZVY64_POLISH_PHASE=after` and use `--grep 'capture settled|200% text.*accept'` to regenerate the 11 after dialog captures. The before run used the same capture scenarios on the recorded source revision with `ZVY64_POLISH_PHASE=before`; the three enlarged-text layout failures are expected controls.

Self-review found no changes to purchase handlers or shared accessibility/navigation behavior. The final PR head's required GitHub `verify` result is the remote validation gate. Netlify remains skipped; code review, shared-environment availability and final ZVY-58 journey approval remain the handoff recorded in the original report.
