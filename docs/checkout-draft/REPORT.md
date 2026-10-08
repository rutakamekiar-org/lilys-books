# ZVY-69 — same-visit checkout details

[Issue](https://linear.app/zvychajna/issue/ZVY-69) · [approved scope](../storefront-review/DECISIONS.md#f-check-006-checkout-draft-continuity) · [final journey verification](https://linear.app/zvychajna/issue/ZVY-58)

## Behavior and retention contract

Closing and reopening checkout retains the entered first name, last name, email, phone, selected Nova Post branch and optional order note. Quantity and promo edits update the current order summary without clearing those values. The existing checkout component already remains mounted inside the root-layout navigation; no additional provider or browser-storage persistence is needed.

The product owner approved the implementation plan and the following retention rule in the implementation conversation on 2026-10-08 ("let's go"): keep the draft only in the currently loaded tab, including when the cart is temporarily emptied; reset on reload or tab close. Normal client navigation within that loaded storefront retains the draft. LocalStorage and sessionStorage receive no customer details or branch data. The existing cart/promo storage and invoice-to-payment navigation continue unchanged. Invoice creation is not treated as verified payment success. No Start over or Back control was added.

Reopening resets the existing validation feedback and touched state, while submission still performs the existing validation. Invalid preserved values cannot create an invoice. Digital-only orders exclude the retained phone and branch from the submitted customer object. Returning to physical items restores them and applies the existing physical-delivery requirements.

A synchronous ref guards submission before React updates the disabled button. Both the ref and pending button state survive close/reopen, preventing repeated submit events or Enter presses from creating another request while the original is pending. Temporary failures retain the draft and release the guard for a deliberate retry. Payment idempotency and late-result interaction remain separate ZVY-40 work.

## Files

- `src/components/organisms/CheckoutForm.tsx`: retain the existing six draft fields and guard concurrent submission.
- `tests/e2e/checkout-draft.spec.ts`: six behavioral scenarios at each of the three widths, optional screenshot capture, local delivery-picker and invoice doubles.
- This report and the 12 JPG files under `before/` and `after/`: matching reopened customer and branch/note views.

The BookPreorder backend and API contracts were not changed.

## Controlled environment and evidence

Verified on 2026-10-08 using Node 24.11.1, Next.js 16.3.4 production builds and Playwright Chromium on Windows. The branch is `codex/zvy-69-checkout-draft`, based on updated frontend `main` revision `070e006`. This frontend repository has no `develop` branch.

The application runs at `http://127.0.0.1:3100` with the existing deterministic API at `http://127.0.0.1:4100`. Non-loopback browser traffic is blocked, except for explicitly fulfilled local doubles for the Nova Post iframe and `example.invalid` payment handoff. No production API, carrier service or payment was contacted. The sample customer, phone and branch are test values. Mobile sizes emulate touch; they are not real-phone evidence.

The matching cart contains the Test Book paper edition at 350 UAH, changed from quantity 1 to 2, with `NEAR-TOTAL` (498.95 UAH fixed discount), giving a 700 UAH subtotal and 201.05 UAH total. Tests assert quantity 2 and total 201.05 UAH, then verify exactly one local invoice with the current item ID/quantity, promo and retained customer/branch/note. The note is retained verbatim while editing and trimmed in the submitted payload.

The corrected baseline run failed at all three widths on the expected assertion: the first name became empty after reopening. Screenshots were saved before that assertion. An initial test-harness attempt had an incorrectly encoded fake iframe; that setup failure was corrected before recording the baseline. In the original UI, the branch button continued displaying its child component's stale local selection even though the parent checkout's department value was cleared. A visible old branch label therefore did not prove that the submitted branch survived; the new invoice-payload assertion checks the actual retained department.

All 12 before/after screenshots were visually inspected. Customer and branch/note captures use the same viewport and scroll targets. The existing promo success toast can appear in the first capture; it is unchanged and does not affect the assertions.

| Viewport | Customer before / after | Branch and note before / after |
| --- | --- | --- |
| 1440×900 | [Before](before/SCR-05-reopened-customer-1440x900.jpg) · [After](after/SCR-05-reopened-customer-1440x900.jpg) | [Before](before/SCR-05-reopened-branch-note-1440x900.jpg) · [After](after/SCR-05-reopened-branch-note-1440x900.jpg) |
| 390×844 | [Before](before/SCR-05-reopened-customer-390x844.jpg) · [After](after/SCR-05-reopened-customer-390x844.jpg) | [Before](before/SCR-05-reopened-branch-note-390x844.jpg) · [After](after/SCR-05-reopened-branch-note-390x844.jpg) |
| 360×844 | [Before](before/SCR-05-reopened-customer-360x844.jpg) · [After](after/SCR-05-reopened-customer-360x844.jpg) | [Before](before/SCR-05-reopened-branch-note-360x844.jpg) · [After](after/SCR-05-reopened-branch-note-360x844.jpg) |

## Verification

Local lint, typecheck and fixture validation passed. The production application was successfully built by the standard Playwright server setup. The expanded regression run passed **82 checks**, including all **18 new checkout-draft scenarios**; three existing promo screenshot cases were skipped because they require an explicit evidence run. Checkout/order-note/money, promo allocation, purchase validation, accessibility, keyboard, mobile purchase and sheet-dismissal regressions passed. The final diff was self-reviewed and passed `git diff --check`.

[Pull request #45](https://github.com/rutakamekiar-org/lilys-books/pull/45) records the required remote CI result for the latest head. This report does not treat local success as a substitute for that gate.

Run:

```powershell
npm run lint
npm run typecheck
npm run test:fixtures
npm run build:ci
npm run test:e2e -- checkout-draft checkout-order-note checkout-money promo-allocation purchase-flow accessibility keyboard-navigation mobile-purchase sheet-dismiss --project=desktop-chromium
```

Evidence capture uses the same regression scenario, with no alternate acceptance expectations:

```powershell
$env:ZVY69_EVIDENCE_PHASE='after'
npm run test:e2e -- checkout-draft --project=desktop-chromium --grep 'restores details'
Remove-Item Env:ZVY69_EVIDENCE_PHASE
```

Use `before` on the original application revision to reproduce the expected regression failure and matching baseline captures. The normal CI suite does not write evidence files.

The six scenarios per width cover quantity/promo editing and exact invoice payload, invalid preserved fields with zero invoice requests, temporary empty/digital/mixed cart transitions, concurrent submission and retry after failure, memory-only storage and reload reset, and navigation/Escape/focus preservation. Existing checkout, pricing, keyboard and accessibility checks provide broader regression coverage.

## Acceptance and handoff

| Requirement | Outcome |
| --- | --- |
| Restore same-visit values after returning to edit quantity or promo | Implemented; restored fields, quantity, total and invoice payload are asserted at all three widths. |
| Preserve optional note and selected branch; validate before submission; prevent duplicates | Implemented; raw note/branch retention, invalid input rejection, shipping exclusion for digital orders, and synchronous/pending submission guards are tested. |
| Required frontend checks and green CI | Local results and remote CI evidence are recorded in the pull request before handoff. |
| Reviewed implementation available for final journey verification | Ready for code review in the pull request; review, merge and availability in the recorded verification environment remain required before ZVY-58. |

Netlify is explicitly skipped at the owner's request. Commit subjects and the pull-request title carry `[skip netlify]`, preserving GitHub's required `verify` CI check. Real-phone/software-keyboard checks, real carrier/provider/payment outcomes and screen-reader speech have not been verified. These remain separate evidence or owner dispositions in ZVY-58; browser emulation and API doubles do not satisfy them. The existing brand contrast exception remains unchanged.
