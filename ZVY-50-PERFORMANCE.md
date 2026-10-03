# ZVY-50: mobile storefront performance

## Status

Implementation is ready for review in [PR #25](https://github.com/rutakamekiar-org/lilys-books/pull/25)
on `codex/zvy-50-mobile-performance`. CI and the provider preview passed for implementation commit `fd95f19`.
On 2026-10-03 the owner expanded coverage to every public page and deferred deployment because the Netlify
allowance was exhausted: “let's focus on documenting and fixing all pages performance. I will tell you when I can deploy”.
The additional changes are verified locally; their provider preview and production verification remain deferred.
Commits during this pause use `[skip netlify]`; retain that tag in the PR title and final merge/squash message.
GitHub's required verification still runs. No performance improvement is claimed before comparable published after measurements.

## Google field data — 2026-10-03

[Search Console Core Web Vitals](https://search.google.com/search-console/core-web-vitals?resource_id=sc-domain%3Azvychajna.pp.ua) was accessible. Last report update: 2026-10-01.
Both mobile and desktop report insufficient usage data over the last 90 days; their report buttons are disabled.
There are no affected URL groups or field timing/layout metrics available. PageSpeed also reports “No Data”.
This is **unavailable field data**, not a Core Web Vitals pass. Lab improvements cannot establish a field-data pass.

## Production baseline — 2026-10-03

All times are Europe/Kiev (GMT+3). Each report uses mobile mode, an emulated Moto G Power, Lighthouse 13.5.0,
HeadlessChromium 153.0.8010.36, Slow 4G throttling, a single-page session and an initial page load.
FCP/LCP/Speed Index are seconds; TBT is milliseconds; CLS is unitless.

| Route | Time | Score | FCP | LCP | TBT | CLS | Speed Index | Evidence |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| `/` | 08:53 | 98 | 1.1 | 2.3 | 80 | 0.001 | 2.0 | [Run 1](https://pagespeed.web.dev/analysis/https-zvychajna-pp-ua/u4z0f4i0yn?form_factor=mobile) |
| `/` | 08:54 | 78 | 1.1 | 6.2 | 30 | 0.001 | 1.1 | [Run 2](https://pagespeed.web.dev/analysis/https-zvychajna-pp-ua/fzvy2v9xm2?form_factor=mobile) |
| `/` | 09:01 | 100 | 1.1 | 1.5 | 60 | 0 | 1.9 | [Run 3](https://pagespeed.web.dev/analysis/https-zvychajna-pp-ua/v534qn3xl3?form_factor=mobile) |
| `/books` | 08:54 | 82 | 2.4 | 4.1 | 110 | 0 | 3.4 | [Run 4](https://pagespeed.web.dev/analysis/https-zvychajna-pp-ua-books/w0n4hqac7t?form_factor=mobile) |
| `/books` | 09:00 | 85 | 1.8 | 3.3 | 290 | 0 | 2.5 | [Run 5](https://pagespeed.web.dev/analysis/https-zvychajna-pp-ua-books/x096hlcupz?form_factor=mobile) |
| `/books/zvychajna` | 08:54 | 74 | 1.7 | 6.0 | 190 | 0 | 3.3 | [Run 6](https://pagespeed.web.dev/analysis/https-zvychajna-pp-ua-books-zvychajna/vd3ouw2vyo?form_factor=mobile) |
| `/books/zvychajna` | 09:00 | 55 | 4.5 | 8.8 | 280 | 0 | 6.1 | [Run 7](https://pagespeed.web.dev/analysis/https-zvychajna-pp-ua-books-zvychajna/wqw67495o5?form_factor=mobile) |
| `/books/pid_shepit_snihu` | 08:54 | 65 | 4.3 | 7.1 | 50 | 0 | 4.3 | [Run 8](https://pagespeed.web.dev/analysis/https-zvychajna-pp-ua-books-pid_shepit_snihu/6iflpvp7og?form_factor=mobile) |
| `/books/pid_shepit_snihu` | 09:00 | 65 | 4.4 | 6.9 | 120 | 0 | 4.4 | [Run 9](https://pagespeed.web.dev/analysis/https-zvychajna-pp-ua-books-pid_shepit_snihu/84zqkq5ibx?form_factor=mobile) |
| `/` | 09:05 | 86 | 1.1 | 3.8 | 210 | 0.001 | 1.7 | [Run 10](https://pagespeed.web.dev/analysis/https-zvychajna-pp-ua/b1ltmi1nx4?utm_source=search_console&form_factor=mobile&hl=uk) |

| `/about` | 09:32 | 64 | 4.5 | 6.8 | 110 | 0 | 4.5 | [Run 11](https://pagespeed.web.dev/analysis/https-zvychajna-pp-ua-about/qc351zk25u?form_factor=mobile) |
| `/events` | 09:32 | 77 | 1.1 | 6.8 | 60 | 0 | 1.8 | [Run 12](https://pagespeed.web.dev/analysis/https-zvychajna-pp-ua-events/uw2b4lwj1s?form_factor=mobile) |
| `/return-policy` | 09:32 | 83 | 1.1 | 2.5 | 580 | 0 | 1.4 | [Run 13](https://pagespeed.web.dev/analysis/https-zvychajna-pp-ua-return-policy/4dqnf907cp?form_factor=mobile) |
| `/books/inaksha` | 09:32 | 73 | 2.4 | 7.1 | 80 | 0 | 2.5 | [Run 14](https://pagespeed.web.dev/analysis/https-zvychajna-pp-ua-books-inaksha/mvfbzd00yo?form_factor=mobile) |
| `/books/zvychajna-and-inaksha` | 09:32 | 78 | 2.4 | 4.1 | 250 | 0 | 2.4 | [Run 15](https://pagespeed.web.dev/analysis/https-zvychajna-pp-ua-books-zvychajna-and-inaksha/wjhk8hlrz6?form_factor=mobile) |
| `/books/brunette-stories` | 09:32 | 65 | 4.3 | 7.1 | 10 | 0 | 4.4 | [Run 16](https://pagespeed.web.dev/analysis/https-zvychajna-pp-ua-books-brunette-stories/sfhhsxzqj5?form_factor=mobile) |
| `/books/inaksha-art` | 09:32 | 73 | 2.4 | 6.9 | 120 | 0 | 2.7 | [Run 17](https://pagespeed.web.dev/analysis/https-zvychajna-pp-ua-books-inaksha-art/p67irstadv?form_factor=mobile) |
| `/about` | 18:49 | 63 | 4.4 | 7.2 | 180 | 0.05 | 4.4 | [Run 18](https://pagespeed.web.dev/analysis/https-zvychajna-pp-ua-about/6syinn6za2?form_factor=mobile) |
| `/events` | 18:49 | 72 | 1.1 | 6.6 | 180 | 0.092 | 1.9 | [Run 19](https://pagespeed.web.dev/analysis/https-zvychajna-pp-ua-events/z8fq2gi8k5?form_factor=mobile) |
| `/return-policy` | 18:49 | 100 | 1.1 | 1.8 | 40 | 0 | 1.7 | [Run 20](https://pagespeed.web.dev/analysis/https-zvychajna-pp-ua-return-policy/pf0buimwth?form_factor=mobile) |
| `/books/inaksha` | 18:57 | 60 | 4.5 | 8.4 | 160 | 0 | 5.9 | [Run 21](https://pagespeed.web.dev/analysis/https-zvychajna-pp-ua-books-inaksha/o0f9d78kk0?form_factor=mobile) |
| `/books/zvychajna-and-inaksha` | 18:57 | 63 | 4.8 | 7 | 150 | 0 | 4.8 | [Run 22](https://pagespeed.web.dev/analysis/https-zvychajna-pp-ua-books-zvychajna-and-inaksha/tx7zmlek4b?form_factor=mobile) |
| `/books/brunette-stories` | 18:57 | 61 | 4.4 | 7.1 | 230 | 0 | 4.4 | [Run 23](https://pagespeed.web.dev/analysis/https-zvychajna-pp-ua-books-brunette-stories/3hmbx844t6?form_factor=mobile) |
| `/books/inaksha-art` | 18:57 | 87 | 1.1 | 4 | 10 | 0 | 2.1 | [Run 24](https://pagespeed.web.dev/analysis/https-zvychajna-pp-ua-books-inaksha-art/q2wpym779c?form_factor=mobile) |

The owner's 86-point homepage report is retained as a baseline sample, alongside the 78/98/100 runs.
The first screenshot supplied by the owner is the existing 08:53:43 report, not an additional run.
Homepage scores vary materially. Catalog/product/preorder each have two independent samples.
Later attempts returned new report URLs with identical earlier timestamps and metrics; these cached results
were excluded from sample counts. Do not claim three independent samples for those routes.

The expanded audit covers all 11 current public content routes, including all six product URLs, with at least
two independent captures each. Runs 11–24 still show the original icon fonts and lazy product images: they are
baseline samples, not results of the unpublished fixes. About/events/policy report headers retain 18:49;
Google's rounded capture line says 18:50 for About. The same mobile runner profile applies.

| Route | Samples | Score median (range) | FCP median (range) | LCP median (range) | TBT median (range) | CLS median (range) | Speed Index median (range) |
| --- | ---: | --- | --- | --- | --- | --- | --- |
| `/` | 4 | 92 (78–100) | 1.1 (1.1–1.1) | 3.05 (1.5–6.2) | 70 (30–210) | 0.001 (0–0.001) | 1.8 (1.1–2) |
| `/books` | 2 | 83.5 (82–85) | 2.1 (1.8–2.4) | 3.7 (3.3–4.1) | 200 (110–290) | 0 (0–0) | 2.95 (2.5–3.4) |
| `/books/zvychajna` | 2 | 64.5 (55–74) | 3.1 (1.7–4.5) | 7.4 (6–8.8) | 235 (190–280) | 0 (0–0) | 4.7 (3.3–6.1) |
| `/books/pid_shepit_snihu` | 2 | 65 (65–65) | 4.35 (4.3–4.4) | 7 (6.9–7.1) | 85 (50–120) | 0 (0–0) | 4.35 (4.3–4.4) |
| `/about` | 2 | 63.5 (63–64) | 4.45 (4.4–4.5) | 7 (6.8–7.2) | 145 (110–180) | 0.025 (0–0.05) | 4.45 (4.4–4.5) |
| `/events` | 2 | 74.5 (72–77) | 1.1 (1.1–1.1) | 6.7 (6.6–6.8) | 120 (60–180) | 0.046 (0–0.092) | 1.85 (1.8–1.9) |
| `/return-policy` | 2 | 91.5 (83–100) | 1.1 (1.1–1.1) | 2.15 (1.8–2.5) | 310 (40–580) | 0 (0–0) | 1.55 (1.4–1.7) |
| `/books/inaksha` | 2 | 66.5 (60–73) | 3.45 (2.4–4.5) | 7.75 (7.1–8.4) | 120 (80–160) | 0 (0–0) | 4.2 (2.5–5.9) |
| `/books/zvychajna-and-inaksha` | 2 | 70.5 (63–78) | 3.6 (2.4–4.8) | 5.55 (4.1–7) | 200 (150–250) | 0 (0–0) | 3.6 (2.4–4.8) |
| `/books/brunette-stories` | 2 | 63 (61–65) | 4.35 (4.3–4.4) | 7.1 (7.1–7.1) | 120 (10–230) | 0 (0–0) | 4.4 (4.4–4.4) |
| `/books/inaksha-art` | 2 | 80 (73–87) | 1.75 (1.1–2.4) | 5.45 (4–6.9) | 65 (10–120) | 0 (0–0) | 2.4 (2.1–2.7) |

The policy's 40–580 ms TBT range and homepage's 1.5–6.2 s LCP range demonstrate why repeat samples matter.
A single high score does not prove the underlying loading problems are absent.

## Measured priorities and implementation

1. **Product LCP images were lazy.** Google identified the first book and anthology carousel images as LCP,
   with `loading=lazy` and no high fetch priority, despite being discoverable in initial HTML. Their measured
   unthrottled resource-load delays were about 1.79 s and 1.40 s. Product covers now use eager loading and high
   fetch priority. Only the first gallery slide is prioritized; later slides retain lazy loading and deferred mounting.
2. **Blocking icon CSS/fonts on all routes.** A shared stylesheet transferred 26.8 KiB, with about 25 KiB unused.
   Google estimated font-display delays of 140–440 ms and render-blocking savings up to 2.29 s in the observed runs.
   The full Font Awesome stylesheet/font requests are replaced by the same unmodified SVG artwork for used icons.
   Icons remain decorative; accessible names belong to their controls/links. Current API icons (YouTube and book)
   are retained; unsupported/absent decorative icon classes use a link symbol while retaining their labels and URLs.
   Attribution is preserved in `public/icons/fontawesome-LICENSE.txt`.
3. **Catalog image discovery and sizing.** The catalog LCP image was also lazy; the first two cards now use eager,
   high-priority covers. Subsequent cards stay lazy. Responsive sizes match the actual grid breakpoints, including
   the fixed maximum content width. The homepage sizes account for its padding. Smaller 360/480 px candidates
   supplement the provider image configuration; source artwork and quality settings are unchanged.
4. **Event LCP discovery.** Google identified the second event card's Vienna photo as LCP while it was lazy.
   The first image on each of the first two illustrated cards is now eager/high priority; later cards/slides remain lazy.
   Event image sizes now follow the real mobile/tablet/container widths. Additional 1440/1600 px candidates avoid
   the oversized jump from 1200 to 1920 px at tablet pixel densities.
5. **About portrait layout and discovery.** Google attributed 0.050 CLS to the portrait, whose declared 360×540
   dimensions differed from its 960×1280 source recorded in existing image metadata. The declared dimensions now
   reserve the actual 3:4 ratio before decoding. An explicit container width prevents the grid cell collapsing
   before image arrival. Responsive sizes match the two-column layout and mobile padding.
   The portrait remains eager but no longer preloads ahead of the biography text, Google's observed mobile LCP.
6. **Shared initial JavaScript.** Checkout/Nova Poshta code now loads on the first cart visit rather than on every
   initial page view. It stays mounted thereafter to preserve form state and dialog focus behavior. The snowfall
   library loads only when the existing seasonal guard renders it. Winter rendering is covered by a clock-controlled test.
   Analytics and pageview behavior are unchanged; the remaining first-party/third-party JavaScript needs published measurement.
7. **All product sizes.** Single covers and galleries now share sizes matching the actual 190–220 px mobile clamp,
   220–280 px tablet clamp and 340 px desktop cover. No product artwork or quality setting was changed.

| Page family / state | Coverage and remaining gate |
| --- | --- |
| Home, catalog | Existing discovery/sizing fixes; repeated baselines retained; published after comparison deferred |
| All six products, including preorder, bundle and anthology | Shared cover/gallery fixes, two baseline samples per URL, paper/digital/cart/validation regression coverage |
| About | Correct portrait ratio and responsive sizes; delayed-image regression prevents layout-shift recurrence |
| Events | Two leading card photos prioritized; later cards/slides deferred; font removal addresses the audited font-related shifts |
| Return policy | Shared icon and checkout-code savings; two baseline samples retain substantial TBT variation |
| Missing product / 404 | Deterministic initial-content/icon and existing error-path coverage; no representative public PageSpeed claim |
| Cart, checkout and excerpt dialogs | Existing keyboard/accessibility and purchasing tests; checkout first-use loading, validation and focus restored |

ZVY-8 already provided provider image optimization, source compression, image metadata and deferred gallery
mounting; those remain in place. ZVY-47's server-rendered metadata and Product JSON-LD are preserved.

## Repeatable comparison protocol

- Open PageSpeed Insights, enter each representative production route, and explicitly select Mobile.
- Retain report URLs, capture timestamps, Lighthouse/browser versions, throttling mode and all five metrics.
- Collect at least two independent runs per route; aim for three when the service produces fresh results.
  A new URL containing the same earlier capture timestamp/metrics is not a fresh sample.
- Keep provider-preview results separate from production and use the same Google profile for before/after.
- Report every sample plus medians/ranges; compare LCP, FCP, TBT, CLS, image transfer, blocking CSS/fonts and
  unused JavaScript, not just the total score. Do not select only the best run.
- Record whether measurements are cold or warm when known; Google controls its runner and CDN location.
  No forced cold-CDN assumption is made for these remote runs.
- Run navigation, format selection, cart and invalid checkout checks at 320/390 px and desktop.
  Block all invoice writes in preview/production smoke checks.
- Once the owner authorizes deployment again, verify all 11 content URLs with the same profile, retaining at
  least two fresh after captures each and the published commit. Repeat portrait/event layout-shift diagnostics.

## Verification

- Local lint, type checking and deterministic fixture validation: passed.
- Expanded source checks: passed. The 88-test local suite initially passed 82; six failures were two new locator
  mistakes repeated across three viewport projects. Correcting those locators produced a passing 25-test
  performance/image-sizing rerun. The subsequent portrait fix adds three delayed-image checks; the final affected
  rerun passed all 28 tests, including desktop, 320 px and 390 px. It exposed and verified the container-width fix
  as well as the corrected source ratio. The production-mode build passed during that rerun.
- Responsive image verification uses JavaScript-disabled pages at 320/390/640/780/980/1280 px and DPR 1.75,
  checking loaded portraits, event photos and product covers against their rendered widths. Requests preserve
  pixel density without exceeding 1.4 times the needed width. This is sizing evidence, not a Google score comparison.
- Additional local visual check: About at 1280 px retained its two-column layout and loaded the 312×416 px portrait
  without horizontal overflow. Events also loaded its first photos with the expected eager/high versus later lazy
  attributes and no horizontal overflow. Additional mobile evidence comes from the automated 320/390 px projects.
- Production-mode build against the deterministic local API: passed as part of the browser-suite startup.
- Full regression suite: 76 of 78 passed initially. The two failures were existing tests tied to removed icon
  classes; they now assert accessible controls and links. Their rerun, alongside accessibility and all performance
  checks, passed (25 tests). New performance tests passed at desktop, 320 px and 390 px; mobile paper/digital
  selection and invalid checkout tests passed at both mobile widths without any invoice writes.
- Remote CI: [run 37102888123](https://github.com/rutakamekiar-org/lilys-books/actions/runs/37102888123)
  completed successfully for `fd95f1989477eca1d2c17566ad5139b61e4089fc`. Lint, types, fixture validation,
  production build and the complete regression suite passed on the GitHub runner.
- Provider preview: [deploy preview #25](https://deploy-preview-25--astounding-douhua-45280d.netlify.app/),
  [ready deployment 6ac09f59](https://app.netlify.com/projects/astounding-douhua-45280d/deploys/6ac09f59e92ca40008ab4a2e),
  built from the same implementation commit. Verified through the signed-in Netlify browser session on 2026-10-03.
  Checked homepage/catalog at 390 px, anthology at 320 px and desktop at 1280 px. The observed document widths
  excluded the browser scrollbar and matched their scroll widths. Cover images loaded successfully, the first two
  catalog covers were eager/high priority, and the anthology cover was eager/high priority.
  Digital selection showed 199 UAH, paper selection 499 UAH, and the combined cart 698 UAH. Digital checkout
  omitted delivery fields; a cart containing paper added phone and Nova Poshta branch selection. No order was
  submitted. Invalid checkout submission and zero invoice-write assertions are covered by the deterministic tests.
  The injected Netlify preview controls overlapped the checkout button; closing those preview controls allowed
  the storefront checkout to open. This toolbar is specific to the preview environment.
- The preview requires Netlify team authentication. Anonymous Google PageSpeed runs cannot audit this protected
  URL; its access controls remain intact. Comparable Google after measurements will use public production.
- Original report-only CI also passed: [run 37103154830](https://github.com/rutakamekiar-org/lilys-books/actions/runs/37103154830)
  for `f61f302`. Expanded-source CI must be retrieved separately; the older green checks do not cover these edits.
- Production deployment and repeated after measurements: deferred at the owner's request because of Netlify quota.
  The previously verified preview covers the initial implementation, not the additional About/events/checkout/sizing fixes.
  Recheck the published commit and reverify the accumulated changes after the owner restores deployment availability.

## Remaining measured opportunities

- Google flagged 153–166 KiB of unused JavaScript, including first-party client code and Google Analytics.
  Checkout and seasonal code are now deferred. Verify their real transfer/TBT impact after publication, then inspect
  remaining shared providers/dialogs before considering further splitting. Preserve analytics/pageview accuracy.
- Third-party caching has an estimated 10 KiB opportunity. This is controlled by external providers.
- Google flagged 13 KiB of legacy JavaScript. Avoid unsupported framework configuration or dependency upgrades
  solely to suppress that audit.
- Catalog image diagnostics estimated 112 KiB of potential savings. Validate the actual request widths/bytes
  after deployment; retain appropriate pixel density and image quality instead of assuming all estimated savings
  are achievable.
- Sampled unthrottled LCP breakdowns showed TTFB of 10–20 ms. These samples do not establish a server-response
  bottleneck and do not justify backend changes.
- Field data remains unavailable. Search Console may later reflect a rolling period that includes older deployments.

## Acceptance criteria

| Criterion | Evidence / completion gate |
| --- | --- |
| Search Console mobile findings or explicit lack of data | Recorded above; unavailable, no pass claimed |
| Repeatable representative baselines and prioritized plan | 24 captures across all 11 content routes, medians/ranges, protocol and measured priorities |
| Confirmed bottlenecks fixed with repeated improvement evidence | Implementation described; after measurements pending |
| Lint/type/build/regressions and mobile/desktop purchasing preserved | Local checks and focused rerun passed; complete remote CI passed; preview smoke checks above |
| Preview/production verification, report links and tracked remainder | Initial preview verified; additional preview/production and repeated after measurements deferred by owner; remainder recorded above |

## Changed files

- Rendering and image configuration: `next.config.mjs`, `src/app/layout.tsx`, `src/app/books/BooksGrid.tsx`.
- Other pages and seasonal rendering: `src/app/about/page.tsx`, `src/app/about/page.module.css`, `src/app/events/EventsClient.tsx`,
  `src/components/atoms/Snow.tsx`.
- Icon artwork and attribution: `src/components/atoms/Icon.tsx`, `src/components/atoms/Icon.module.css`,
  `public/icons/fontawesome-LICENSE.txt` (new).
- Shared cards and ratings: `src/components/molecules/BookCard.tsx`, `src/components/molecules/GoodreadsButton.tsx`,
  `src/components/molecules/GoodreadsRating.tsx`.
- Product/gallery rendering: `src/components/organisms/BookDetail.tsx`, `src/components/organisms/BookDetail.module.css`,
  `src/components/organisms/ImageCarousel.tsx`, `src/components/organisms/ImageCarousel.module.css`,
  `src/components/organisms/Hero.tsx`.
- Navigation, contacts and cart icons: `src/components/organisms/NavBar.tsx`, `src/components/organisms/Contacts.tsx`,
  `src/components/organisms/ShoppingCart.tsx`.
- Regression coverage: `playwright.config.ts`, `tests/e2e/performance.spec.ts` (new),
  `tests/e2e/image-sizing.spec.ts` (new),
  `tests/e2e/mobile-navigation.spec.ts`, `tests/e2e/accessibility.spec.ts`, `tests/e2e/internal-links.spec.ts`.
- Discoverable evidence: `README.md`, `ZVY-50-PERFORMANCE.md` (new).

