# Accessibility (ZVY-24)

Automated accessibility regression coverage for the storefront shopping journey.

## What runs, and where

The checks are Playwright specs, so they run in CI as part of the existing
`End-to-end regression tests` step in `.github/workflows/ci.yml`. No separate job and no
deployment are involved — the suite builds and serves the app itself against the local mock
API in `tests/support/mock-api.mjs`.

| Spec | Covers |
| --- | --- |
| `tests/e2e/accessibility.spec.ts` | axe-core scans of home, catalog, product details, excerpt dialog, cart, checkout, and checkout in its error state; meaningful image alternatives |
| `tests/e2e/keyboard-navigation.spec.ts` | keyboard-only catalog → checkout journey, visible focus, dialog focus trapping/restoration, error announcement, skip link |

Run them locally:

```bash
npm run test:e2e:a11y
```

Or the whole suite with `npm run test:e2e`.

## How the axe scan is configured

`tests/e2e/a11y.ts` runs `@axe-core/playwright` with the tags `wcag2a`, `wcag2aa`,
`wcag21a`, `wcag21aa`, `wcag22aa` and `best-practice`, and asserts **zero** violations —
not "no serious violations". Anything the scan reports fails the build, and the failure
message lists each rule and the selectors that tripped it.

One rule is excluded through `SKIPPED_RULES` in that file — `color-contrast`, for the reason
set out under Accepted exceptions. Nothing else is excluded, and anything else the scan reports
fails the build. Do not add entries without recording the reason below.

## Violations fixed while establishing the baseline

| Rule / problem | Impact | Fix |
| --- | --- | --- |
| `aria-hidden-focus` | serious | The carousel navigation wrapper was `aria-hidden` while containing enabled buttons (`ImageCarousel.tsx`). |
| `scrollable-region-focusable` | serious | The carousel rail scrolls horizontally but was not keyboard reachable. It now has `tabindex="0"` and an accessible name, and the navigation buttons stay visible on `:focus-within`. |
| `landmark-no-duplicate-banner`, `landmark-no-duplicate-contentinfo`, `landmark-unique` | moderate | Dialogs are portalled into `<body>`, so their `<header>`/`<footer>` became second `banner`/`contentinfo` landmarks. They are plain `<div>`s now. |
| `heading-order` | moderate | Catalog cards jumped from the page `<h1>` to `<h3>`; the excerpt dialog titled itself `<h3>` above the `<h2>`s inside the excerpt body. |
| No focus management in dialogs | — | `src/lib/dialog-a11y.ts` now gives every dialog Escape-to-close, initial focus, a real Tab trap and focus restoration to the opener. Only the topmost dialog reacts, so the Nova Poshta picker no longer closes checkout along with itself. |
| Invisible focus on format radios | — | The radio inputs are `opacity: 0` overlays, so the label paints the ring via `.opt:has(input:focus-visible)`. |
| Validation errors not announced | — | Each checkout error is `role="alert"` as well as being referenced by `aria-describedby`. |
| Nova Poshta field unlabelled | — | A `<label>` cannot name a `<button>`, so the field is wired up with `aria-labelledby`/`aria-describedby` and its modal is a real `role="dialog"` with a named close button. |
| No skip link | — | `Перейти до основного вмісту` jumps past the navigation to `<main id="main-content">`. |
| Promo code input named only by its placeholder | — | It now carries an explicit `aria-label`. |

## Accepted exceptions

### `color-contrast` — brand colour, deliberate

**This is a decision by the site owner, not an oversight.**

`--accent: #f09b30` carries white text on the home CTA, the buy button, the cart checkout
button, the checkout submit button, the cart badge and the promo apply button, and is used as
a text colour on the cart total, «Додати в кошик» and the suggestion price. White on it is
**2.23:1** against the 4.5:1 that WCAG 1.4.3 AA asks for.

The colour is not arbitrary. It is sampled from the lettering of the «Звичайна» cover art —
the title on that cover measures `#f3a123`/`#eea231`, within a few units of the brand value.

It cannot be fixed by darkening. Contrast is driven almost entirely by the green channel
(coefficient 0.7152 against 0.2126 for red), so at hue 33° every colour dark enough to reach
4.5:1 with white is brown. The cover's own shading proves it: the darker tones inside the same
lettering are `#976630`, `#8d5a2d`, `#874f1d`. A tested candidate, `#a8560a`, landed exactly in
that range and was rejected on sight.

Three alternatives were built and reviewed, then declined:

| Option | Result | Why declined |
| --- | --- | --- |
| `#a8560a` + white | 5.25:1 | Reads brown, not orange |
| `#f09b30` unchanged + `#442e11` ink | 5.74:1 | Compliant and faithful to the cover, which never puts white on orange — but a large flat fill with dark text reads as a disabled button rather than the primary action |
| `#d97706` + white, label raised to 19.2px bold | 3.19:1, passes as large text | Still weaker than 4.5:1, and does not cover the small-text cases (cart badge, promo button, «Додати в кошик»), so it would leave the fix half-done |

The remaining cost is real and is accepted knowingly: the primary call to action is hard to
read in sunlight and on low-quality displays. Every other accessibility guarantee in this
document — keyboard operation, focus management, dialog behaviour, announced form errors,
image alternatives — holds regardless, and those are enforced.

If the brand palette is ever revisited, remove `color-contrast` from `SKIPPED_RULES` first and
let the suite report what needs attention.

### The page behind a modal is not `inert`

The focus trap keeps `Tab` inside an open dialog, but a screen reader's virtual cursor is not
bound by focus, so the page behind the dialog can still be read. Fixing this properly means
marking everything outside the dialog `inert` while it is open, which is awkward while the
dialogs are portalled into `<body>`. axe does not flag it. Worth a follow-up issue.

### Disabled controls below the contrast threshold

`.buy:disabled` renders grey on grey. WCAG 1.4.3 explicitly exempts disabled controls, and
axe skips them, so this is not a violation — it is recorded here so a reviewer does not have
to rediscover it.

### Carousel images after the first have `alt=""`

`ImageCarousel` gives the first slide the product name and marks the rest decorative. They are
alternative views of the same cover, so repeating the title would add noise rather than
information. The rail itself is a named `group`, which is what assistive technology announces.

## When adding a page or dialog

- Add an axe scan for it in `tests/e2e/accessibility.spec.ts`.
- Use `useDialogA11y` from `src/lib/dialog-a11y.ts` for any new dialog rather than
  re-implementing Escape, focus trapping and focus restoration.
- Never silence a rule inline. If something genuinely cannot be fixed, add it to
  `SKIPPED_RULES` and explain it here.
