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

ZVY-76 follow-up (not yet deployed): the shift is caused by hydration, not image loading or fonts. Event dates
are formatted in the visitor's locale and time zone, so the server renders an empty date. On phones that date
shared the meta line with the location; once filled in after hydration, the line wrapped, the card grew 22 px
and the cards below moved. Locally, with first paint before hydration, Chromium records 0.0849 at 390 px with
the next `hero` article as source, matching Google's figure. Phones now give the date its own reserved line.
`tests/e2e/event-layout.spec.ts` holds scripts and photos, then requires zero layout shifts and unchanged card
boxes at desktop/320/390 px. Deployed captures follow in ZVY-79.

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

## ZVY-75 investigation: remaining LCP render delay and JavaScript costs — 2026-10-23

[ZVY-75](https://linear.app/zvychajna/issue/ZVY-75/investigate-remaining-storefront-lcp-render-delays-and-javascript)
re-examined the residual costs measured on 2026-10-05: product LCP of 5.2–7.4 s, a 1,930 ms cover render delay,
a 1,640 ms home render delay with a priority/discovery opportunity, and 153–166 KiB of unused JavaScript.
Nothing was deployed. Deployed before/after verification belongs to ZVY-79.

### Method and provenance

- 54 mobile runs with the Lighthouse 13.5.0 CLI (Moto G Power emulation), three per route and variant. Every
  metric, LCP element and LCP breakdown is kept in [lab-samples.json](docs/performance/zvy-75/lab-samples.json).
- Two throttling modes:
  - **simulated:** Lantern Slow 4G, the PageSpeed headline method;
  - **devtools:** real 4× CPU and network throttling in the browser, which makes render delays visible in the trace.
- Production (`https://zvychajna.pp.ua`, read-only): `/`, `/books/inaksha` and `/books/brunette-stories`.
  The GA `/g/collect` and Clarity `collect` beacons were blocked, so no pageviews were recorded; the scripts
  still loaded and ran. Production served the same chunk set as `origin/main` 5440f05. PR #55 (zod/mini; lazy
  GA, Clarity and toasts; the one-hour page cache) is therefore already live and is the real baseline.
- For A/B comparison, local production builds ran against the deterministic mock API in three variants: `main`,
  this change, and this change plus `experimental.inlineCss`.
- The anonymous PageSpeed API returned HTTP 429, so no new Google reports were captured. Local numbers can be
  compared with each other, not with Google's runner.

### What changed since the 2026-10-05 evidence

- **The product LCP element is now text, not the cover.** ZVY-60 (132025f, 2026-10-06) made the phone cover a
  112 px thumbnail. Every production mobile product run reports the description block as LCP. The 1,930 ms
  render delay was measured on a cover image in the earlier layout and cannot recur in that form.
