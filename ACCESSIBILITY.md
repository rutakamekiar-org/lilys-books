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

`SKIPPED_RULES` in that file is currently **empty**: nothing is excluded. If a rule ever has
to be turned off, it goes there with a reason recorded below.

## Violations fixed while establishing the baseline

| Rule / problem | Impact | Fix |
| --- | --- | --- |
| `color-contrast` | serious | The brand accent `#f09b30` carried white text at **2.23:1** on the home CTA, buy button, cart checkout button, checkout submit, cart badge and promo apply button, and was used as text colour on the cart total, "Додати в кошик" and the suggestion price. See the palette note below. |
| `color-contrast` | serious | Catalog rows for unavailable formats were dimmed with `opacity: .58`, which pushed their text below the threshold. The row now uses `--muted` (5.74:1) and the opacity applies only to the quick-add button. |
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

## The accent palette

`--accent: #f09b30` cannot carry white text at 4.5:1 — the best it reaches is 2.23:1 — so
`globals.css` adds `--accent-strong: #a8560a`: the same hue, darkened until it passes
(**5.25:1** on white, **4.99:1** on the page background). The split is:

- `--accent-strong` wherever the colour carries text, as a background behind white text or as
  a text colour on a light surface.
- `--accent` for everything decorative: borders, focus rings, `--accent-weak` fills, the
  active navigation outline.

When adding a control that pairs the accent with text, reach for `--accent-strong`.

## Accepted exceptions

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
