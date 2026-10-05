# Storefront improvement decisions

This is the product-owner decision log for [ZVY-57](https://linear.app/zvychajna/issue/ZVY-57). It covers the 22 canonical findings from the [consolidated review](REPORT.md) and preserves its 26 source IDs through the [reconciliation](reconciliation.json). Review desktop and mobile together before creating implementation issues.

**Status on 2026-10-05, Europe/Kyiv: ZVY-57 Done; final v1 approved by the product owner; implementation handoff complete; eighteen improvement scopes approved, three rejected and one deferred.** Approved-scope priorities are nine Low (Linear 4), six Medium (Linear 3) and three High (Linear 2); the deferred contrast decision is also Low (Linear 4), recorded beside each finding below. F-DISC-003 catalog title-layout changes, F-DISC-005 short genre/type/series labels and F-DISC-008 shared focus-outline redesign are rejected. F-DISC-004 is approved for mobile with an explicit review of the implemented result before final acceptance. F-DISC-006 mobile price/action reordering is approved at High priority; the owner's additional cover/title redesign suggestion is deferred to a later design review. The earlier “yes” approved preparing this log and conducting the review only. The owner approved final v1 and its scope boundaries on 2026-10-05. Fifteen new issues and reused ZVY-40 cover all approved findings and block ZVY-58; application implementation remains Backlog.

Sources: [approved baseline](https://linear.app/zvychajna/document/storefront-screen-baseline-zvy-52-desktop-and-mobile-015d372f40b2), [local screen reference](../storefront-baseline/REFERENCE.md), [discovery audit](../storefront-discovery/REPORT.md), [selection audit](../storefront-selection/REPORT.md), and [checkout audit](../storefront-checkout/REPORT.md). Evidence is historical controlled data, not current production stock or proof of customer abandonment.

## Decision and approval records

Every finding below has a proposed priority, rationale, behavior and acceptance criteria. **Pending** means no owner disposition yet. It must become **Approved**, **Deferred** or **Rejected**, with the owner's rationale and any changes to the proposal recorded. Priorities remain proposed until decided. The existing brand contrast exception stays in force while the owner defers a treatment decision at Low priority.

| Event | Owner response and scope | Result |
| --- | --- | --- |
| Review workflow, 2026-10-04 | Vladyslav Kovalov: “yes” in response to the implementation plan | Log preparation and screen review authorized; individual improvements pending |
| Actionable checkout errors, 2026-10-04 | Vladyslav Kovalov: “I approve, but rank it as lower as possible” after the current flow and rejection reasons were explained | F-CHECK-005 approved; Low priority (Linear 4), lowest implementation tier |
| Visible mobile delivery-picker exit, 2026-10-04 | Vladyslav Kovalov: “I approve, but rank it as lower as possible” in response to the mobile Close/Back proposal | F-CHECK-002 approved; Low priority (Linear 4), lowest implementation tier |
| Clearing corrected-field errors, 2026-10-04 | Vladyslav Kovalov: “yes” to clearing the error when leaving a corrected field, then “low” after the behavior and urgency question were clarified | F-CHECK-004 correction-on-blur scope approved; Low priority (Linear 4) |
| Same-visit checkout details, 2026-10-04 | Vladyslav Kovalov: “yes, low” to preserving name, email, phone, branch and note when returning to edit the cart and reopening checkout during the same visit | F-CHECK-006 same-visit draft continuity approved; Low priority (Linear 4) |
| Delivery payer and payment scope, 2026-10-04 | Vladyslav Kovalov: “yes” to whether the customer pays Nova Post for delivery separately from the book payment | Policy confirmed: customer pays Nova Post separately; delivery is excluded from the book payment. Disclosure change and priority pending |
| Delivery-cost disclosure, 2026-10-04 | Vladyslav Kovalov: “yes” to adding a note beside the total saying delivery is paid separately to Nova Post and is excluded from that amount, then “yes” to Low priority | F-CHECK-007 disclosure approved; Low priority (Linear 4) |
| Unpaid-order recovery, 2026-10-04 | Vladyslav Kovalov: “yes, low” to preserving an unpaid order so returning customers can review it and retry payment without rebuilding the cart | F-CHECK-001 unpaid-order recovery approved; Low priority (Linear 4) |
| Limited-use promo display, 2026-10-04 | Vladyslav Kovalov: “yes,middle” to fixing displayed item discounts so they add up to the correct checkout total | F-CHECK-010 display allocation approved; Medium priority (Linear 3) |
| Promo-service failure recovery, 2026-10-04 | Vladyslav Kovalov: “yes” to explaining that the code could not be checked during a temporary service failure and allowing retry without retyping, then “low” for priority | F-CHECK-008 failure feedback/retry approved; Low priority (Linear 4) |
| Narrow-phone promo layout, 2026-10-04 | Vladyslav Kovalov: “yes, high” to adjusting the layout so the input and entire Apply button fit on screen | F-CHECK-003 responsive promo row approved; High priority (Linear 2) |
| Initial available ebook selection, 2026-10-04 | Vladyslav Kovalov: “yes, medium” to selecting the ebook initially when the paper edition is unavailable and the ebook is available | F-BOOK-001 available-ebook initial selection approved; Medium priority (Linear 3) |
| Eligible add-on suggestions, 2026-10-04 | Vladyslav Kovalov: “yes, med” to hiding suggestions for items that cannot be purchased or preordered | F-BOOK-002 ineligible suggestion suppression approved; Medium priority (Linear 3) |
| Continue without an add-on, 2026-10-04 | Vladyslav Kovalov: “yes, med” to an explicit Continue without the add-on button that opens the cart after Buy | F-BOOK-004 explicit continuation approved; Medium priority (Linear 3) |
| Ebook delivery information, 2026-10-04 | Vladyslav Kovalov: “yes, med” to clearly stating that the ebook is an EPUB file delivered by email | F-BOOK-005 EPUB/email explanation approved; Medium priority (Linear 3) |
| Earlier mobile excerpt link, 2026-10-04 | Vladyslav Kovalov: “yes, high” to moving Read an excerpt near the format selector and Buy buttons on mobile | F-BOOK-006 excerpt placement approved; High priority (Linear 2) |
| Catalog loading failure recovery, 2026-10-04 | Vladyslav Kovalov: “yes, low” to showing Couldn't load the books with Retry and a separate genuine empty-state message | F-DISC-001 failure/empty distinction and retry approved; Low priority (Linear 4) |
| Consistent preorder labels, 2026-10-04 | After the catalog/product/cart screenshot explanation, Vladyslav Kovalov: “yes, med” to visible preorder labels in catalog/cart and consistent product-page wording | F-DISC-002, retaining alias F-BOOK-003, preorder disclosure approved; Medium priority (Linear 3) |
| Catalog title layout, 2026-10-04 | Vladyslav Kovalov first said “not sure”; after full-title wrapping, separate subtitle and visual-comparison deferral were discussed, he responded “rejected” | F-DISC-003 title-layout change rejected; no implementation issue |
| Mobile catalog readability and targets, 2026-10-04 | After reviewing the Current / Larger text and buttons example, Vladyslav Kovalov: “currently yes, mark it as low. I think I will check the result and maybe later reject it. is it for mobile and desktop change?” | F-DISC-004 mobile-only scope approved; Low priority (Linear 4); retain two columns and existing titles; implemented result requires owner review and may be rejected then. Desktop appearance remains unchanged |
| Short catalog context labels, 2026-10-05 | After the Without labels / With short labels example was shown for the mobile and desktop proposal, Vladyslav Kovalov: “i don't like short labels” | F-DISC-005 short genre/type/series labels rejected; no implementation issue for those labels |
| Earlier mobile home price and action, 2026-10-05 | After the mobile-order comparison, Vladyslav Kovalov: “yes and maybe change cover and title possition for mobile screen. high prio” | F-DISC-006 price and Детальніше before the long description approved; High priority (Linear 2). Cover/title repositioning is an additional suggestion, with its exact arrangement pending; desktop retains its layout |
| Mobile home cover/title arrangement, 2026-10-05 | Asked to choose title above the cover or a smaller cover beside the title, price and button, Vladyslav Kovalov: “to be decided later” | Additional F-DISC-006 cover/title rearrangement deferred to a later owner design review. Keep the existing arrangement while implementing the separately approved price/action reorder |
| Shared keyboard focus appearance, 2026-10-05 | Asked whether the outline around the button/field reached by Tab should be clearer and consistent across the site, Vladyslav Kovalov: “rejected” | F-DISC-008 shared focus-outline redesign rejected, retaining alias F-BOOK-008; no implementation issue for this appearance change |
| Brand text-contrast treatment, 2026-10-05 | Asked whether to keep the existing brand styling and record the limitation, Vladyslav Kovalov: “let's mark it as low priority and later decision of what to do with it” | F-DISC-007 deferred; Low priority (Linear 4), retaining aliases F-BOOK-007/F-CHECK-009. Treatment to be chosen in a later owner review; current styling stays in force meanwhile |
| Additional candidates and handoff scope | All canonical findings reviewed one at a time | Unapproved additions remain outside the approved final v1 handoff; meaningful implementation contract choices must be settled before implementing that behavior |
| Final decision log approval, 2026-10-05 | After the complete v1 summary and linked decision log, Vladyslav Kovalov responded “yes” to “Do you approve this final log so I can create the implementation tasks?” | Final review v1 approved, including its scope boundaries; focused implementation issue creation authorized |
| Publication preference, 2026-10-05 | Asked whether to publish full v1 as a Linear document attached to ZVY-57, Vladyslav Kovalov chose “Keep the full log local” | Full log/review history retained locally; only concise handoff summary and approved implementation requirements recorded in Linear |

For each decision, record the owner response, date, final priority, rationale and exact agreed criteria beside the finding. If deferred, record the condition for revisiting it; if rejected, record why. Partial approval must identify which behaviors are approved. Final approval must identify this log's version or revision and the full agreed set of changes.

## Common device and verification expectations

All candidate criteria below are to be checked at desktop **1440 × 900**, mobile **390 × 844**, and narrow mobile **360 × 844**, unless a finding explicitly limits its affected layout. Desktop should retain its working navigation and keyboard behavior. Mobile should preserve readable controls, complete labels and access to the current task without horizontal clipping. The smaller height caused by a real software keyboard requires separate device verification.

Implementation issues must retain canonical and alias finding IDs, affected screen/state IDs, the baseline and finding evidence links, approved behavior and criteria, device differences, and verification requirements. Use deterministic data for failure, eligibility, invoice and promo scenarios. Include relevant regression tests and obtain the required build/pipeline result when implementing. All agreed implementation issues must block [ZVY-58](https://linear.app/zvychajna/issue/ZVY-58).

Physical-phone journeys, provider iframe keyboard interaction, screen-reader speech, 200% text enlargement and real payment outcomes remain verification gaps. These proposed changes do not certify any of those checks. ZVY-58 requires real-phone evidence or an explicit owner disposition of the limitation. The owner must review the final implementation outcome there.

## Checkout and delivery

### F-CHECK-005 Actionable server rejection

**Decision: Approved on 2026-10-04 by Vladyslav Kovalov. Final priority: Low (Linear 4), lowest implementation tier.** Screen SCR-05; [finding and evidence](REPORT.md#f-check-005). The controlled server response supplies field/item errors, but the UI displays only a generic retry toast. Rationale: customers need a correction they can act on when retrying unchanged data will fail again; the owner explicitly wants this improvement ranked as low as possible. The consolidation's original P1 recommendation remains historical evidence, not the agreed implementation priority.

**Approved behavior:** Show safe Ukrainian correction messages beside the relevant field or cart item, with a persistent summary when needed. Keep entered details and selection. Distinguish a correctable rejection from a temporary service failure. The current form already retains entered details after rejection; preserve that behavior. This concerns refusal to create an invoice before payment, not a declined card payment.

Acceptance criteria for final decision-log review:

- A controlled 400 response with known customer field paths displays associated inline errors; an item path identifies the affected cart line and offers a way to edit/remove it. The summary provides links to the correction locations.
- Unknown validation paths produce a persistent, safe explanation and recovery action. Backend exception details are never displayed; a generic toast alone does not satisfy a correctable-rejection scenario.
- A controlled 500/network failure displays temporary-failure feedback with retry. Form values, cart and promo survive both rejection and temporary failure. No success or redirect appears after an error.
- The first actionable error or summary receives focus after rejection; errors are programmatically associated and announced. Correcting a field clears its outdated rejection feedback and a subsequent valid submission can proceed.

Device difference: the behavior is shared; mobile scrolls the correction into view without hiding it behind the keyboard or fixed controls. Verify field, cart-item, unknown-path and temporary-failure cases. Coordinate with F-CHECK-004; preserve the API boundary and existing validation contract.

### F-CHECK-002 Visible delivery picker exit

**Decision: Approved on 2026-10-04 by Vladyslav Kovalov. Final priority: Low (Linear 4), lowest implementation tier.** Screen SCR-05; [finding and evidence](REPORT.md#f-check-002). The host close control exists on desktop and is hidden at both mobile widths. Rationale: leaving a branch picker must not require selecting a branch; the owner explicitly wants this improvement ranked as low as possible. The consolidation's original P1 recommendation remains historical evidence, not the agreed implementation priority.

![Delivery picker desktop and mobile evidence](../storefront-checkout/paired/SCR-05-delivery-picker-loaded.jpg)

**Approved behavior:** Keep a compact host header with a named Close or Back control visible on mobile. Closing returns to the existing checkout draft and restores focus to the branch-selection control.

Acceptance criteria for final decision-log review:

- A host exit remains visible and operable during loading, loaded results, no results and controlled provider failure at every supported width.
- Closing without selection preserves all checkout values and the previous branch, if any; choosing a branch updates only the delivery selection and returns to checkout.
- Keyboard activation and Escape from host controls close the picker and return focus to its opener. The mobile header reduces the iframe's available height without covering provider controls or creating horizontal overflow.
- Real-phone scrolling, software-keyboard obstruction, back navigation and keyboard behavior inside the cross-origin iframe are verified separately and recorded; a host-only test does not count as iframe verification.

Desktop retains its existing visible exit. Mobile trades a small amount of provider space for a dependable way back. No provider outage or proven iframe keyboard trap is claimed by the baseline.

### F-CHECK-004 Current validation feedback

**Decision: Approved on 2026-10-04 by Vladyslav Kovalov for clearing corrected-field errors on blur. Final priority: Low (Linear 4).** Screen SCR-05; [finding and evidence](REPORT.md#f-check-004). Valid corrected inputs retain errors and invalid semantics until another submit. Rationale: feedback should reflect the customer's current input; the owner approved clearing the obsolete error when leaving a corrected field and explicitly chose Low priority. The report's P2 remains the historical recommendation.

**Approved behavior:** After a field has failed validation, revalidate it on blur after editing and remove obsolete error feedback when it becomes valid. The same correction behavior applies on desktop and mobile.

Acceptance criteria for the approved scope, to confirm in the final decision log:

- Correcting and leaving a failed field clears its stale message and `aria-invalid`; fields that remain invalid retain useful feedback. Untouched fields are not marked invalid merely on opening checkout.
- This feedback update does not submit an invoice request or clear entered values; a later submission still performs the required validation.

Additional candidates retained for final review, not approved by the correction-on-blur answer:

- Empty submission shows the required errors and focuses the first invalid control or a summary linked to it.
- Accessible field names remain their labels; errors use associated descriptions and announcements. Selecting a valid delivery branch clears its stale required error.
- Digital checkout does not require physical-only fields. Switching between physical and digital requirements does not leave obsolete errors. Client-invalid submission makes no invoice request.

The same correction behavior applies on desktop and mobile. Extend the existing keyboard/accessibility tests from ZVY-24 rather than treating the previous coverage as proof this behavior works.

### F-CHECK-006 Checkout draft continuity

**Decision: Approved on 2026-10-04 by Vladyslav Kovalov for same-visit checkout draft continuity. Final priority: Low (Linear 4).** Screen SCR-05; [finding and evidence](REPORT.md#f-check-006). Resetting on every opening is intentional existing behavior; preserving a draft was a usability proposal. Rationale: customers should be able to edit their cart without retyping their details; the owner approved that outcome and chose Low priority.

**Approved behavior:** Preserve name, email, phone, selected branch and note when checkout is closed to edit the cart and reopened during the same visit. Apply the same behavior on desktop and mobile.

Acceptance criteria for the approved scope, to confirm in the final decision log:

- Entering checkout details, returning to the cart, changing quantity or promo, and reopening checkout during the same visit restores the entered values instead of resetting them.
- Correcting the cart does not discard the optional note or selected branch. Form validation still runs before submission and preserved fields do not permit duplicate submission.

Retention/reset and navigation details proposed for final review, not separately settled by the same-visit answer:

- Keep the draft only in memory in the current browser tab while the storefront remains loaded; reset on reload/tab close, empty cart, explicit Start over, or verified successful payment. Do not persist personal details to browser storage under this proposal.
- Provide an explicit Back to cart action if needed for the agreed navigation pattern.
- Moving to a digital-only cart excludes shipping/phone from submission. Returning to a physical cart revalidates the stored delivery choice and required fields.
- The agreed reset events clear the draft and its errors. A temporary request failure retains it. No cross-device or reload persistence is claimed.
- A pending submission cannot be duplicated by closing/reopening; late-result behavior follows the separate F-CHECK-001 payment decision.

Open decisions for final log review: exact reset events, memory-only retention boundary and the return-to-cart control. The owner approved same-visit continuity, not cross-device or permanent storage. Payment verification is a dependency for the proposed successful-payment reset.

### F-CHECK-007 Delivery cost disclosure

**Decision: Approved on 2026-10-04 by Vladyslav Kovalov. Final priority: Low (Linear 4).** Screen SCR-05; [finding and evidence](REPORT.md#f-check-007). The summary displays a product-only payable total without explaining delivery charges. Rationale: customers need to know what the displayed amount includes before submitting; the owner confirmed separate customer-paid delivery, approved explaining it beside the total and chose Low priority. The report's P2 remains the historical recommendation.

**Owner-confirmed policy on 2026-10-04:** The customer pays Nova Post for delivery separately from the book payment. Delivery is not included in the online book-payment total. The owner has not specified the delivery amount or collection time; neither is promised in the proposed copy.

**Approved behavior:** Place a concise delivery-cost explanation beside the physical/mixed order total saying that delivery is paid separately to Nova Post and is excluded from the displayed amount. Coordinate with [ZVY-48](https://linear.app/zvychajna/issue/ZVY-48). Ukrainian copy for final log review: “Доставка Новою поштою оплачується покупцем окремо та не входить у цю суму.” No amount or tariff is invented.

Acceptance criteria for final decision-log review:

- Physical and mixed checkout state that the customer pays Nova Post delivery separately and that it is excluded from the displayed payment total. The total label correctly identifies the scope of the online book payment.
- If the actual delivery amount is unknown, the UI says so and explains the agreed basis/method rather than showing zero or implying inclusion.
- Digital-only checkout has no shipping charge/selection requirement. Desktop/mobile use the same policy and wording; disclosure remains visible and readable before submission.

Confirm final Ukrainian wording with the completed decision log. Delivery amount and collection time are unconfirmed and will not be promised. A delivery calculator is not included in this proposal.

## Payment handoff and return

### F-CHECK-001 Retain unpaid order context

**Decision: Approved on 2026-10-04 by Vladyslav Kovalov for unpaid-order recovery. Final priority: Low (Linear 4).** Screens SCR-04, SCR-05, SCR-06; [finding and evidence](REPORT.md#f-check-001). Invoice creation clears the cart before verified payment, and a late response redirects after closing checkout. Rationale: returning without payment should leave an order that can be reviewed and retried without rebuilding the cart; the owner approved recovery and chose Low priority. The report's P1 remains the historical recommendation.

**Approved behavior:** Preserve unpaid order/cart context through payment handoff and a non-successful return, so the customer can review the order and retry without recreating the selection. Reconcile outcomes with [ZVY-40](https://linear.app/zvychajna/issue/ZVY-40); successful payment requires trusted provider/backend verification.

Acceptance criteria for the approved recovery scope, to confirm in the final decision log:

- Controlled pending, failed, canceled and unverified returns retain enough selection context to review/retry; only trusted verified success displays a success receipt and finalizes the purchased selection.
- Retry rechecks current prices, availability and promo validity; an old promo snapshot is not a guarantee that it still applies.
- Reload/revisit does not repeat order processing, notifications or delivery. Editing the cart while a payment is pending cannot make a later outcome clear unrelated newer items.

Additional candidate awaiting final review: keep submission status visible when checkout closes; a late invoice response offers Continue to payment instead of unexpectedly redirecting a closed form. Closing does not imply server-side cancellation and reopening cannot create a duplicate request.

Open decisions for final review: pending-request close/continuation model, exact payment-context retention/reset rules and the precise ZVY-40 scope. The recovery approval does not separately approve the proposed late-response interaction. Deterministic status/late-response cases and cross-layer contract tests are required; live payment/provider verification is separate.

## Cart and promotions

### F-CHECK-010 Consistent promo allocation

**Decision: Approved on 2026-10-04 by Vladyslav Kovalov. Final priority: Medium (Linear 3).** Screen SCR-04; [finding and evidence](REPORT.md#f-check-010). Displayed line amounts differ from the correct summary by 20 UAH. Rationale: the amount payable must be explainable from the displayed lines; the owner approved correcting item-level discounts and selected “middle”, recorded as Medium. No overcharge is claimed. The report's P1 remains the historical recommendation.

Approved behavior and acceptance criteria for final decision-log review:

- Item displays and cart/checkout totals use the same discounted-unit allocation, including explicit zero allocation for eligible items without a discounted unit.
- With two paper units at 499 and one digital unit at 199, the one-use ONE10 fixture shows paper 948, digital 199, discount 50 and total 1147 UAH. Lines add to the payable total at all widths.
- Unlimited, exhausted, restricted and fixed-discount cases remain consistent, with the existing ZVY-33 currency-precision regression preserved. Controlled fixtures determine expected rounding/allocation; no real promo is consumed.

### F-CHECK-008 Distinguish promo rejection from outage

**Decision: Approved on 2026-10-04 by Vladyslav Kovalov. Final priority: Low (Linear 4).** Screen SCR-04; [finding and evidence](REPORT.md#f-check-008). A temporary 503 is labeled as an invalid code. Rationale: a service outage needs retry feedback rather than a false code rejection; the owner approved explaining that the code could not be checked and retrying without retyping, and chose Low priority. The report's P2 remains the historical recommendation.

Approved behavior and acceptance criteria for final decision-log review:

- Invalid/expired code responses show correction feedback; network/503 failures show a temporary-failure explanation and Retry while retaining the typed code.
- A recovered service accepts the unchanged valid code. Loading prevents duplicate apply requests; failure does not silently change cart quantities or prices.
- Messages are persistent/announced and readable at all widths. Existing applied-promo behavior during refresh failure must be agreed if that state is supported.

### F-CHECK-003 Narrow promo row

**Decision: Approved on 2026-10-04 by Vladyslav Kovalov. Final priority: High (Linear 2).** Screen SCR-04; [finding and evidence](REPORT.md#f-check-003). The Apply button is clipped at 360 px. Rationale: the entire promo input and action should fit on screen at the supported narrow width; the owner approved the responsive layout fix and chose High priority. The report's P2 remains the historical recommendation.

Approved behavior and acceptance criteria for final decision-log review:

- Input and complete Apply action fit within the cart at 360 px without horizontal overflow, including loading and validation messages.
- Shrink or stack the row where necessary; preserve usable desktop/390 px layout, keyboard Enter and visible focus. Check actual touch use separately.

## Product selection and suggestions

### F-BOOK-001 Eligible initial edition

**Decision: Approved on 2026-10-04 by Vladyslav Kovalov for initial ebook selection when paper is unavailable and the ebook is available. Final priority: Medium (Linear 3).** Screen SCR-03; [finding and evidence](REPORT.md#f-book-001). Unavailable paper is initially selected while digital is purchasable. Rationale: the initial offer should expose the available purchase option; the owner approved this fallback and chose Medium priority. The report's P1 remains the historical recommendation.

Approved behavior and acceptance criteria for final decision-log review:

- On initial entry without a deliberate customer choice, when paper is unavailable and the ebook is available, select the ebook and show its enabled purchase action and effective price.
- The cart receives the selected ebook item and price at desktop, mobile and narrow widths. Available-paper defaults and all-unavailable eligibility protection must not regress.

Additional candidates awaiting final review: the complete edition preference order for other combinations (available paper, other available editions, preorder-only offers), and refresh behavior for deliberate choices. The proposed rule is to retain deliberate selections, explain changed eligibility and offer alternatives rather than silently replacing the customer's choice. The initial fallback approval does not separately settle those combinations.

### F-BOOK-002 Eligible suggested edition

**Decision: Approved on 2026-10-04 by Vladyslav Kovalov. Final priority: Medium (Linear 3).** Screens SCR-03, SCR-04; [finding and evidence](REPORT.md#f-book-002). Suggestions can add an unavailable non-preorder edition. Rationale: an optional offer must not let the customer add an edition that cannot be purchased or preordered; the owner approved hiding those suggestions and chose “med”, recorded as Medium. The report's P1 remains the historical recommendation.

Approved behavior and acceptance criteria for final decision-log review:

- Suppress a suggestion when its exact edition is neither available nor preorderable; never substitute another edition silently. If eligibility changes while the dialog is open, disable adding and explain it.
- Eligible/preorder suggestions use the shared status rule; the resulting cart has the intended item/price. The suppressed-suggestion Buy flow continues directly to cart.
- Test current and changed eligibility at all widths. Capture a settled suggestion state when verifying; the historical ghosted image is weak presentation evidence.

### F-BOOK-004 Continue without an add-on

**Decision: Approved on 2026-10-04 by Vladyslav Kovalov for an explicit Continue without the add-on action after Buy. Final priority: Medium (Linear 3).** Screen SCR-03; [finding and evidence](REPORT.md#f-book-004). Dismissing the suggestion leaves the original book in cart but interrupts Buy continuation. Rationale: an optional add-on should not obscure the original purchase intent; the owner approved a button that proceeds directly to cart and chose “med”, recorded as Medium. The report's P2 remains the historical recommendation.

Approved behavior and acceptance criteria for final decision-log review:

- During Buy, provide a named Continue without add-on action and explain that the original book is already selected; it opens cart without adding the suggestion.
- The continuation action does not add the original item twice; the existing selected edition, quantity and price remain correct. Keyboard focus moves into the resulting cart at all widths.

Additional dismissal candidate awaiting final review: Close/Escape follows the same Buy continuation; Add retains the ordinary stay-on-page intent. Approving the explicit button does not separately approve this Close/Escape behavior. Existing accepting/dismissing flows must not duplicate the original selection.

### F-BOOK-005 Explain digital delivery

**Decision: Approved on 2026-10-04 by Vladyslav Kovalov for explaining EPUB delivery by email. Final priority: Medium (Linear 3).** Screens SCR-03, SCR-04; [finding and evidence](REPORT.md#f-book-005). Electronic selection lacks file/delivery information while print specifications remain visible. Rationale: customers need to understand what the ebook purchase supplies; the owner approved stating EPUB file delivery by email and chose “med”, recorded as Medium. The report's P2 remains the historical recommendation.

Approved behavior and acceptance criteria for final decision-log review:

- Digital selection clearly explains that the customer receives an EPUB file by email before entering checkout. The information is readable at all three supported widths.
- Edition and delivery information stay consistent with the selected ebook item and price. Do not imply that the ebook is a physical shipment or promise universal reader compatibility, instant delivery or an unverified deadline.

Additional content candidates awaiting final review: label/exclude print-only specifications for the digital offer, repeat the delivery information in cart where useful, and provide verified delivery timing/reader guidance. The EPUB/email answer does not separately approve those additions or a delivery-time promise.

### F-BOOK-006 Earlier sample and purchase return

**Decision: Approved on 2026-10-04 by Vladyslav Kovalov for moving the mobile excerpt link near the format selector and Buy buttons. Final priority: High (Linear 2).** Screen SCR-03; [finding and evidence](REPORT.md#f-book-006). Mobile sampling appears after the description. Rationale: readers should be able to find the excerpt near the purchase controls; the owner approved the earlier link and chose High priority. Its customer/conversion impact remains a usability hypothesis. The report's P2 remains the historical recommendation.

Approved behavior and acceptance criteria for final decision-log review:

- At 390/360 px, put a clearly named excerpt action near the format selector and Buy buttons, before the long description, where an excerpt exists. Books without excerpts do not show a dead action.
- The action opens the existing excerpt dialog; closing it restores focus to its opener and preserves the chosen edition. Preserve desktop sampling and existing accessible dialog behavior.

Additional candidate awaiting final review: a return-to-purchase action after long supporting content. A sticky purchase bar remains an unapproved option requiring a separate owner decision and real-device obstruction checks; it is not included in the excerpt-placement approval.

## Catalog and home

### F-DISC-001 Catalog failure recovery

**Decision: Approved on 2026-10-04 by Vladyslav Kovalov for distinguishing catalog failure from an empty catalog and offering retry. Final priority: Low (Linear 4).** Screens SCR-01, SCR-02; [finding and evidence](REPORT.md#f-disc-001). A cold catalog outage looks like empty stock and removes home content. Rationale: unavailable data should offer recovery without suggesting the shop has no products; the owner approved a loading-failure message with Retry, a separate genuine empty state and Low priority. The report's P1 remains the historical recommendation.

Approved behavior and acceptance criteria for final decision-log review:

- Controlled failure shows a safe Ukrainian error and working Retry on home/catalog; a successful empty response shows a distinct empty state. Navigation remains available.
- Recovery loads offers without leaving stale error feedback; loading prevents duplicate retry actions. Check cold failure, successful empty response, loading and recovery independently at all widths, reusing the ZVY-22 error components where appropriate.

Additional candidate awaiting final review: retaining previously loaded offers during a warm-refresh failure with an explicit freshness/error cue. The failure/empty/retry approval does not separately approve that cache presentation; inspect warm-cache behavior independently before changing it.

### F-DISC-002 Consistent availability and preorder disclosure

**Decision: Approved on 2026-10-04 by Vladyslav Kovalov for consistent preorder labels and product-page wording. Final priority: Medium (Linear 3). Source alias: F-BOOK-003.** Screens SCR-02, SCR-03, SCR-04; [finding and evidence](REPORT.md#f-disc-002). Preorder status disappears between discovery, details and cart. Rationale: status must follow the edition so customers can recognize a preorder at discovery and cart review; after reviewing the screenshot explanation the owner approved the labels/wording and chose “med”, recorded as Medium. The report's P1 remains the historical recommendation.

Owner requested more explanation and screenshot references on 2026-10-04; no approval was inferred. The review uses the recorded «Під шепіт снігу» offer: the [360 px catalog capture](../storefront-discovery/screenshots/SCR-02-scrolled-360x844.jpg) shows paper price 349 UAH and the ordinary cart icon without a preorder label; the [desktop product capture](../storefront-selection/screenshots/SCR-03-preorder-1440x900-full.jpg) shows “Передзамовити — 349 грн” above the contradictory “Купити зараз або додати до кошика” hint; the [390 px cart capture](../storefront-selection/screenshots/SCR-04-preorder-390x844.jpg) shows the paper edition, price and quantity without its preorder status. These are local audit captures using recorded availability, not a new live stock check. Proposed customer impact remains inferred.

Approved behavior and acceptance criteria for final decision-log review:

- Show a visible “Передзамовлення” label beside the preorder edition in the catalog and its cart line. Product-page action and supporting guidance consistently describe preorder and do not say Buy now for that offer.
- Desktop, mobile and narrow layouts communicate the same edition status without clipping the label or altering the selected item/price. Available non-preorder editions are not mislabeled as preorder.
- Use authoritative availability/preorder data; the backend remains authoritative for purchase eligibility. The approved labels do not add an unverified dispatch date or timing promise.

Additional candidates awaiting final review: explicit fully-unavailable guidance, repeating preorder status in checkout, changed-eligibility feedback and dispatch wording. No dispatch date or policy was supplied in this approval; truthful timing copy requires owner confirmation before inclusion in implementation.

### F-DISC-003 Complete catalog titles

**Decision: Rejected on 2026-10-04 by Vladyslav Kovalov. Implementation priority: Not applicable.** Screen SCR-02; [finding and evidence](REPORT.md#f-disc-003). Two current collection names are clipped at 360 px. Rationale/discussion: the owner was unsure about showing full titles; the review explained the tradeoff between identifying context and taller cards/more scrolling, offered a separate subtitle and suggested comparing previews. The owner then rejected the proposal without giving an additional reason. Preserve the current title layout under this decision; create no implementation issue for full-title wrapping or the subtitle alternative. The report's P2 remains historical.

Rejected proposals retained as review history:

- Show the complete current product name or an owner-approved short title plus meaningful subtitle; the accessible product name stays complete.
- The two evidenced collections and a controlled long-title fixture remain identifiable without clipped text/overlap at all widths. Verify 200% enlargement/reflow separately.

Residual risk: the observed narrow-screen truncation remains. Revisit only if the owner reopens the layout decision; no visual-comparison work is scheduled by this rejection.

### F-DISC-004 Mobile readability and targets

**Decision: Approved on 2026-10-04 by Vladyslav Kovalov for mobile only, subject to review of the implemented result before final acceptance. Final priority: Low (Linear 4).** Screen SCR-02; [finding and evidence](REPORT.md#f-disc-004). Dense rows are a usability hypothesis; 26 px quick-add is not a demonstrated minimum-target violation. Rationale: larger text and controls may improve phone browsing comfort, while retaining the two-column layout. After seeing the interactive card-details example, the owner approved proceeding at Low priority and explicitly reserved the option to reject the implemented result. The report's P2 remains historical.

Approved behavior and acceptance criteria for final decision-log review:

- Keep two columns on 360/390 px phones and preserve the current title layout. Use at least 14 px format/price text and 44 × 44 CSS px quick-add buttons. Put the format label above the price/button row so the larger controls fit.
- Full format, amount and currency remain visible, and touch/keyboard quick-add selects only the intended edition with no overlapping targets.
- Apply these sizing and arrangement changes within the existing mobile breakpoint only. At 1440 px, preserve the desktop grid, card appearance, text sizing and quick-add sizing/behavior. Check intermediate widths and 320 px reflow for clipping and overflow.
- Compare representative phone browsing with the baseline and record the taller-row/increased-scroll tradeoff; no conversion improvement is assumed. Present the implemented mobile result to the owner for acceptance before ZVY-58 sign-off. The owner may reject it after that review; the current approval does not certify the final design.

The earlier one-column starting option is superseded by the approved two-column example. No desktop redesign or change to the rejected F-DISC-003 title treatment is included.

### F-DISC-005 Useful browsing cues

**Decision: Rejected on 2026-10-05 by Vladyslav Kovalov for short genre/type/series labels on catalog cards, on mobile and desktop. Implementation priority: Not applicable.** Screen SCR-02; [finding and evidence](REPORT.md#f-disc-005). Subject/type is hard to infer without detail visits; demand for search is unproven. Rationale: after reviewing the card-details example, the owner said “i don't like short labels.” Keep the cards without these additional context labels and create no implementation issue for this proposal. The report's P2 remains historical.

Rejected proposal retained as review history:

- Use verified API content for concise genre/type/series cues so books, collections, bundle and merchandise can be distinguished at all widths; omit absent cues cleanly.
- New metadata does not truncate titles/prices or change purchase eligibility. Assess an unknown-title browsing task with representative customers.
- Search/filter/sort and book/merchandise grouping were not approved by this review. Do not replace the rejected label proposal with those alternatives automatically; reconsider them only after a separate owner decision and supporting catalog/customer evidence.

Residual risk: unknown-title browsing may still require opening details to learn the subject/type. This is a usability hypothesis, not a demonstrated customer blocker. The label rejection does not reverse the separately approved preorder disclosure in F-DISC-002.

### F-DISC-006 Earlier home action

**Decision: Approved on 2026-10-05 by Vladyslav Kovalov for placing the mobile featured price and Детальніше action before the long description. Final priority: High (Linear 2).** Screen SCR-01; [finding and evidence](REPORT.md#f-disc-006). The mobile featured action follows the cover and full description. Rationale: customers should reach the price and details action without first scrolling through the full description; the owner approved this order after the comparison and explicitly chose High priority. Customer impact remains a usability hypothesis. The report's P2 remains historical.

Approved behavior and acceptance criteria for final decision-log review:

- At 390/360 px, present the featured price and Детальніше action with the title, before the long description. Retain the full description as supporting content and keep navigation available.
- The action opens the correct featured book and the displayed starting amount agrees with effective pricing. Missing offer data follows the shared failure/empty behavior. Keyboard reading/focus order follows the visual order, without clipped text or controls.
- Desktop retains its existing visible offer/action hierarchy. Capture the implemented mobile order against the baseline; no fixed first-viewport guarantee applies to arbitrary future titles without an agreed layout limit.

**Additional layout suggestion: Deferred on 2026-10-05 by Vladyslav Kovalov.** After suggesting “maybe change cover and title possition for mobile screen,” the owner responded “to be decided later” when offered title-above-cover or a smaller cover beside the title, price and button. Revisit during a later owner design review, when a concrete layout can be compared and chosen. Preserve the existing cover/title arrangement for the approved High-priority price/action reorder; no cover resizing/repositioning or separate implementation issue is authorized by this deferral.

Additional content candidate awaiting final review: name the edition supplying the starting price, such as electronic from 249 UAH in the historical offer. The mobile-order example did not separately approve new price qualification copy. Preserve truthful effective pricing under the approved reorder.

## Shared controls and accessibility

### F-DISC-008 Visible shared focus

**Decision: Rejected on 2026-10-05 by Vladyslav Kovalov. Implementation priority: Not applicable. Source alias: F-BOOK-008.** Screens SCR-01 through SCR-05; [finding and evidence](REPORT.md#f-disc-008). Checkout focus is supporting evidence from F-CHECK-009, whose primary mapping remains F-DISC-007. Rationale/discussion: the proposed change was explained as making the outline around the button or field reached by Tab clearer and consistent across the site; the owner responded “rejected” without an additional reason. Preserve existing focus appearance and create no implementation issue for a shared outline redesign. The report's P2 remains historical.

Rejected proposal retained as review history:

- Adopt one clearly visible focus treatment for navigation, cards, quick-add, edition selectors, cart, forms and dialog actions. Keep the brand accent unchanged; focus appearance is a separate decision from action-text contrast.
- Proposed measurable target: a continuous indicator at least 2 CSS px thick and at least 3:1 against adjacent backgrounds, unobscured by clipping/fixed controls. Inspect light and cream surfaces and forced-colors behavior.
- Preserve keyboard navigation, dialog trapping, Escape and focus restoration. Extend existing assertions to check the agreed appearance instead of presence alone; record phone/assistive-technology limitations explicitly.

Residual risk: existing weak or inconsistent authored focus appearance remains. This decision rejects the shared appearance redesign only; preserve existing keyboard operation and the focus movement/restoration needed by separately approved checkout and dialog behaviors.

### F-DISC-007 Existing text contrast exception

**Decision: Deferred on 2026-10-05 by Vladyslav Kovalov. Final priority for later review: Low (Linear 4). Source aliases: F-BOOK-007, F-CHECK-009.** Screens SCR-01, SCR-03, SCR-04, SCR-05; [finding and evidence](REPORT.md#f-disc-007). Rationale: the owner explicitly wants a later decision on the treatment and assigns Low priority. This is not approval to implement a color change or a permanent rejection of contrast improvement. The existing brand exception remains in force until that later decision. The report's P2 remains historical.

Deferred scope and revisit condition: during a later owner design review, compare possible text/background treatments across home Details, product Buy/Add, suggestion price, cart checkout/total, promo Apply and checkout submit/total, on desktop and mobile. Agree the treatment and observable acceptance criteria before creating an implementation issue. Create no contrast implementation issue in this handoff; keep its Low-priority future decision recorded here.

Residual risk: the historical white-on-`#f09b30` and accent-on-white treatment measures approximately 2.23:1 in the audit and may be harder to read for customers with reduced contrast sensitivity. No new measurement or customer impact study is claimed. The existing exception and omitted automated color-contrast checks do not establish accessibility conformance. Preserve the current accent under the repository instruction until the owner chooses a treatment.

## Approved final review v1 — 2026-10-05

**Approved by Vladyslav Kovalov on 2026-10-05.** The owner responded “yes” to the explicit final-log/task-creation approval question. Individual review is complete: 18 approved scopes, three rejected proposals and one deferred canonical finding. This approved version authorizes focused implementation issues for the approved scopes and their observable criteria, not immediate application implementation or deployment. Every included issue must block ZVY-58; use existing overlapping issues where appropriate.

| Finding | Final disposition / priority | Scope for the handoff |
| --- | --- | --- |
| F-CHECK-003 | Approved / High | Entire promo input and Apply button fit narrow phones |
| F-BOOK-006 | Approved / High | Move the mobile excerpt link near format/Buy controls |
| F-DISC-006 | Approved / High | Mobile home price and Details before the long description; retain current cover/title arrangement |
| F-CHECK-010 | Approved / Medium | Item discount displays reconcile with the payable total |
| F-BOOK-001 | Approved / Medium | Initially select available ebook when paper is unavailable |
| F-BOOK-002 | Approved / Medium | Suppress ineligible add-on suggestions |
| F-BOOK-004 | Approved / Medium | Explicit Continue without add-on opens the cart |
| F-BOOK-005 | Approved / Medium | Explain EPUB delivery by email |
| F-DISC-002 (F-BOOK-003) | Approved / Medium | Consistent catalog/cart preorder labels and product wording |
| F-CHECK-005 | Approved / Low | Actionable server rejection feedback retaining entered context |
| F-CHECK-002 | Approved / Low | Visible mobile delivery-picker exit |
| F-CHECK-004 | Approved / Low | Clear corrected-field errors on blur |
| F-CHECK-006 | Approved / Low | Preserve checkout details when editing cart/reopening during the same visit |
| F-CHECK-007 | Approved / Low | Explain separate customer-paid Nova Post delivery beside the total |
| F-CHECK-001 | Approved / Low | Recover unpaid order context for review/retry after non-success return |
| F-CHECK-008 | Approved / Low | Promo-service failure feedback and retry without retyping |
| F-DISC-001 | Approved / Low | Distinct catalog failure/empty states and working Retry |
| F-DISC-004 | Approved / Low | Larger mobile format/price text and add buttons, keeping two columns and titles; owner reviews implemented result before acceptance |
| F-DISC-003 | Rejected / Not applicable | No catalog title-layout change |
| F-DISC-005 | Rejected / Not applicable | No extra short genre/type/series labels |
| F-DISC-008 (F-BOOK-008) | Rejected / Not applicable | No shared focus-outline redesign |
| F-DISC-007 (F-BOOK-007, F-CHECK-009) | Deferred / Low | Later owner decision on contrast treatment; retain current styling for now |

The home cover/title redesign is separately deferred to later owner review. The approved handoff excludes the other additional candidates explicitly marked unapproved in the finding sections: broader checkout validation redesign, new draft reset/navigation controls or persistence policies, late-invoice close/continuation interaction, broader edition preference/refresh behavior, altered Close/Escape suggestion continuation, extra print/digital specification or delivery timing copy, sticky/return-to-purchase controls, warm-cache presentation, fully-unavailable/checkout preorder guidance, dispatch promises, and new home starting-price qualification copy. These ideas remain documented for a later scoped decision; final approval does not convert them into implementation requirements.

Implementation details needed to deliver an approved outcome must respect that scope. Where a meaningful retention/reset or payment contract choice cannot be resolved from existing behavior, record it in the focused issue and obtain that choice before implementing the affected behavior. Do not invent shipping or delivery-time policies. The approved same-visit draft behavior does not authorize cross-device or permanent personal-data storage.

Before ZVY-58 sign-off, review the implemented changes, including the explicitly provisional F-DISC-004 mobile sizing. Evidence gaps listed above remain visible; no mockup is a runtime or real-phone pass.

## Shared decisions applied to the handoff

| Pattern | Agreed handoff rule and scope boundary | Affected findings |
| --- | --- | --- |
| Eligibility and status | Preserve authoritative edition eligibility; suppress ineligible suggestions and show approved preorder labels; do not invent timing or new unavailable-state guidance | F-BOOK-001, F-BOOK-002, F-DISC-002 |
| Feedback and correction | Persistent actionable correction; invalid data distinct from temporary failures; retain useful context | F-CHECK-005, F-CHECK-004, F-CHECK-008, F-DISC-001 |
| Overlay return and continuation | Visible exits, clear Buy continuation and restored focus | F-CHECK-002, F-CHECK-006, F-CHECK-001, F-BOOK-004 |
| Price and scope | Line discounts reconcile with totals; distinguish product/payment amounts from delivery charges | F-CHECK-010, F-CHECK-007 |
| Focus and brand exception | Shared outline redesign rejected; preserve keyboard/focus behavior; text-contrast treatment deferred at Low priority and current styling retained | F-DISC-008, F-DISC-007 |
| Mobile content | Preserve catalog title layout and omit rejected extra context labels; review larger mobile controls against scrolling; move home price/action before description while preserving the existing home cover/title arrangement; cover/title redesign is deferred and sticky UI is unapproved | F-DISC-003, F-DISC-004, F-DISC-005, F-DISC-006, F-BOOK-005, F-BOOK-006 |

## Issue handoff and remaining decisions

Existing overlaps rechecked on 2026-10-05 before task creation: ZVY-40 is Backlog and covers trusted payment confirmation; ZVY-48 is Backlog and needs truthful commerce policies. ZVY-22, ZVY-24 and ZVY-33 are Done and provide existing error/accessibility/money behavior to extend, not duplicate completed work. The complete team listing had no newer duplicate implementation tasks. Completed ZVY-15 supplies the trusted-webhook/idempotency boundary for reused payment work.

The owner approved the complete v1 log on 2026-10-05. The approved changes are handed off in 15 new issues and one reused issue, covering all 18 approved canonical findings. Shared checkout errors/correction and edition eligibility each group two related findings without mixing priorities. ZVY-40 retains its original confirmation requirements and adds unpaid-order recovery at Low priority. ZVY-70 coordinates delivery disclosure with ZVY-48 without including Merchant diagnostics. All 16 issues are Backlog, belong to this review project and are confirmed blockers of ZVY-58.

### Verified implementation handoff

| Implementation issue | Priority | Findings | Outcome |
| --- | --- | --- | --- |
| [ZVY-59](https://linear.app/zvychajna/issue/ZVY-59/keep-the-promo-input-and-apply-button-within-narrow-mobile-carts) | High | F-CHECK-003 | Keep the promo input and Apply button within narrow mobile carts |
| [ZVY-60](https://linear.app/zvychajna/issue/ZVY-60/move-the-mobile-excerpt-link-near-the-book-purchase-controls) | High | F-BOOK-006 | Move the mobile excerpt link near the book purchase controls |
| [ZVY-61](https://linear.app/zvychajna/issue/ZVY-61/show-mobile-home-price-and-details-before-the-long-description) | High | F-DISC-006 | Show mobile home price and Details before the long description |
| [ZVY-62](https://linear.app/zvychajna/issue/ZVY-62/make-item-promo-displays-reconcile-with-cart-and-checkout-totals) | Medium | F-CHECK-010 | Make item promo displays reconcile with cart and checkout totals |
| [ZVY-63](https://linear.app/zvychajna/issue/ZVY-63/select-an-available-ebook-fallback-and-suppress-ineligible-add-ons) | Medium | F-BOOK-001, F-BOOK-002 | Select an available ebook fallback and suppress ineligible add-ons |
| [ZVY-64](https://linear.app/zvychajna/issue/ZVY-64/add-continue-without-add-on-to-the-buy-suggestion-dialog) | Medium | F-BOOK-004 | Add Continue without add-on to the Buy suggestion dialog |
| [ZVY-65](https://linear.app/zvychajna/issue/ZVY-65/explain-that-ebooks-are-epub-files-delivered-by-email) | Medium | F-BOOK-005 | Explain that ebooks are EPUB files delivered by email |
| [ZVY-66](https://linear.app/zvychajna/issue/ZVY-66/keep-preorder-labels-consistent-across-catalog-book-details-and-cart) | Medium | F-DISC-002 | Keep preorder labels consistent across catalog, book details and cart |
| [ZVY-67](https://linear.app/zvychajna/issue/ZVY-67/show-actionable-checkout-rejections-and-clear-corrected-field-errors) | Low | F-CHECK-005, F-CHECK-004 | Show actionable checkout rejections and clear corrected-field errors |
| [ZVY-68](https://linear.app/zvychajna/issue/ZVY-68/keep-a-visible-close-or-back-control-in-the-mobile-delivery-picker) | Low | F-CHECK-002 | Keep a visible Close or Back control in the mobile delivery picker |
| [ZVY-69](https://linear.app/zvychajna/issue/ZVY-69/preserve-checkout-details-when-returning-to-edit-the-cart) | Low | F-CHECK-006 | Preserve checkout details when returning to edit the cart |
| [ZVY-70](https://linear.app/zvychajna/issue/ZVY-70/explain-separately-paid-nova-post-delivery-beside-the-checkout-total) | Low | F-CHECK-007 | Explain separately paid Nova Post delivery beside the checkout total |
| [ZVY-40](https://linear.app/zvychajna/issue/ZVY-40/confirm-payment-outcomes-and-recover-unpaid-orders) | Low | F-CHECK-001 | Confirm payment outcomes and recover unpaid orders (reused existing issue) |
| [ZVY-71](https://linear.app/zvychajna/issue/ZVY-71/distinguish-promo-service-outages-from-invalid-codes-and-allow-retry) | Low | F-CHECK-008 | Distinguish promo-service outages from invalid codes and allow retry |
| [ZVY-72](https://linear.app/zvychajna/issue/ZVY-72/show-catalog-loading-failure-and-retry-separately-from-empty-stock) | Low | F-DISC-001 | Show catalog loading failure and Retry separately from empty stock |
| [ZVY-73](https://linear.app/zvychajna/issue/ZVY-73/increase-mobile-catalog-price-readability-and-add-button-size) | Low | F-DISC-004 | Increase mobile catalog price readability and add-button size |

The concise handoff is recorded on [ZVY-57](https://linear.app/zvychajna/issue/ZVY-57); [ZVY-58](https://linear.app/zvychajna/issue/ZVY-58) lists all implementation prerequisites and retains its real-phone and final owner-approval gates. No implementation ticket was created for the rejected/deferred proposals. The full decision log stays local, as explicitly requested. A full-document publication attempt was rejected by automatic approval review for lacking explicit authorization to send the review history to that Linear destination; publication was not retried after the owner chose local retention.

| ZVY-57 acceptance criterion | Current status |
| --- | --- |
| Every proposal has a decision and rationale | Eighteen scopes approved: nine Low, six Medium, three High; three rejected; one deferred at Low; none pending; all 22 canonical proposals represented |
| Shared patterns and device expectations consistent and explicit | Approved scopes/device differences and exclusions recorded; owner approved complete v1 |
| Approved changes have observable criteria | Implemented: approved criteria copied into focused issues; excluded additions identified; ZVY-73 needs final owner acceptance and cover/title redesign remains deferred |
| Product-owner approval explicitly recorded | Workflow, eighteen approved scopes and F-DISC-003/F-DISC-005/F-DISC-008 rejections recorded; all canonical dispositions and explicit final v1 owner approval recorded |
| Only agreed implementation issues created and linked to findings/verification | Implemented: 15 new issues plus reused ZVY-40; all 18 approved findings covered; project, priorities and all 16 ZVY-58 blocker relations verified |
| Deferred work, risks and unresolved questions documented | Contrast deferred at Low; cover/title redesign deferred; residual risks, unapproved additions and implementation contract questions recorded |

Unresolved choices include preorder dispatch wording, digital delivery timing/reader guidance, draft and payment-context retention, pending-request close behavior, suggestion dismissal, edition preference order, acceptance of the implemented mobile catalog sizing, home starting-price qualification, return-to-purchase after sampling/supporting content. The owner confirmed that the customer pays delivery separately to Nova Post; amount and collection time remain unspecified and are not promised. The current contrast exception remains in force. None of these pending items is automatically approved by approving the review workflow.

## Validation record

Draft preparation changes documentation only. Validate coverage of all 22 canonical IDs and 26 source mappings, local links and anchors, and consistency between owner decisions and ticket handoff before completion. No new application build, browser journey, remote pipeline result or physical-device pass is claimed by this log.

On 2026-10-04, the initial draft check passed: 22 unique canonical sections, 22 explicitly pending decisions, 26 preserved source mappings, 29 valid local links/anchors and two reference backlinks. Whitespace/diff checks passed. The delivery-picker and corrected-error comparison captures were inspected alongside the report and relevant checkout source. Source consistency was self-reviewed; Markdown preview layout and the proposed changes' runtime behavior remain unverified. The draft is on `codex/zvy-57-storefront-decisions`, based on updated frontend `main` revision `a34a1df`.

Owner dispositions through 2026-10-05 approve eighteen scopes (nine Low, six Medium and three High), reject F-DISC-003, F-DISC-005 and F-DISC-008, and defer F-DISC-007 at Low priority, as recorded in the individual sections and response table. No canonical finding remains pending; scope boundaries and additional implementation contract choices are documented in approved final review v1. F-DISC-004 approval is mobile-only and explicitly requires review of the implemented result before acceptance. F-DISC-006 mobile price/action reorder is approved; cover/title redesign is deferred to a later owner design review, with the existing arrangement preserved for the approved reorder. Final decision-log approval was given on 2026-10-05; the focused issue handoff is complete. Subsequent questions are presented individually, as requested.

The owner confirmed the separate customer-paid Nova Post delivery policy, then separately approved the F-CHECK-007 disclosure and Low priority. The policy confirmation alone was not treated as approval of a change.

On 2026-10-05, approved final review v1 passed the documentation checks: 22 unique canonical sections matching reconciliation, 26 preserved source mappings, 18 Approved / three Rejected / one Deferred / zero Pending dispositions, approved priorities of nine Low / six Medium / three High, 22 final-summary rows and 32 valid local links/anchors. Diff whitespace checks passed. The accepted scope, rejected proposals, deferred design choices, aliases and unapproved additions were self-reviewed for consistency. This checks the decision documentation only; no application implementation, build, remote pipeline, payment outcome or physical-device result is asserted.

On 2026-10-05, the completed handoff check passed: all 18 approved findings map exactly once to 16 implementation issues (15 new, one reused); issue priorities are three High / five Medium / eight Low, with related same-priority findings grouped. The saved issues are Backlog in the review project and include baseline/evidence, screen states, agreed behavior, device scope, acceptance criteria and deterministic verification requirements. All 16 blocker relations were retrieved from ZVY-58; 36 cited evidence references were verified on source commit a34a1df. Canonical/source coverage, dispositions, priorities, 32 local links/anchors, two backlinks, handoff coverage and diff whitespace checks passed. ZVY-57 was marked Done after its six checked acceptance criteria and handoff were retrieved and verified. A temporary 502 on the closure response was resolved by retrieving the issue and confirming Done, without assuming success. ZVY-58 remains Backlog with implementation prerequisites and its original final outcome/real-phone gates. The full log remains local per the explicit publication preference; no full Linear document or repository publication occurred. No application code, build, remote CI result or deployed outcome is claimed.