- **Unused JavaScript has nearly halved.** Production now reports 95–97 KiB unused: 74–76 KiB in Google Tag
  Manager and 21–22 KiB in the React DOM framework chunk. The ~84–87 KiB of unused first-party code from
  2026-10-05 is gone (zod/mini in PR #55).
  - Initial JavaScript is about 180 KB gzipped. About 130 KB of it is the React/Next.js runtime; the app's own
    chunks are each 1–17 KB.
  - The 112 KB core-js chunk is `noModule`, so modern browsers do not download it.
- GTM (about 188 KiB transferred, 250–290 ms simulated bootup) and Clarity (about 26 KiB, 100–200 ms) now start
  after the load event. They add TBT but no longer compete with LCP.

### Production baseline (median and range, ms)

| Route | Mode | FCP | LCP | TBT | LCP element | LCP render delay |
| --- | --- | --- | --- | --- | --- | --- |
| `/` | simulated | 984 (982–1094) | 2217 (2215–2325) | 146 | hero cover | 40 |
| `/books/inaksha` | simulated | 1090 (981–1101) | 1513 (1500–2052) | 267 | description text | 324 |
| `/books/brunette-stories` | simulated | 1095 (1075–1100) | 1755 (1487–2080) | 263 | description text | 414 |
| `/` | devtools | 2159 (2079–2186) | 2429 (2376–2537) | 956 | hero cover | 50 |
| `/books/inaksha` | devtools | 2172 (2145–2204) | 2172 (2145–2204) | 1080 | description text | 1819 |
| `/books/brunette-stories` | devtools | 2149 (2144–2791) | 2149 (2144–2791) | 1184 | description text | 1772 |

### Causes identified

1. **Product pages download the cover twice at high priority.** Both cover slots are in the HTML, and CSS shows
   one per breakpoint. The phone thumbnail used the API's absolute `imageUrl` (`https://zvychajna.pp.ua/images/...`).
   The desktop carousel used the root-relative `imageUrls[0]`, which is the same file. The optimizer URLs
   therefore differed, and the browser fetched both (13–17 KB each) on every viewport in every production
   product run. Five of the six live products have this shape. On slow connections the duplicate competes with
   the render-blocking CSS and the LCP element.
2. **The home hero's preload had no fetch priority.** `preload` produced a `<link rel=preload>` without
   `fetchpriority=high`, which is the PageSpeed "LCP request discovery" failure. In local runs the request
   sometimes started at Low priority.
3. **Product text render delay comes from CSS and the first layout, not JavaScript.** Devtools traces show no
   app or framework script running before the first paint; React DOM evaluates after FCP. Before that paint, the
   browser waits for three render-blocking stylesheets (about 10 KB). It then runs one layout task of
   283–308 ms (4× throttled) for only 95–134 layout objects.
   - Inlining the CSS removes most of the stylesheet wait (see below).
   - The cost of the first layout is unexplained and may be specific to Chrome's font fallback on Windows.
4. **Document latency varies independently of the code.** Production HTML returns
   `Cache-Control: public,max-age=0,must-revalidate`. Every request reports `"Netlify Edge"; fwd=miss` and is
   served from the durable cache.
   - HTML TTFB from this location was 0.38–0.66 s, against 0.21 s for an edge-cached static chunk.
   - One of 18 Lighthouse runs saw a 2.1 s TTFB (a stale durable entry).
   - In the 2026-10-05 Google samples, FCP split into groups of about 0.9 s and about 2.9 s within the same
     capture minutes across unrelated routes. That pattern matches per-request document latency, not page code.

### Changes

- The product schema (`src/models/Product.ts`) normalizes `imageUrl` and `imageUrls` to root-relative paths
  when API data is parsed, using `storefrontImageSource`, the existing gallery normalizer now exported from
  `src/lib/product-gallery.ts`. Every consumer (product page, hero, catalog cards, cart, suggestion dialog,
  gallery) therefore uses one optimizer URL per file, and the product thumbnail and first carousel slide share
  one download. Open Graph and Product JSON-LD images stay absolute because they are built with `absoluteUrl`
  from the site origin. Images, sizes, alt text and priorities are unchanged, and images that really differ
  still load as before.
- `Hero` uses `loading="eager"` and `fetchPriority="high"` instead of `preload`, as the Next.js 16 image
  documentation recommends. React still emits the preload link, now with `fetchPriority="high"`, and the
  Lighthouse discovery check passes.
- New regression tests in `tests/e2e/performance.spec.ts` run at desktop, 320 px and 390 px:
  - the home hero is eager and high priority in the server HTML (JavaScript disabled);
  - a product whose API data mixes absolute and relative URLs requests its cover exactly once, and its Open Graph
    and JSON-LD images remain absolute. The tests answer optimizer requests locally, so the absolute production
    URL is never fetched.

  With the source changes reverted, both tests fail at all three viewports.

Expected effect: every product landing makes one fewer high-priority request (13–17 KB), and the home hero is
consistently high priority. Local A/B runs show no change to simulated or devtools LCP for the hero. The local
fixtures use matching URLs, so they cannot reproduce the duplicate. The real effect needs the deployed recheck in
ZVY-79.

### Evaluated and rejected

- **`experimental.inlineCss`.** Devtools-throttled LCP improved substantially:
  - product LCP: 1.73–1.84 s → 1.31–1.37 s;
  - home LCP: 1.80 s → 1.64 s;
  - render delay: 300–500 ms → 37–92 ms.

  Simulated (PageSpeed-style) LCP did not improve: home 2.65 s → 2.80 s, product 2.67–3.03 s → 2.86–3.19 s.
  Product HTML grows from 9.5 KB to 34 KB gzipped, because the CSS is inlined in the `<style>` element and
  again in the RSC payload. Returning visitors also lose stylesheet caching. The flag is experimental and the
  evidence is mixed, so this is a follow-up decision rather than part of this change.
- **Forcing AVIF on Netlify.** `next.config.mjs` prefers AVIF, but Netlify Image CDN serves WebP for
  `/_next/image` even when the browser accepts AVIF. With an explicit `fm=avif`, the 640 px hero is 67.5 KB
  against 42.4 KB as WebP, so forcing AVIF would make it larger. The AVIF preference only takes effect under
  local `next start`.
- **Lighthouse "image delivery" savings (29 KiB on the hero).** The audit compares the 640 px file with the
  354 CSS px slot. At the emulated 1.75 DPR the slot needs 620 device px, so a smaller candidate would lower
  pixel density. The estimate cannot be achieved without reducing quality.
- **Deferring or removing GA and Clarity further.** Both already load after `onload`. Deferring them until
  interaction would drop pageviews from visitors who leave without interacting, and replacing gtag.js would
  change the analytics. Their cost is TBT, not LCP.
- **Splitting more app code (cart drawer, providers).** App chunks are 1–17 KB gzipped, and most of the
  remaining unused code is the React DOM runtime and GTM. The expected gain is tens of milliseconds in
  simulation, not enough to justify reworking the ZVY-50 first-cart lazy loading.
- **Legacy JavaScript (13 KiB).** It is inside the React DOM framework chunk, and no supported configuration
  change removes it.
- **Backend changes.** Product data is served from the one-hour page cache. Document latency comes from the
  hosting cache layer, not the product API.

### Proposed follow-ups

- Evaluate inlined critical CSS (`experimental.inlineCss` or a smaller hand-split) on a Netlify preview. It cuts
  throttled render delay by about 0.4 s, but adds about 25 KB of gzipped HTML and showed no simulated
  (PageSpeed-style) gain.
- Investigate Netlify edge caching for cached HTML. Every document request misses the edge, with 0.4–0.7 s
  TTFB and occasional 2 s outliers, against 0.2 s for static assets.
- Find the cause of the 280–310 ms (4× throttled) first layout before FCP. It occurs on every route with about
  100 layout objects; confirm it on Linux/PageSpeed before acting.
- Measure the TBT cost of GA4 and Clarity in field-like conditions, and agree an analytics loading policy with
  the owner that balances main-thread cost against pageview accuracy.

## ZVY-79 deployed verification of the follow-up fixes — 2026-10-23

[ZVY-79](https://linear.app/zvychajna/issue/ZVY-79) rechecks production after ZVY-75 to ZVY-78 went live. It changes no
application code: only this section, the README pointer and the evidence in
[docs/performance/zvy-79](docs/performance/zvy-79) are new. No deploy was triggered.

**Outcome.** All four fixes are live and behave as intended. The two deployed axe failures from 2026-10-05 are
gone, events no longer shift, and every product page requests its cover once. Across 33 fresh PageSpeed
captures, median LCP and score improve on 10 of 11 routes against 2026-10-05. Slow samples (4.8–5.0 s) remain on
four routes. One new finding: product pages show small layout shifts (0.012–0.054 in 8 of 18 Google product
runs). That was not present in the 2026-10-05 samples, so it becomes a follow-up issue. The existing deployed
suite fails 9 phone/gallery tests on locators that predate the ZVY-60 phone layout. Phone-aware equivalents of
the same behaviour pass, and updating the suite is a follow-up. The owner agreed that the protected-preview check is not applicable, because production is the
same build. Search Console still has no field data for either device type (see
[Items that need the owner](#items-that-need-the-owner)), so no field Core Web Vitals pass is claimed.

### Deployment evidence

[Netlify production deploy 6adb23b7](https://app.netlify.com/projects/astounding-douhua-45280d/deploys/6adb23b79e5548a32e3c9d66)
is `ready`, context `production`, branch `main`, commit `e3fa5055b4cbda1bbbcbc455cb2156a794c95047`. It was created
at 09:07:03 UTC and published at 09:07:47.271 UTC on 2026-10-23 (12:07:47 Europe/Kiev, UTC+03:00), after a 41 s
build. The site's `published_deploy` in Netlify's public API is this deploy. The previous production deploy was
6ad51cd1 (`5440f05`, 2026-10-18 19:24:47 UTC). [deployment.json](docs/performance/zvy-79/deployment.json) retains the
provider record. The owner separately confirmed the same deploy ID, commit, 12:07 Kyiv publication and 41 s
deploy, and the previous deploy (`main@5440f05`, 2026-10-18 22:24 Kyiv), matching the provider record.

| Fix | PR | Merge commit | Fix commits | In `e3fa505` |
| --- | --- | --- | --- | --- |
| ZVY-76 event date line | #57 | `f997905` | `7e844b1`, `1bd7fd7` | yes |
| ZVY-78 excerpt keyboard scrolling (test-only PR) | #56 | `fc0163a` | source fix `132025f` (ZVY-60), already live since `5440f05` | yes |
| ZVY-75 single cover request, hero priority | #58 | `ab81939` | `3847cd8`, `2679eb1` | yes |
| ZVY-77 catalog alt, event link names | #59 | `e3fa505` | `153eee4` | yes |

The deployed HTML and chunks were checked directly at 09:10 UTC:

- **Catalog:** all six `/books` card covers render `alt=""`.
- **Event links:** each link reads "Перейти" plus a visually hidden " до події: <title>", for Brno, Vienna and
  Krakow. The shared `aria-label` is gone.
- **Home hero:** the `<img>` has `fetchPriority="high" loading="eager"`, and its image preload link also carries
  `fetchPriority="high"`.
- **Product pages:** the HTML contains only the root-relative cover URL. All 18 Google product runs request
  exactly one cover.
- **Event dates:** the events CSS reserves the phone date line
  (`.heroBelowDate{min-height:1.4em;line-height:1.4;display:block}`).
- **Excerpt:** the excerpt chunk renders the body as `role="region"`, `aria-label="Текст уривку"`, `tabIndex:0`.

### PageSpeed method and provenance

- **Runner:** Google PageSpeed Insights web UI, Mobile. Lighthouse 13.5.0 on HeadlessChrome 153.0.8010.36,
  emulated Moto G Power (2022) at 412×823 and DPR 1.75. Simulated throttling: 150 ms RTT, 1,638 kbps, CPU
  multiplier 1.2. Initial page load, single-page session. Benchmark index 464.5–1,314 across runs.
- **Same profile as before:** this is the Lighthouse version and runner profile used on 2026-10-03 and 2026-10-05.
- **Protocol:** three rounds over all 11 routes, one route at a time, between 09:12:19 and 09:23:37 UTC. Captures of the
  same route are 2.3–6.3 minutes apart.
- **No cached repeats:** every capture has its own Lighthouse `fetchTime`, later than the publication time, and
  none repeats another. Nothing had to be excluded.
- **Field data:** CrUX returned "record not found" for every URL and the origin, so there is no field data.
- **CDN:** Google's runner location and CDN temperature are unknown. In our own requests, HTML came from Netlify's
  durable cache with `Netlify Edge; fwd=miss`, as in ZVY-75. Google's observed server response was 2–79 ms
  (median 11 ms).
- **Overlap:** round 3 overlapped the single-worker deployed Playwright suite. That traffic came from our network,
  not Google's runner.
- **Units:** the tables use PageSpeed's displayed values, as the earlier evidence did. FCP, LCP and Speed Index
  are in seconds, TBT in ms, CLS is unitless. Capture times are Lighthouse `fetchTime` in Europe/Kiev.
- **Retained data:** [mobile-samples.json](docs/performance/zvy-79/mobile-samples.json) keeps the UTC capture
  times, the displayed report-header creation times, precise numeric metrics, user agents and throttling.

### Fresh samples

| Route | Capture (Kiev) | Score | FCP | LCP | TBT | CLS | Speed Index | Evidence |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| `/` | 12:12:19 | 96 | 0.9 | 2.1 | 130 | 0.001 | 3.9 | [Run 1](https://pagespeed.web.dev/analysis/https-zvychajna-pp-ua/zfy59psaym?form_factor=mobile) |
| `/` | 12:18:35 | 94 | 0.9 | 2.8 | 160 | 0.001 | 1.7 | [Run 2](https://pagespeed.web.dev/analysis/https-zvychajna-pp-ua/7z0e23q5lh?form_factor=mobile) |
| `/` | 12:22:02 | 77 | 1.4 | 4.9 | 190 | 0 | 4.2 | [Run 3](https://pagespeed.web.dev/analysis/https-zvychajna-pp-ua/ply57f3f6u?form_factor=mobile) |
| `/books` | 12:14:08 | 96 | 1.2 | 2.3 | 140 | 0 | 3 | [Run 4](https://pagespeed.web.dev/analysis/https-zvychajna-pp-ua-books/0de2dzlzla?form_factor=mobile) |
| `/books` | 12:18:52 | 78 | 1.4 | 5 | 110 | 0 | 4.7 | [Run 5](https://pagespeed.web.dev/analysis/https-zvychajna-pp-ua-books/covxcrqpej?form_factor=mobile) |
| `/books` | 12:22:18 | 100 | 0.9 | 1.9 | 20 | 0 | 0.9 | [Run 6](https://pagespeed.web.dev/analysis/https-zvychajna-pp-ua-books/3n3cqylp86?form_factor=mobile) |
| `/about` | 12:15:52 | 99 | 0.9 | 1.1 | 100 | 0 | 1.2 | [Run 7](https://pagespeed.web.dev/analysis/https-zvychajna-pp-ua-about/i0x1kdoteu?form_factor=mobile) |
| `/about` | 12:19:01 | 100 | 0.9 | 1.4 | 50 | 0 | 0.9 | [Run 8](https://pagespeed.web.dev/analysis/https-zvychajna-pp-ua-about/x3646eavnh?form_factor=mobile) |
| `/about` | 12:22:29 | 97 | 0.9 | 2 | 160 | 0 | 0.9 | [Run 9](https://pagespeed.web.dev/analysis/https-zvychajna-pp-ua-about/jglrs7shob?form_factor=mobile) |
| `/events` | 12:16:35 | 100 | 0.9 | 1.4 | 90 | 0 | 0.9 | [Run 10](https://pagespeed.web.dev/analysis/https-zvychajna-pp-ua-events/tl9o31goxu?form_factor=mobile) |
| `/events` | 12:19:11 | 93 | 0.9 | 2.6 | 220 | 0 | 2.4 | [Run 11](https://pagespeed.web.dev/analysis/https-zvychajna-pp-ua-events/lbc9vn0tnl?form_factor=mobile) |
| `/events` | 12:22:37 | 97 | 0.9 | 2.5 | 110 | 0 | 0.9 | [Run 12](https://pagespeed.web.dev/analysis/https-zvychajna-pp-ua-events/1j9lezz13s?form_factor=mobile) |
| `/return-policy` | 12:16:43 | 99 | 0.9 | 1.7 | 120 | 0 | 1.5 | [Run 13](https://pagespeed.web.dev/analysis/https-zvychajna-pp-ua-return-policy/4fw3f59c5e?form_factor=mobile) |
| `/return-policy` | 12:19:20 | 96 | 0.9 | 1.2 | 210 | 0 | 0.9 | [Run 14](https://pagespeed.web.dev/analysis/https-zvychajna-pp-ua-return-policy/8qc185itr3?form_factor=mobile) |
| `/return-policy` | 12:22:44 | 99 | 1.5 | 1.8 | 20 | 0 | 2.7 | [Run 15](https://pagespeed.web.dev/analysis/https-zvychajna-pp-ua-return-policy/e4i3k1shhq?form_factor=mobile) |
| `/books/zvychajna` | 12:16:53 | 96 | 0.9 | 1.3 | 220 | 0.033 | 0.9 | [Run 16](https://pagespeed.web.dev/analysis/https-zvychajna-pp-ua-books-zvychajna/s41bgxe00o?form_factor=mobile) |
| `/books/zvychajna` | 12:19:37 | 92 | 1.4 | 3 | 140 | 0 | 2.6 | [Run 17](https://pagespeed.web.dev/analysis/https-zvychajna-pp-ua-books-zvychajna/17i8tjh92b?form_factor=mobile) |
| `/books/zvychajna` | 12:23:03 | 77 | 1.4 | 4.9 | 190 | 0 | 4.1 | [Run 18](https://pagespeed.web.dev/analysis/https-zvychajna-pp-ua-books-zvychajna/qy9yfw8g90?form_factor=mobile) |
| `/books/inaksha` | 12:13:10 | 93 | 1.2 | 2.9 | 130 | 0 | 2.8 | [Run 19](https://pagespeed.web.dev/analysis/https-zvychajna-pp-ua-books-inaksha/h2gnj37pmk?form_factor=mobile) |
| `/books/inaksha` | 12:18:43 | 96 | 1.2 | 2 | 170 | 0 | 2.7 | [Run 20](https://pagespeed.web.dev/analysis/https-zvychajna-pp-ua-books-inaksha/epxmyqnjk5?form_factor=mobile) |
| `/books/inaksha` | 12:22:11 | 94 | 1.2 | 2.9 | 50 | 0 | 3 | [Run 21](https://pagespeed.web.dev/analysis/https-zvychajna-pp-ua-books-inaksha/zesfik6fa8?form_factor=mobile) |
| `/books/zvychajna-and-inaksha` | 12:17:25 | 99 | 0.9 | 1.2 | 120 | 0.012 | 1.2 | [Run 22](https://pagespeed.web.dev/analysis/https-zvychajna-pp-ua-books-zvychajna-and-inaksha/u0r4dwqxu4?form_factor=mobile) |
| `/books/zvychajna-and-inaksha` | 12:19:46 | 94 | 1.5 | 2.9 | 80 | 0 | 2.7 | [Run 23](https://pagespeed.web.dev/analysis/https-zvychajna-pp-ua-books-zvychajna-and-inaksha/c2f6bvg4hg?form_factor=mobile) |
| `/books/zvychajna-and-inaksha` | 12:23:11 | 97 | 0.9 | 1.2 | 190 | 0.012 | 0.9 | [Run 24](https://pagespeed.web.dev/analysis/https-zvychajna-pp-ua-books-zvychajna-and-inaksha/nftf97mcwc?form_factor=mobile) |
| `/books/pid_shepit_snihu` | 12:17:34 | 98 | 0.9 | 1.6 | 150 | 0.036 | 1.6 | [Run 25](https://pagespeed.web.dev/analysis/https-zvychajna-pp-ua-books-pid_shepit_snihu/eg1wooscyp?form_factor=mobile) |
| `/books/pid_shepit_snihu` | 12:19:55 | 98 | 0.9 | 1.3 | 160 | 0.036 | 0.9 | [Run 26](https://pagespeed.web.dev/analysis/https-zvychajna-pp-ua-books-pid_shepit_snihu/s2hqd4zkn9?form_factor=mobile) |
| `/books/pid_shepit_snihu` | 12:23:21 | 92 | 0.9 | 2.8 | 210 | 0.036 | 2.2 | [Run 27](https://pagespeed.web.dev/analysis/https-zvychajna-pp-ua-books-pid_shepit_snihu/w4vu8l74ec?form_factor=mobile) |
| `/books/brunette-stories` | 12:17:43 | 95 | 0.9 | 2.8 | 30 | 0.054 | 2.5 | [Run 28](https://pagespeed.web.dev/analysis/https-zvychajna-pp-ua-books-brunette-stories/uj5ukuphmd?form_factor=mobile) |
| `/books/brunette-stories` | 12:20:04 | 98 | 0.9 | 1.6 | 150 | 0.054 | 1.3 | [Run 29](https://pagespeed.web.dev/analysis/https-zvychajna-pp-ua-books-brunette-stories/9c015an6gj?form_factor=mobile) |
| `/books/brunette-stories` | 12:23:29 | 79 | 1.5 | 4.8 | 130 | 0 | 4 | [Run 30](https://pagespeed.web.dev/analysis/https-zvychajna-pp-ua-books-brunette-stories/6e3e8vcdwu?form_factor=mobile) |
| `/books/inaksha-art` | 12:17:52 | 97 | 0.9 | 1.2 | 190 | 0 | 1.9 | [Run 31](https://pagespeed.web.dev/analysis/https-zvychajna-pp-ua-books-inaksha-art/ckkw9ks44k?form_factor=mobile) |
| `/books/inaksha-art` | 12:20:13 | 95 | 1.2 | 2.7 | 90 | 0 | 2.5 | [Run 32](https://pagespeed.web.dev/analysis/https-zvychajna-pp-ua-books-inaksha-art/xjo34i80ud?form_factor=mobile) |
| `/books/inaksha-art` | 12:23:37 | 100 | 0.9 | 1.5 | 20 | 0 | 0.9 | [Run 33](https://pagespeed.web.dev/analysis/https-zvychajna-pp-ua-books-inaksha-art/fzctq1hol0?form_factor=mobile) |

### Medians and ranges — 2026-10-23

Each cell is the median, with the range in brackets. The 2026-10-03 and 2026-10-05 tables are in the
[ZVY-51 section](#zvy-51-deployed-verification--2026-10-05).

| Route | n | Score | FCP | LCP | TBT | CLS | Speed Index |
| --- | ---: | --- | --- | --- | --- | --- | --- |
| `/` | 3 | 94 (77–96) | 0.9 (0.9–1.4) | 2.8 (2.1–4.9) | 160 (130–190) | 0.001 (0–0.001) | 3.9 (1.7–4.2) |
| `/books` | 3 | 96 (78–100) | 1.2 (0.9–1.4) | 2.3 (1.9–5) | 110 (20–140) | 0 (0–0) | 3 (0.9–4.7) |
| `/about` | 3 | 99 (97–100) | 0.9 (0.9–0.9) | 1.4 (1.1–2) | 100 (50–160) | 0 (0–0) | 0.9 (0.9–1.2) |
| `/events` | 3 | 97 (93–100) | 0.9 (0.9–0.9) | 2.5 (1.4–2.6) | 110 (90–220) | 0 (0–0) | 0.9 (0.9–2.4) |
| `/return-policy` | 3 | 99 (96–99) | 0.9 (0.9–1.5) | 1.7 (1.2–1.8) | 120 (20–210) | 0 (0–0) | 1.5 (0.9–2.7) |
| `/books/zvychajna` | 3 | 92 (77–96) | 1.4 (0.9–1.4) | 3 (1.3–4.9) | 190 (140–220) | 0 (0–0.033) | 2.6 (0.9–4.1) |
| `/books/inaksha` | 3 | 94 (93–96) | 1.2 (1.2–1.2) | 2.9 (2–2.9) | 130 (50–170) | 0 (0–0) | 2.8 (2.7–3) |
| `/books/zvychajna-and-inaksha` | 3 | 97 (94–99) | 0.9 (0.9–1.5) | 1.2 (1.2–2.9) | 120 (80–190) | 0.012 (0–0.012) | 1.2 (0.9–2.7) |
| `/books/pid_shepit_snihu` | 3 | 98 (92–98) | 0.9 (0.9–0.9) | 1.6 (1.3–2.8) | 160 (150–210) | 0.036 (0.036–0.036) | 1.6 (0.9–2.2) |
| `/books/brunette-stories` | 3 | 95 (79–98) | 0.9 (0.9–1.5) | 2.8 (1.6–4.8) | 130 (30–150) | 0.054 (0–0.054) | 2.5 (1.3–4) |
| `/books/inaksha-art` | 3 | 97 (95–100) | 0.9 (0.9–1.2) | 1.5 (1.2–2.7) | 90 (20–190) | 0 (0–0) | 1.9 (0.9–2.5) |

### Comparison with 2026-10-03 and 2026-10-05

Medians, in order Oct 3 → Oct 5 → **Oct 23**. Oct 3 has 2–4 samples per route, and Oct 5 and Oct 23 have 3 each.

| Route | LCP Oct 3 → Oct 5 → Oct 23 (median) | TBT | CLS | Speed Index | Score |
| --- | --- | --- | --- | --- | --- |
| `/` | 3.05 → 2.5 → **2.8** | 70 → 160 → **160** | 0.001 → 0.001 → **0.001** | 1.8 → 1.9 → **3.9** | 92 → 95 → **94** |
| `/books` | 3.7 → 2.6 → **2.3** | 200 → 140 → **110** | 0 → 0 → **0** | 2.95 → 1.9 → **3** | 83.5 → 94 → **96** |
| `/about` | 7 → 5.1 → **1.4** | 145 → 50 → **100** | 0.025 → 0 → **0** | 4.45 → 3.1 → **0.9** | 63.5 → 76 → **99** |
| `/events` | 6.7 → 2.9 → **2.5** | 120 → 40 → **110** | 0.046 → 0.085 → **0** | 1.85 → 4.1 → **0.9** | 74.5 → 91 → **97** |
| `/return-policy` | 2.15 → 1.9 → **1.7** | 310 → 250 → **120** | 0 → 0 → **0** | 1.55 → 1 → **1.5** | 91.5 → 94 → **99** |
| `/books/zvychajna` | 7.4 → 5.6 → **3** | 235 → 230 → **190** | 0 → 0 → **0** | 4.7 → 3.3 → **2.6** | 64.5 → 73 → **92** |
| `/books/inaksha` | 7.75 → 7 → **2.9** | 120 → 110 → **130** | 0 → 0 → **0** | 4.2 → 5.2 → **2.8** | 66.5 → 67 → **94** |
| `/books/zvychajna-and-inaksha` | 5.55 → 2.5 → **1.2** | 200 → 200 → **120** | 0 → 0 → **0.012** | 3.6 → 1.8 → **1.2** | 70.5 → 79 → **97** |
| `/books/pid_shepit_snihu` | 7 → 2.5 → **1.6** | 85 → 120 → **160** | 0 → 0 → **0.036** | 4.35 → 1.2 → **1.6** | 65 → 95 → **98** |
| `/books/brunette-stories` | 7.1 → 5.4 → **2.8** | 120 → 150 → **130** | 0 → 0 → **0.054** | 4.4 → 1.1 → **2.5** | 63 → 79 → **95** |
| `/books/inaksha-art` | 5.45 → 2.6 → **1.5** | 65 → 190 → **90** | 0 → 0 → **0** | 2.4 → 1.1 → **1.9** | 80 → 94 → **97** |

Pooled over all 33 samples, Oct 5 → Oct 23:

| Metric | Oct 5 median (range) | Oct 23 median (range) |
| --- | --- | --- |
| Score | 80 (63–99) | 96 (77–100) |
| FCP (s) | 0.9 (0.9–3.1) | 0.9 (0.9–1.5) |
| LCP (s) | 2.9 (1.6–7.4) | 2.0 (1.1–5.0) |
| TBT (ms) | 150 (20–920) | 130 (20–220) |
| CLS | 0 (0–0.085) | 0 (0–0.054) |
| Speed Index (s) | 1.9 (1–5.6) | 1.9 (0.9–4.7) |

| Sample count | Oct 5 | Oct 23 |
| --- | ---: | ---: |
| LCP ≤ 2.5 s | 11 | 20 |
| LCP > 4 s | 16 | 4 |
| FCP ≥ 2.5 s | 14 | 0 |
| Score < 90 | 17 | 4 |

**Interpretation, with limits.**

- **Improvements:** median LCP is lower on 10 of 11 routes, and median score is higher on 10 of 11 (home 95 → 94).
  - The 2026-10-05 slow cluster (FCP about 2.9 s, LCP 5–7.4 s) does not recur. The slowest FCP is now 1.5 s.
  - The largest product changes are Inaksha 7 → 2.9 s, Звичайна 5.6 → 3 s and Brunette 5.4 → 2.8 s.
- **Home is the exception:** median LCP is 2.5 → 2.8 s and median Speed Index 1.9 → 3.9 s. The ranges overlap
  (LCP 2.3–6.4 s before, 2.1–4.9 s now), so this is not a demonstrated regression.
- **Slow runs remain:** four runs reached LCP 4.8–5.0 s with FCP 1.4–1.5 s and Speed Index 4.0–4.7 s, on `/`,
  `/books`, `/books/zvychajna` and `/books/brunette-stories`. Each of those routes also has a fast run.
  - Benchmark index (465–708) and server response time (2–48 ms) do not separate the slow runs from the fast ones.
- **TBT:** median TBT rises on `/about` (50 → 100 ms), `/events` (40 → 110 ms), Inaksha (110 → 130 ms) and the snow
  anthology (120 → 160 ms). It is unchanged on home and falls on six routes. Every range overlaps the earlier one.
- **No single cause:** both deploys changed several things at once (ZVY-60, PR #54/#55, ZVY-75 to ZVY-78), and
  Google's runner and CDN state are not controlled. With three samples per route, the gains cannot be credited to
  any one change.

### Diagnostics

[diagnostics.json](docs/performance/zvy-79/diagnostics.json) lists, for each of the 33 runs, the LCP element and its
phases, layout shifts, render-blocking CSS, unused JavaScript, third parties and every image request with its
priority. The phase breakdown comes from Lighthouse's observed (unthrottled) trace. It is kept apart from the
simulated Slow 4G headline LCP and does not add up to it.

- **Product covers:** every product run requests its cover once, at High priority, 256 px wide at Google's 412 px
  / DPR 1.75 viewport (13–17 KB). There is no second absolute-URL request any more (ZVY-75).
- **Home hero:** the hero is the LCP element in all three runs. It is High priority, 640 px (42 KB), and
  Lighthouse's LCP-discovery check passes in every run.
  - Observed phases vary a lot between runs: resource load delay 2,055 / 471 / 316 ms and render delay
    20 / 56 / 2,112 ms.
  - The slowest home run (4.9 s) is the one with the 2.1 s render delay.
- **Catalog:** the first two covers are `fetchpriority=high`, the rest lazy (360 px candidates at Google's DPR).
- **Events:** the leading images of the first two galleries are High priority and the third gallery's is Low,
  as designed.
- **Portrait:** the deployed suite confirms the portrait keeps its 4:3 box while its image is held back, at
  desktop, 320 px and 390 px.
- **Product LCP:** the LCP element is the description text on every product run except the art cards. Art cards
  report the footer, because that page has no long description.
  - Observed product render delay is 161–2,351 ms. Before the first paint, three render-blocking stylesheets
    (7.8–10.7 KiB in total) load.
  - This matches the CSS and first-layout cause described in ZVY-75. No new cause was found.
- **Event layout shifts:** CLS is 0 in all three Google events runs, down from 0.085 / 0 / 0.085 on 2026-10-05.
  On a normal production load at desktop, 320 px and 390 px, full Chromium records no `layout-shift` entries on
  `/events`. The ZVY-76 fix holds in production.
- **New: product layout shifts.**
  - **Google:** 8 of 18 product runs report CLS 0.012–0.054 (Звичайна 0.033 once, bundle 0.012 twice, snow
    anthology 0.036 three times, Brunette 0.054 twice). The shifting nodes are the phone `coverActions`
    (Goodreads link) and the `specs` section. Inaksha and the art cards report 0.
  - **Our reproduction:** on normal loads, full Chromium records 0.012–0.031 at 320 px and 0.012–0.082 at 390 px
    on the same four products. Desktop shows ≤0.007. The shifts land 0.3–1.2 s after navigation, and the same
    nodes move up.
  - **Likely cause (not tested here):** the server renders the description expanded, then the hydrated
    overflow measurement in `BookDetail` collapses it and adds "Читати далі ↓". That moves everything below the
    description.
  - **Not attributed to this deploy:** that code predates 2026-10-05, but ZVY-60 (2026-10-06) moved the
    description and specs into the first phone viewport. The previous production deploy is behind Netlify
    protection, so it could not be compared. All values are below the 0.1 "good" CLS threshold. Brunette at
    390 px (0.082) is close to it, and this is new against the 2026-10-05 evidence, which had zero product CLS.
- **First-use checkout code:** checkout delivery code ("Відділення Нової Пошти") is absent from the initial
  `/return-policy` chunks and arrives on first cart use, at all three widths.
- **JavaScript and analytics:**
  - Unused JavaScript is 89.8–100.3 KiB per run: Google Tag Manager 68–79 KiB and the React DOM chunk about
    21 KiB.
  - GTM transfers 194–196 KiB with 115–357 ms of main-thread time. Clarity transfers about 27 KiB with
    26–91 ms.
  - Script bootup is 285–1,037 ms (simulated).
  - This is unchanged from ZVY-75. Analytics cost remains TBT, not LCP. No icon fonts are requested on any
    route or width.

### Live smoke checks

[smoke-checks.json](docs/performance/zvy-79/smoke-checks.json) keeps every test outcome, error, route evidence
attachment and invoice-safety attachment.

- **Safety:** every context blocked service workers and aborted any non-GET `/api/invoice` request. No customer
  details were entered, and checkout stopped at empty-form validation. Across 90 invoice-safety attachments,
  **zero invoice writes were attempted**.
- **Existing deployed suite** (`performance-verification`, unchanged): run 09:21:48–09:26:31 UTC at desktop
  1280×720, 320×720 and 390×844. **42 passed, 7 failed, 2 timed out.**
  - **Passed at all three widths:**
    - all 11 route checks: status, no document overflow, image delivery, no icon fonts, metadata, canonical
      URLs, Product JSON-LD, and axe with only the contrast exception;
    - the desktop cart, checkout and mixed-cart tests;
    - first-use checkout code;
    - portrait and event priority.
  - **Gallery test, 3 failures:** the test expects one `<img>` for the art card in the server HTML. Since ZVY-60
    the phone thumbnail and the first carousel slide are both in the HTML and share one URL, so it finds two.
    Both are the first image (`inaksha-art6.png`), and no other gallery image is an `<img>` in the HTML. This is a
    stale assertion, not a delivery regression. Because the test stopped there, its excerpt and gallery steps
    did not run in this suite.
  - **Phone cart tests, 4 failures at 320 and 390 px:** they failed only at their last step. They look for the
    focused opener by the name /Купити/, but on phones that CTA becomes "Переглянути кошик" once the item is in
    the cart. Every earlier step passed: cart and checkout axe, focus trap, quantity rule, invalid-checkout
    errors and delivery fields.
  - **Phone mixed-cart tests, 2 timeouts at 320 and 390 px:** they wait for a desktop-only "Додати в кошик"
    button.
- **ZVY-79 phone-aware checks**
  ([zvy79-extra-checks.spec.ts.txt](docs/performance/zvy-79/zvy79-extra-checks.spec.ts.txt), run once from
  `tests/deployment` and not committed there): **all behaviour passes at desktop, 320 px and 390 px.**
  - **Cart and checkout, paper and digital:** focus trap, quantity rule, invalid validation, phone and Nova Poshta
    fields only for paper, Escape, and focus back on the same CTA element that opened the cart.
  - **Mixed cart:** the total equals paper + digital; the physical item's quantity changes and returns to one;
    digital has no quantity control.
  - **Gallery:** the server HTML has one image file; the next slide is `loading=lazy` and loads. Phones open the
    image viewer first.
  - **Loaded excerpt:** after the real `zvychajna.html` response, the region is reachable with Tab and has
    `tabIndex` 0. PageDown/ArrowDown scroll it by 544–652 px, axe reports zero violations, and Escape returns
    focus to «Читати уривок».
  - **First run:** the first run had 3 failures caused by the check's own locators: it read the excerpt before the
    loading text cleared, and on phones it looked for an inline next button. After correcting them, the 6
    affected tests passed (6/6).
- **Cutover suite** (`cutover`, unchanged): **10 passed, 17 skipped by design**, as on 2026-10-05. It covers
  TLS/HSTS, `www` redirect, API health and CORS, robots and sitemap, product metadata and JSON-LD, invalid
  checkout without an invoice, branded non-indexable error pages, and phone navigation and cart.

Screenshots, inspected visually:
[home 390](docs/performance/zvy-79/screenshots/home-390.jpg),
[catalog 320](docs/performance/zvy-79/screenshots/catalog-320.jpg),
[product 390](docs/performance/zvy-79/screenshots/product-390.jpg),
[portrait desktop](docs/performance/zvy-79/screenshots/about-desktop.jpg),
[events 390](docs/performance/zvy-79/screenshots/events-390.jpg) and
[events 320](docs/performance/zvy-79/screenshots/events-320.jpg). On phones the event date and time sit on their
own line under the title.

### Accessibility

axe ran with the existing tags (WCAG 2.0–2.2 A/AA and best practice). Only `color-contrast`, the documented brand
exception, was skipped, and no rule was added.

- **Pages and dialogs:** zero violations on all 11 routes at desktop, 320 px and 390 px, and on the paper and
  digital cart, checkout and invalid-checkout dialogs at all three widths.
- **`image-redundant-alt` (catalog):** gone. A targeted scan of `/books` reports no `image-redundant-alt`,
  `image-alt` or `link-name` violation, and all six covers have `alt=""`.
- **`scrollable-region-focusable` (loaded excerpt):** gone. The loaded excerpt scans clean at all three widths
  and scrolls by keyboard.
- **Event links, checked separately:** the accessible names are "Перейти до події: Презентація «Звичайної» в
  Брно / у Відні / у Кракові". The visible "Перейти" starts each name (label-in-name). The links are no longer
  identical, which answers Google's earlier identical-link-purpose warning.

### SEO

Checked on production with server-rendered HTML:

- **Metadata:** every route has a non-empty title and description and the expected canonical URL, without a
  trailing slash for `/`.
- **Product JSON-LD:** each of the six products has exactly one Product record, with its canonical URL and UAH
  offers.
- **robots.txt and sitemap:** `robots.txt` allows all crawlers and names `https://zvychajna.pp.ua/sitemap.xml`.
  The sitemap lists the 11 public routes.
- **Missing pages:** an unknown product and an unknown page both return 404 with the branded «Сторінку не
  знайдено» title and `noindex`.
- **Redirects:** `/books?v=3` permanently redirects (308) to `/books`. `http://` and `www` redirect with 301.

### Items that need the owner

- **Protected Netlify preview: not applicable (criteria change agreed by the owner on 2026-10-23).** There is no
  matching deploy preview, because PRs #56–#59 were all `[skip netlify]` and Netlify built none. The production
  deploy 6adb23b7 is the build of `e3fa505`, and it was verified directly above. The owner agreed that a preview
  check adds nothing for an already deployed revision. The protected deploy permalink was neither opened nor sent
  to Google, and Netlify protection is unchanged.
- **Search Console Core Web Vitals: field data unavailable.** The owner signed in and the report for the domain
  property `sc-domain:zvychajna.pp.ua` was read on 2026-10-23. It was last updated on 2026-10-21. Mobile and desktop
  both show «Даних про використання за останні 90 днів недостатньо для цього типу пристрою»: there is not enough
  usage data in the last 90 days for that device type. Neither has URL groups or status counts. PageSpeed likewise
  shows no CrUX field data for any URL or for the origin. [search-console.json](docs/performance/zvy-79/search-console.json)
  records this. The lab results above do not establish a field Core Web Vitals pass, and none is claimed.

### Acceptance criteria

| # | Criterion | Result | Evidence / remaining work |
| --- | --- | --- | --- |
| 1 | Deployment evidence and fix-to-revision mapping; fixes present in deployed HTML | **Pass** | Deploy 6adb23b7, `e3fa505`, published 12:07:47 Kyiv, confirmed by the provider and the owner. All four fixes are ancestors of that commit and were seen in the live HTML, CSS and JS. |
| 2 | At least 2 fresh, independent PageSpeed Mobile captures per route, compared with Oct 3 and Oct 5 | **Pass** | 33 captures (3 per route), none cached, full provenance kept. Medians and ranges are compared above; median LCP is lower on 10 of 11 routes. Slow runs (4.8–5.0 s) remain. |
| 3 | Diagnostics: images and priority, render-blocking, portrait, event shifts, checkout code, JS and analytics | **Pass, with a new finding** | Single cover request, hero discovery passes, events CLS 0, portrait stable, checkout code deferred, JS and analytics as in ZVY-75. New product-page CLS (0.012–0.054) goes to a follow-up. |
| 4 | Live smoke checks at desktop, 320 px and 390 px, read-only | **Pass (behaviour); the existing suite needs an update** | All behaviour passes with zero invoice attempts. The unchanged `performance-verification` suite fails 9 phone and gallery tests on locators that predate ZVY-60; this goes to a follow-up. |
| 5 | axe on the representative pages and loaded dialogs; the two deployed failures gone; event link names | **Pass** | Zero violations apart from the contrast exception. `image-redundant-alt` and `scrollable-region-focusable` are gone. Each event link has its own name that includes the visible label. |
| 6 | SEO: metadata, canonical URLs, JSON-LD, robots, sitemap, 404 | **Pass** | Route checks and the cutover suite pass (10 passed, 17 skipped by design). |
| 7a | Matching protected Netlify preview check | **Not applicable (agreed criteria change)** | No deploy preview exists for `[skip netlify]` PRs #56–#59; production is the same build, verified directly. The owner agreed on 2026-10-23. |
| 7b | Search Console Core Web Vitals availability | **Pass (documented as unavailable)** | Report last updated 2026-10-21: not enough 90-day usage data on mobile or desktop, and no URL groups. No CrUX data in PageSpeed. No field pass is claimed. |
| 8 | Discoverable repository report with a per-criterion outcome, follow-ups and Linear drafts | **Pass** | This section, the README pointer and [docs/performance/zvy-79](docs/performance/zvy-79). |

### Proposed follow-up issues

- **Stabilize product-page layout when the description collapses after hydration.** Google records CLS of
  0.012–0.054 on four product pages (up to 0.082 at 390 px locally). The shifting nodes are the Goodreads link
  and the specs. Product CLS was 0 on 2026-10-05.
- **Update the deployed verification suite for the phone CTA and dual cover slots.** Nine
  `performance-verification` tests fail on locators that predate ZVY-60. The suite therefore no longer runs its
  phone cart, mixed-cart, gallery and loaded-excerpt steps unaided. `zvy79-extra-checks.spec.ts.txt` contains
  working phone-aware versions.

The ZVY-75 proposals still apply and are not repeated as new evidence: inlined critical CSS, Netlify edge caching
for HTML, the expensive first layout, and an analytics loading policy. The remaining 4.8–5.0 s runs, the high
observed product render delay and the home Speed Index variation fit those items.

### Draft Linear comments

**ZVY-79**

> Production verification of ZVY-75 to ZVY-78 is done. The report is the ZVY-79 section of
> `ZVY-50-PERFORMANCE.md`, and the raw data is in `docs/performance/zvy-79`.
>
> - Deploy `6adb23b79e5548a32e3c9d66` (main@e3fa505), published 2026-10-23 12:07 Kyiv. All four fixes are in that
>   revision and in the live HTML.
> - **PageSpeed:** 33 fresh Mobile captures, 3 per route, none cached. Pooled median score 80 → 96 and LCP
>   2.9 → 2.0 s against Oct 5. Median LCP is lower on 10 of 11 routes; home is 2.5 → 2.8 s, with overlapping
>   ranges. Four runs still reach 4.8–5.0 s LCP.
> - **Accessibility:** axe is clean on all routes and dialogs at desktop, 320 px and 390 px, apart from the
>   contrast exception. `image-redundant-alt` and `scrollable-region-focusable` are gone, and event links are
>   named per event. Events CLS is 0.
> - **Smoke checks:** cart, checkout, validation, focus trap, Escape and focus restoration, gallery and excerpt
>   keyboard scrolling all pass at 3 widths, with zero invoice attempts.
> - **SEO:** passes.
> - **Protected preview:** not applicable, a criteria change agreed by the owner. No deploy preview exists
>   because PRs #56–#59 were `[skip netlify]`, and production is the same build, verified directly.
> - **Search Console (read 2026-10-23, last updated 2026-10-21):** not enough 90-day usage data on mobile or
>   desktop, and no URL groups. PageSpeed has no field data either. No field Core Web Vitals pass is claimed.
> - **Follow-ups:** (1) product-page layout shift after hydration (CLS 0.012–0.054 in Google, new since Oct 5);
>   (2) update the deployed verification suite for the ZVY-60 phone layout (9 tests fail on stale locators).

**ZVY-51**

> The deployed recheck of the ZVY-51 gates is complete; see ZVY-79.
>
> - **Accessibility:** the two deployed axe failures (catalog `image-redundant-alt`, loaded-excerpt
>   `scrollable-region-focusable`) are fixed in production, and purchasing, dialogs, validation and SEO pass
>   safely. That criterion is now met.
> - **Preview gate:** replaced by direct verification of production deploy 6adb23b7, a criteria change the owner
>   agreed on 2026-10-23.
> - **Field data:** still unavailable. Search Console (last updated 2026-10-21) reports not enough 90-day usage
>   data on mobile and desktop, and PageSpeed has none. This is documented; no field Core Web Vitals pass is
>   claimed.
>
> With that recorded, ZVY-51 can be closed. Remaining performance work is tracked as follow-ups, not as ZVY-51
> gates.
