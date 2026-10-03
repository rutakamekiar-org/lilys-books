# ZVY-50: mobile storefront performance

## Status

Implementation and verification in progress on `codex/zvy-50-mobile-performance`.
Do not treat this report as a production pass until the deployment evidence below is complete.

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

The owner's 86-point homepage report is retained as a baseline sample, alongside the 78/98/100 runs.
The first screenshot supplied by the owner is the existing 08:53:43 report, not an additional run.
Homepage scores vary materially. Catalog/product/preorder each have two independent samples.
Later attempts returned new report URLs with identical earlier timestamps and metrics; these cached results
were excluded from sample counts. Do not claim three independent samples for those routes.

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

## Verification

- Local lint, type checking and deterministic fixture validation: passed.
- Production-mode build against the deterministic local API: passed as part of the browser-suite startup.
- Full regression suite: 76 of 78 passed initially. The two failures were existing tests tied to removed icon
  classes; they now assert accessible controls and links. Their rerun, alongside accessibility and all performance
  checks, passed (25 tests). New performance tests passed at desktop, 320 px and 390 px; mobile paper/digital
  selection and invalid checkout tests passed at both mobile widths without any invoice writes.
- Provider preview and repeated after measurements: pending.
- Remote CI and production deployment verification: pending.

## Remaining measured opportunities

- Google flagged 153–166 KiB of unused JavaScript, including first-party client code and Google Analytics.
  Any further dialog/analytics code splitting must preserve cart state, focus restoration and pageview behavior.
  Track separately if the higher-priority image/style fixes produce sufficient gains.
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
| Repeatable representative baselines and prioritized plan | Baseline table, protocol and measured priorities |
| Confirmed bottlenecks fixed with repeated improvement evidence | Implementation described; after measurements pending |
| Lint/type/build/regressions and mobile/desktop purchasing preserved | Local checks/build passed; initial 76/78 plus 25/25 focused rerun after updating the two obsolete assertions |
| Preview/production verification, report links and tracked remainder | Deployment evidence pending; remaining opportunities above |

