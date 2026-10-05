# ZVY-50: mobile storefront performance

## Status

Implementation merged in [PR #25](https://github.com/rutakamekiar-org/lilys-books/pull/25),
commit `34f900babe7391159256be9a1e7cf8d01dabdd3d`. CI and the initial provider preview passed for implementation commit `fd95f19`.
On 2026-10-03 the owner expanded coverage to every public page and deferred deployment because the Netlify
allowance was exhausted: “let's focus on documenting and fixing all pages performance. I will tell you when I can deploy”.
The additional changes passed local checks and the complete required GitHub validation. Their deployment
verification moved to [ZVY-51](https://linear.app/zvychajna/issue/ZVY-51/verify-deployed-zvy-50-storefront-performance-fixes).
Production publication and 33 fresh mobile captures were verified on 2026-10-05; see the
[deployed verification below](#zvy-51-deployed-verification--2026-10-05). Median LCP improved on all routes,
with substantial remaining variation, event CLS and accessibility failures. The all-checks-pass gate remains open.
Evidence/test-only commits retain `[skip netlify]`; GitHub's required verification still runs.

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
  for `f61f302`.
- Expanded-source CI: [run 37135604796](https://github.com/rutakamekiar-org/lilys-books/actions/runs/37135604796)
  completed successfully for `714be2e1f5c084ed7cc8f2bdac209cf7626cf742`; lint, types, fixtures, production build
  and the complete browser regression suite passed. The earlier local failures are resolved; the final pipeline is green.
- Deployment skip observation: Netlify built [preview 6ac127e6](https://app.netlify.com/projects/astounding-douhua-45280d/deploys/6ac127e6b724b800082d8fb1)
  for `714be2e` despite the commit's `[skip netlify]`. Its deployment record used the untagged PR title;
  this preview was not published to production. The owner added the PR-title marker before the final report push.
  Do not treat the commit marker alone as a verified deployment pause, and check the next provider result.
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
| Lint/type/build/regressions and mobile/desktop purchasing preserved | Local checks and 28 affected tests passed; expanded complete remote CI passed; initial preview and additional local desktop checks above |
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


## ZVY-51 deployed verification — 2026-10-05

The published fixes are present and measurable. All 11 routes have three fresh Google mobile captures,
using the same runner profile as the 24-sample baseline. Median LCP is lower on every route, but slow
samples remain, event layout shifts persist, and four routes have higher median TBT. **The all-checks-pass
acceptance criterion is not met:** deployed catalog and loaded-excerpt accessibility scans fail.
No application optimization or accessibility fix is included in this verification issue.

### Deployment and provider preview

[Netlify production deploy 6ac3422b](https://app.netlify.com/projects/astounding-douhua-45280d/deploys/6ac3422b5d734b73866ddeb6)
is `ready`, context `production`, published 2026-10-05 at 06:23:13.530 UTC / 09:23:13.530 Europe/Kiev.
The published commit is `b4f8d3b2860df044bb72bcdb9c13bf3eb1ca9e5d`; the merged fix commit is its ancestor.
This confirms publication independently of the merge. No deploy was triggered by this task.

[Matching preview 6ac127e6](https://app.netlify.com/projects/astounding-douhua-45280d/deploys/6ac127e6b724b800082d8fb1)
is `ready`, context `deploy-preview`, commit `714be2e1f5c084ed7cc8f2bdac209cf7626cf742`, with no production
publication timestamp. Its `src/` and `next.config.mjs` diff against the published commit is empty.
The earlier authenticated browser session opened its homepage successfully. Expanded preview smoke checks
were not completed: the resumed browser session reaches Netlify team protection. Protection remains intact;
Google was only sent to the public production domain. Production smoke results below must not be attributed
to the protected preview. [deployment.json](docs/performance/zvy-51/deployment.json) retains the provider evidence.

### Measurement provenance and limits

All after reports were collected through Google PageSpeed Insights Mobile on 2026-10-05, with Lighthouse
13.5.0, HeadlessChromium 153.0.8010.36, emulated Moto G Power, Slow 4G, initial load and a single-page session.
CDN temperature is unknown. The same Google profile and runner configuration were used for the baseline.
FCP/LCP/Speed Index are seconds, TBT milliseconds, CLS unitless and score 0–100.

The table uses Google's actual Lighthouse capture line, displayed to the minute, in Europe/Kiev (UTC+03:00).
Exact report-header creation times are separately retained in
[mobile-samples.json](docs/performance/zvy-51/mobile-samples.json); they are not substituted for capture times.
Eight new URLs repeated older captures and precise calculator metrics and were excluded. Their links and
exclusion reason remain in that file. Fresh replacements brought every route to three independent captures.
Displayed metrics are used consistently for both dates. All samples contribute to the medians/ranges.

### Fresh after samples

| Route | Capture time | Score | FCP | LCP | TBT | CLS | Speed Index | Evidence |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| `/` | 09:37 | 95 | 0.9 | 2.5 | 160 | 0.001 | 1.9 | [After 1](https://pagespeed.web.dev/analysis/https-zvychajna-pp-ua/p9ilp1fs77?form_factor=mobile) |
| `/` | 09:40 | 67 | 2.9 | 6.4 | 170 | 0 | 4.6 | [After 2](https://pagespeed.web.dev/analysis/https-zvychajna-pp-ua/393rln86m2?form_factor=mobile) |
| `/` | 09:41 | 98 | 0.9 | 2.3 | 110 | 0.001 | 1.6 | [After 3](https://pagespeed.web.dev/analysis/https-zvychajna-pp-ua/ms123cq3k9?form_factor=mobile) |
| `/books` | 09:38 | 98 | 0.9 | 2.1 | 140 | 0 | 1.7 | [After 4](https://pagespeed.web.dev/analysis/https-zvychajna-pp-ua-books/v13mujyikb?form_factor=mobile) |
| `/books` | 09:40 | 94 | 0.9 | 2.6 | 180 | 0 | 1.9 | [After 5](https://pagespeed.web.dev/analysis/https-zvychajna-pp-ua-books/bz36wkvqjn?form_factor=mobile) |
| `/books` | 09:45 | 75 | 2.9 | 5.1 | 110 | 0 | 3.1 | [After 6](https://pagespeed.web.dev/analysis/https-zvychajna-pp-ua-books/29hv687xoj?form_factor=mobile) |
| `/about` | 09:38 | 94 | 0.9 | 2 | 250 | 0 | 1.4 | [After 7](https://pagespeed.web.dev/analysis/https-zvychajna-pp-ua-about/40e7n2aimf?form_factor=mobile) |
| `/about` | 09:40 | 75 | 3.1 | 5.1 | 40 | 0 | 3.4 | [After 8](https://pagespeed.web.dev/analysis/https-zvychajna-pp-ua-about/tyye0dpx0l?form_factor=mobile) |
| `/about` | 09:41 | 76 | 2.8 | 5.1 | 50 | 0 | 3.1 | [After 9](https://pagespeed.web.dev/analysis/https-zvychajna-pp-ua-about/nhcr1ixerf?form_factor=mobile) |
| `/events` | 09:38 | 91 | 0.9 | 2.9 | 20 | 0.085 | 4.6 | [After 10](https://pagespeed.web.dev/analysis/https-zvychajna-pp-ua-events/2wwwcpnef1?form_factor=mobile) |
| `/events` | 09:40 | 99 | 0.9 | 2 | 100 | 0 | 1.1 | [After 11](https://pagespeed.web.dev/analysis/https-zvychajna-pp-ua-events/jsk9npamzk?form_factor=mobile) |
| `/events` | 09:45 | 71 | 2.8 | 5.5 | 40 | 0.085 | 4.1 | [After 12](https://pagespeed.web.dev/analysis/https-zvychajna-pp-ua-events/gidrlmg4b2?form_factor=mobile) |
| `/return-policy` | 09:38 | 94 | 0.9 | 1.9 | 280 | 0 | 1 | [After 13](https://pagespeed.web.dev/analysis/https-zvychajna-pp-ua-return-policy/5gen5o2eam?form_factor=mobile) |
| `/return-policy` | 09:40 | 76 | 3 | 4.6 | 170 | 0 | 3.1 | [After 14](https://pagespeed.web.dev/analysis/https-zvychajna-pp-ua-return-policy/uxttoshu0b?form_factor=mobile) |
| `/return-policy` | 09:45 | 95 | 0.9 | 1.6 | 250 | 0 | 1 | [After 15](https://pagespeed.web.dev/analysis/https-zvychajna-pp-ua-return-policy/ilvwrylii3?form_factor=mobile) |
| `/books/zvychajna` | 09:38 | 63 | 2.9 | 7.4 | 230 | 0 | 4.9 | [After 16](https://pagespeed.web.dev/analysis/https-zvychajna-pp-ua-books-zvychajna/r0747592iy?form_factor=mobile) |
| `/books/zvychajna` | 09:40 | 73 | 2.8 | 5.6 | 130 | 0 | 3.3 | [After 17](https://pagespeed.web.dev/analysis/https-zvychajna-pp-ua-books-zvychajna/9zkam4gs2z?form_factor=mobile) |
| `/books/zvychajna` | 09:45 | 92 | 0.9 | 2.7 | 250 | 0 | 1 | [After 18](https://pagespeed.web.dev/analysis/https-zvychajna-pp-ua-books-zvychajna/eyx46lpbnl?form_factor=mobile) |
| `/books/inaksha` | 09:38 | 67 | 2.9 | 7 | 70 | 0 | 5.3 | [After 19](https://pagespeed.web.dev/analysis/https-zvychajna-pp-ua-books-inaksha/idix923z90?form_factor=mobile) |
| `/books/inaksha` | 09:40 | 67 | 2.9 | 7 | 110 | 0 | 5.2 | [After 20](https://pagespeed.web.dev/analysis/https-zvychajna-pp-ua-books-inaksha/oqd9h41i73?form_factor=mobile) |
| `/books/inaksha` | 09:45 | 95 | 0.9 | 2.7 | 150 | 0 | 1 | [After 21](https://pagespeed.web.dev/analysis/https-zvychajna-pp-ua-books-inaksha/1c22e60q2r?form_factor=mobile) |
| `/books/zvychajna-and-inaksha` | 09:38 | 75 | 3.1 | 4.9 | 110 | 0 | 3.3 | [After 22](https://pagespeed.web.dev/analysis/https-zvychajna-pp-ua-books-zvychajna-and-inaksha/vgdfbcv8ht?form_factor=mobile) |
| `/books/zvychajna-and-inaksha` | 09:40 | 79 | 0.9 | 1.7 | 920 | 0 | 1.8 | [After 23](https://pagespeed.web.dev/analysis/https-zvychajna-pp-ua-books-zvychajna-and-inaksha/zm959bbwop?form_factor=mobile) |
| `/books/zvychajna-and-inaksha` | 09:41 | 94 | 0.9 | 2.5 | 200 | 0 | 1.3 | [After 24](https://pagespeed.web.dev/analysis/https-zvychajna-pp-ua-books-zvychajna-and-inaksha/d33wv5y13e?form_factor=mobile) |
| `/books/pid_shepit_snihu` | 09:38 | 97 | 0.9 | 2.5 | 80 | 0 | 1.2 | [After 25](https://pagespeed.web.dev/analysis/https-zvychajna-pp-ua-books-pid_shepit_snihu/kzxe9119b4?form_factor=mobile) |
| `/books/pid_shepit_snihu` | 09:40 | 68 | 2.9 | 7 | 120 | 0 | 4.8 | [After 26](https://pagespeed.web.dev/analysis/https-zvychajna-pp-ua-books-pid_shepit_snihu/xcip6by5zz?form_factor=mobile) |
| `/books/pid_shepit_snihu` | 09:45 | 95 | 0.9 | 2.5 | 160 | 0 | 1 | [After 27](https://pagespeed.web.dev/analysis/https-zvychajna-pp-ua-books-pid_shepit_snihu/xzq162nrhe?form_factor=mobile) |
| `/books/brunette-stories` | 09:38 | 80 | 0.9 | 5.4 | 60 | 0 | 1.1 | [After 28](https://pagespeed.web.dev/analysis/https-zvychajna-pp-ua-books-brunette-stories/mw1xolff20?form_factor=mobile) |
| `/books/brunette-stories` | 09:40 | 65 | 2.9 | 7.4 | 160 | 0 | 5.6 | [After 29](https://pagespeed.web.dev/analysis/https-zvychajna-pp-ua-books-brunette-stories/smvm1tjdno?form_factor=mobile) |
| `/books/brunette-stories` | 09:45 | 79 | 0.9 | 5.2 | 150 | 0 | 1.1 | [After 30](https://pagespeed.web.dev/analysis/https-zvychajna-pp-ua-books-brunette-stories/cdvuyw9aj7?form_factor=mobile) |
| `/books/inaksha-art` | 09:38 | 64 | 3.1 | 6.9 | 200 | 0 | 5.4 | [After 31](https://pagespeed.web.dev/analysis/https-zvychajna-pp-ua-books-inaksha-art/wms557ybgz?form_factor=mobile) |
| `/books/inaksha-art` | 09:40 | 94 | 0.9 | 2.6 | 190 | 0 | 1.1 | [After 32](https://pagespeed.web.dev/analysis/https-zvychajna-pp-ua-books-inaksha-art/8iqxt7yz4n?form_factor=mobile) |
| `/books/inaksha-art` | 09:45 | 95 | 0.9 | 2.6 | 180 | 0 | 1 | [After 33](https://pagespeed.web.dev/analysis/https-zvychajna-pp-ua-books-inaksha-art/l4z6syy5fk?form_factor=mobile) |

### Before medians and ranges — 2026-10-03

| Route | Samples | Score median (range) | FCP median (range) | LCP median (range) | TBT median (range) | CLS median (range) | Speed Index median (range) |
| --- | ---: | --- | --- | --- | --- | --- | --- |
| `/` | 4 | 92 (78–100) | 1.1 (1.1–1.1) | 3.05 (1.5–6.2) | 70 (30–210) | 0.001 (0–0.001) | 1.8 (1.1–2) |
| `/books` | 2 | 83.5 (82–85) | 2.1 (1.8–2.4) | 3.7 (3.3–4.1) | 200 (110–290) | 0 (0–0) | 2.95 (2.5–3.4) |
| `/about` | 2 | 63.5 (63–64) | 4.45 (4.4–4.5) | 7 (6.8–7.2) | 145 (110–180) | 0.025 (0–0.05) | 4.45 (4.4–4.5) |
| `/events` | 2 | 74.5 (72–77) | 1.1 (1.1–1.1) | 6.7 (6.6–6.8) | 120 (60–180) | 0.046 (0–0.092) | 1.85 (1.8–1.9) |
| `/return-policy` | 2 | 91.5 (83–100) | 1.1 (1.1–1.1) | 2.15 (1.8–2.5) | 310 (40–580) | 0 (0–0) | 1.55 (1.4–1.7) |
| `/books/zvychajna` | 2 | 64.5 (55–74) | 3.1 (1.7–4.5) | 7.4 (6–8.8) | 235 (190–280) | 0 (0–0) | 4.7 (3.3–6.1) |
| `/books/inaksha` | 2 | 66.5 (60–73) | 3.45 (2.4–4.5) | 7.75 (7.1–8.4) | 120 (80–160) | 0 (0–0) | 4.2 (2.5–5.9) |
| `/books/zvychajna-and-inaksha` | 2 | 70.5 (63–78) | 3.6 (2.4–4.8) | 5.55 (4.1–7) | 200 (150–250) | 0 (0–0) | 3.6 (2.4–4.8) |
| `/books/pid_shepit_snihu` | 2 | 65 (65–65) | 4.35 (4.3–4.4) | 7 (6.9–7.1) | 85 (50–120) | 0 (0–0) | 4.35 (4.3–4.4) |
| `/books/brunette-stories` | 2 | 63 (61–65) | 4.35 (4.3–4.4) | 7.1 (7.1–7.1) | 120 (10–230) | 0 (0–0) | 4.4 (4.4–4.4) |
| `/books/inaksha-art` | 2 | 80 (73–87) | 1.75 (1.1–2.4) | 5.45 (4–6.9) | 65 (10–120) | 0 (0–0) | 2.4 (2.1–2.7) |

### After medians and ranges — 2026-10-05

| Route | Samples | Score median (range) | FCP median (range) | LCP median (range) | TBT median (range) | CLS median (range) | Speed Index median (range) |
| --- | ---: | --- | --- | --- | --- | --- | --- |
| `/` | 3 | 95 (67–98) | 0.9 (0.9–2.9) | 2.5 (2.3–6.4) | 160 (110–170) | 0.001 (0–0.001) | 1.9 (1.6–4.6) |
| `/books` | 3 | 94 (75–98) | 0.9 (0.9–2.9) | 2.6 (2.1–5.1) | 140 (110–180) | 0 (0–0) | 1.9 (1.7–3.1) |
| `/about` | 3 | 76 (75–94) | 2.8 (0.9–3.1) | 5.1 (2–5.1) | 50 (40–250) | 0 (0–0) | 3.1 (1.4–3.4) |
| `/events` | 3 | 91 (71–99) | 0.9 (0.9–2.8) | 2.9 (2–5.5) | 40 (20–100) | 0.085 (0–0.085) | 4.1 (1.1–4.6) |
| `/return-policy` | 3 | 94 (76–95) | 0.9 (0.9–3) | 1.9 (1.6–4.6) | 250 (170–280) | 0 (0–0) | 1 (1–3.1) |
| `/books/zvychajna` | 3 | 73 (63–92) | 2.8 (0.9–2.9) | 5.6 (2.7–7.4) | 230 (130–250) | 0 (0–0) | 3.3 (1–4.9) |
| `/books/inaksha` | 3 | 67 (67–95) | 2.9 (0.9–2.9) | 7 (2.7–7) | 110 (70–150) | 0 (0–0) | 5.2 (1–5.3) |
| `/books/zvychajna-and-inaksha` | 3 | 79 (75–94) | 0.9 (0.9–3.1) | 2.5 (1.7–4.9) | 200 (110–920) | 0 (0–0) | 1.8 (1.3–3.3) |
| `/books/pid_shepit_snihu` | 3 | 95 (68–97) | 0.9 (0.9–2.9) | 2.5 (2.5–7) | 120 (80–160) | 0 (0–0) | 1.2 (1–4.8) |
| `/books/brunette-stories` | 3 | 79 (65–80) | 0.9 (0.9–2.9) | 5.4 (5.2–7.4) | 150 (60–160) | 0 (0–0) | 1.1 (1.1–5.6) |
| `/books/inaksha-art` | 3 | 94 (64–95) | 0.9 (0.9–3.1) | 2.6 (2.6–6.9) | 190 (180–200) | 0 (0–0) | 1.1 (1–5.4) |

### Improvement assessment

Observed median LCP changes include homepage 3.05→2.5 s, catalog 3.7→2.6 s, bundle 5.55→2.5 s,
snow anthology 7→2.5 s and art cards 5.45→2.6 s. About improves 7→5.1 s and its CLS is zero in all three
after samples. These repeated measurements support median improvements, while overlapping ranges and
unknown CDN conditions prevent assigning every gain to one source change.

Remaining loading costs are material. Inaksha has two 7 s samples (median 7 s, down from 7.75 s); Brunette
remains 5.2–7.4 s (median 5.4 s). Homepage still includes a 6.4 s run. Bundle's 1.7 s LCP run has 920 ms TBT.
Median TBT rises on homepage 70→160 ms, snow 85→120 ms, Brunette 120→150 ms and art 65→190 ms; bundle
stays 200 ms. Speed Index rises on homepage 1.8→1.9 s, events 1.85→4.1 s and Inaksha 4.2→5.2 s.
The higher total scores therefore do not establish universal improvement.

Events CLS is 0.085, 0, 0.085 (median 0.085 versus baseline 0.046). Google attributes 0.085 to the Vienna
hero. Ranges overlap (before 0–0.092, after 0–0.085), so the median increase is recorded without claiming a
proven new regression. Layout shifts remain unresolved and have a separate fix issue.

### Image, font, layout and JavaScript diagnostics

[diagnostics.json](docs/performance/zvy-51/diagnostics.json) retains detailed values and report links.
The live product covers and leading catalog images are eager/high priority. Actual requested widths include
product 256 px at 320/390 px and 360 px on desktop; catalog 256 px at all three sizes, for rendered widths
141/176/253 px. Event leading images request 360/384/1080 px for rendered 294/364/1066 px. Portrait requests
360 px for rendered 264/320/312 px. These are DPR-1 Playwright observations; Google uses its own device pixel
density. Image candidate buckets and DPR matter when interpreting the estimated 29 KiB product or 74 KiB
event savings. The report does not claim perfectly minimal transfers or recommend lowering image quality blindly.

No icon fonts are requested on any of the 33 route/viewport checks. Google's residual blocking CSS is about
9.9–10.7 KiB over three requests in inspected reports; the old Font Awesome sheet/fonts are absent.
Checkout delivery code is absent initially and arrives on first cart use. Initial art-gallery HTML contains only
the first image; navigation loads later slides lazily. The portrait reserves its correct 4:3 height/width ratio
before and after a deliberately delayed image at desktop/320/390 px. Event priorities pass, but do not eliminate CLS.

Google's detailed unthrottled product LCP breakdown includes 330 ms resource delay and 1930 ms render delay;
home includes 250 ms resource delay and 1640 ms render delay. These are not the simulated Slow 4G headline
LCP values. Sampled TTFB is 10–60 ms in these breakdowns and does not establish a backend cause.
Estimated unused JavaScript remains roughly 153–166 KiB; the inspected home includes 86.3 KiB first-party and
76.9 KiB Google Tag Manager estimates. Google transfers about 193 KiB with 210 ms main-thread work, Clarity
about 28 KiB with 57 ms. Residual rendering, CSS and analytics costs require separate investigation.

### Storefront checks and accessibility findings

[smoke-checks.json](docs/performance/zvy-51/smoke-checks.json) retains every final test outcome, all 33 route
image/layout captures and all 51 invoice-safety attachments. The separate deployed suite finished
**45 passed, 6 failed, 0 skipped** at desktop 1280×720, 320×720 and 390×844. The six failures are two
accessibility findings repeated across all three projects; no rules were added to the accepted contrast exception.

Layout checks have no document horizontal overflow. The narrow navigation intentionally scrolls horizontally;
the existing cutover check verifies every link and cart control remains reachable. Paper/digital selection,
live-price mixed-cart totals, physical quantity floor, digital quantity one, delivery-field differences, empty
validation, cart/checkout focus trapping, Escape/restoration and deferred checkout code pass at all three sizes.
Gallery next-slide loading and loaded-excerpt focus trapping/Escape/restoration also pass, independently of the
excerpt accessibility scan. The test waits for the excerpt response and paragraph, avoiding a false pass on
its loading state. No real customer details are entered. Invoice writes are intercepted; **zero were attempted**.

Server-rendered title/description/canonical checks pass on every route, and all six products retain one Product
JSON-LD record with the canonical URL and UAH offers. The existing cutover suite passed 10 checks with 17
intentional project skips, including TLS/HSTS/redirect, health/CORS, robots/sitemap, SEO, invalid checkout and
branded non-indexable missing-product/404 pages. The deterministic local suite passed all 91 tests and its
production-mode build against the local mock API. Final lint, type checking and four fixture validations pass.
Local fixture passes do not override production-content failures:

* Catalog: `image-redundant-alt` (minor best-practice rule) on cover/title links for Brunette, art and snow.
* Loaded excerpt: `scrollable-region-focusable` (serious keyboard-access rule) on its overflowing text region,
  which has `tabIndex=-1`. The dialog can trap/restore focus while its reading area remains inaccessible to keyboard scrolling.
* Separately, Google gives an unscored identical-link-purpose warning for generic event-link labels. Axe event
  scans pass; this warning is not counted among the six axe failures.

Representative screenshots were visually inspected:
[home 390](docs/performance/zvy-51/screenshots/home-390.jpg),
[catalog 320](docs/performance/zvy-51/screenshots/catalog-320.jpg),
[product 390](docs/performance/zvy-51/screenshots/product-390.jpg),
[portrait desktop](docs/performance/zvy-51/screenshots/about-desktop.jpg),
[events 390](docs/performance/zvy-51/screenshots/events-390.jpg).

To repeat the explicit deployed verification, without changing the production-independent default suite:

```powershell
$env:CUTOVER_BASE_URL = 'https://zvychajna.pp.ua'
npm run test:cutover -- performance-verification
```

It should continue failing on unresolved deployed accessibility issues. A protected preview requires its
authorized browser session and is not a Google test target. Keep `[skip netlify]` on this evidence/test-only PR
and its eventual squash commit; another deployment is unnecessary for these files.

### Current Search Console field data

[Search Console](https://search.google.com/search-console/core-web-vitals?resource_id=sc-domain%3Azvychajna.pp.ua)
was rechecked on 2026-10-05; the last report update is 2026-10-03. Mobile and desktop still have insufficient
usage over the preceding 90 days, disabled report buttons and no URL groups. PageSpeed also reports No Data.
[search-console.json](docs/performance/zvy-51/search-console.json) records this unavailability.
Neither an immediate lab improvement nor absent field groups establishes a Core Web Vitals pass.

### Acceptance criteria and follow-ups

| Criterion | Result | Evidence / remaining work |
| --- | --- | --- |
| Published fixes and matching preview | Partial | Production publication/ancestry and matching preview runtime provenance verified; authenticated preview home checked. Expanded protected-preview smoke remains outstanding. |
| Repeated comparable mobile captures | Met | 33 fresh after captures, 24 baseline samples, all six metrics and medians/ranges above; eight cached duplicates excluded. |
| Purchasing, dialogs, validation, SEO and accessibility pass safely | Not met | Purchasing/SEO/focus checks pass with zero invoice attempts; catalog and loaded-excerpt axe failures require fixes and deployed rechecks. |
| Layout/image/font/JavaScript diagnostics and linked conclusions | Met | Retained diagnostics, portrait tests, event CLS and residual costs; separate fix issues below. |
| Field results or unavailable data documented | Met | Current mobile/desktop field data unavailable, with no unsupported pass claim. |
| Discoverable repository report and linked issue outcome | Met | README, report, JSON evidence and screenshots; the review PR is linked from ZVY-51. |

Separate implementation issues:

* [ZVY-75](https://linear.app/zvychajna/issue/ZVY-75/investigate-remaining-storefront-lcp-render-delays-and-javascript): residual LCP/rendering, CSS, JavaScript/analytics and image audit estimates.
* [ZVY-76](https://linear.app/zvychajna/issue/ZVY-76/stabilize-event-card-layout-during-initial-image-loading): reproduce and stabilize event-card shifts.
* [ZVY-77](https://linear.app/zvychajna/issue/ZVY-77/resolve-deployed-catalog-redundant-image-alternatives-and-review-event): catalog image alternatives and event-link labels.
* [ZVY-78](https://linear.app/zvychajna/issue/ZVY-78/make-the-loaded-excerpt-scrolling-region-accessible-by-keyboard): loaded-excerpt keyboard scrolling access.

ZVY-51 remains open: neither its accessibility pass requirement nor its expanded preview check is waived.
Review of this evidence can proceed independently of implementing those separate fixes.
