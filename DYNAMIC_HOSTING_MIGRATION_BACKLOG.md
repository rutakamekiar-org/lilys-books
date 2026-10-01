# Dynamic hosting migration backlog

This document records the migration decision, dependency order, acceptance criteria, and production rollback plan. Linear is the source of truth for live task status; the corresponding issues are ZVY-5 through ZVY-12 and ZVY-43.

- Decision status: accepted on 2026-09-04
- Selected host: Netlify Free
- Alternative: Cloudflare Workers Free
- Current production host: Netlify, cut over on 2026-09-16 at 21:42 UTC.

The Netlify Free commercial-use terms and 300-credit monthly limit recorded at the migration decision were accepted for the initial low-traffic launch. Verify the actual account allowance during the billing review. Usage must be monitored because exhausting the allowance can pause the site until the next billing cycle or a plan upgrade.

The application was completed and validated on the Netlify deployment URL
before production traffic moved. `zvychajna.pp.ua` was cut over only after
HOST-2, HOST-3, HOST-5, HOST-6, and HOST-7 were complete and HOST-8's checkout,
SEO, mobile, and error-state checks passed. The recorded GitHub Pages DNS values
remain the rollback target. Application regressions can be rolled back by
publishing the previous successful Netlify deploy; hosting or domain failures
can be rolled back by restoring the recorded GitHub Pages DNS values.

## HOST-1 / ZVY-5 — Select the dynamic hosting provider

- Status: Complete
- Priority: Urgent
- Estimate: 1 point
- Decision: Netlify Free (accepted 2026-09-04)

### Description

Select a host that can run the Next.js App Router dynamically. Netlify is the default recommendation because it supports SSR, ISR, on-demand revalidation, route handlers, and `next/image` without a custom runtime adapter. Cloudflare Workers is the alternative if lower operating cost and edge execution are worth additional adapter work and tighter CPU limits.

### Acceptance criteria

- The provider is explicitly selected.
- Commercial-use eligibility and free-tier limits are accepted.
- The custom-domain and rollback approach are documented.
- No DNS or production deployment changes are made as part of this issue.

## HOST-2 / ZVY-6 — Convert the frontend from static export to a Next.js runtime

- Priority: Urgent
- Estimate: 3 points
- Blocked by: HOST-1

### Description

Remove the GitHub Pages static-export assumptions. Remove `output: "export"`, static base-path detection, and the global `images.unoptimized` setting. Keep environment-specific API configuration and make local, preview, and production builds work without GitHub Pages behavior.

### Acceptance criteria

- `next build` produces a runtime-compatible application rather than `out/` as the production artifact.
- Static asset and internal navigation URLs work locally and in provider previews.
- `next/image` optimization is enabled on the selected host.
- The application passes lint, type checking, and a production build.

## HOST-3 / ZVY-7 — Make product pages dynamic and SEO-safe

- Priority: Urgent
- Estimate: 5 points
- Blocked by: HOST-2

### Description

Allow a backend product to receive a working `/books/[slug]` page without rebuilding the whole site. Remove the static-only route restriction and fetch product data by slug. Use ISR or cached server rendering so product HTML, metadata, canonical tags, and structured data are generated on the server.

### Acceptance criteria

- A newly created backend product has a crawlable product URL without a frontend deployment.
- Unknown slugs return a real 404.
- Product title, description, canonical URL, Open Graph data, and Book/Offer JSON-LD appear in the initial HTML.
- Price and availability shown in structured data match server data within the agreed cache window.
- Existing product URLs remain unchanged.

## HOST-4 / ZVY-10 — Establish one product-content source of truth

- Priority: High
- Estimate: 5 points
- Blocked by: HOST-3

### Description

Define which product fields live in the backend and remove the fragile split between API records and `src/content/books`. The recommended backend-owned fields are slug, name, author, description, SEO description, images, age rating, publication details, price, and availability.

### Acceptance criteria

- Every field has one documented owner.
- Adding a normal product does not require creating a TypeScript content file.
- Missing optional editorial data has a deliberate fallback.
- Backend responses are validated before rendering.
- Cart and checkout continue to use product-item IDs, with final price validation on the backend.

## HOST-5 / ZVY-9 — Add cache invalidation for product changes

- Priority: High
- Estimate: 3 points
- Blocked by: HOST-3

### Description

Add a protected frontend revalidation endpoint and call it from the backend/admin flow when a product is created or updated. Revalidate the product page, catalog, homepage, and sitemap as appropriate.

### Acceptance criteria

- Product creation invalidates `/books`, `/books/{slug}`, the homepage when relevant, and the sitemap.
- Price or availability changes become visible within the agreed maximum delay.
- The endpoint requires a secret and rejects unauthorized calls.
- A failed revalidation attempt is logged and can be retried safely.

## HOST-6 / ZVY-8 — Fix image delivery before moving production traffic

- Priority: High
- Estimate: 5 points
- Blocked by: HOST-2

### Description

Enable provider image optimization, compress oversized source images, and stop `ImageCarousel` from preloading every gallery image to detect orientation. Store image dimensions or aspect ratio as metadata instead.

### Acceptance criteria

- Carousel slides after the first remain lazy-loaded.
- Catalog thumbnails do not download multi-megabyte originals.
- The homepage hero is correctly prioritized for Largest Contentful Paint.
- Product and event images retain acceptable visual quality.
- Mobile performance is measured before and after the change.

## HOST-7 / ZVY-11 — Add dynamic-hosting and SEO regression tests

- Priority: High
- Estimate: 5 points
- Blocked by: HOST-3, HOST-5

### Description

Add automated tests for dynamic routes, metadata, cache refresh, API failure behavior, and the customer purchase path.

### Acceptance criteria

- Tests cover existing, newly created, unavailable, and missing products.
- Tests assert server-rendered title, description, canonical URL, and JSON-LD.
- A browser smoke test covers catalog → product → cart → checkout validation.
- Mobile navigation is tested at 320 px and 390 px.
- Tests do not submit a real payment or depend on production data.

## HOST-8 / ZVY-12 — Deploy a preview and perform a reversible domain cutover

- Status: Complete (ZVY-12, 2026-09-17); subsequent Pages retirement is ZVY-43
- Priority: High
- Estimate: 3 points
- Blocked by: HOST-2, HOST-3, HOST-6, HOST-7

### Description

Deploy the runtime version to a provider preview URL, validate it against the production API, then move `zvychajna.pp.ua` only after acceptance. Keep GitHub Pages available as the rollback target during verification.

### Acceptance criteria

- Preview deployment passes checkout, SEO, mobile, and error-state checks.
- Required environment variables and CORS origins are configured.
- DNS records and TLS are valid for the custom domain.
- Search-engine sitemap and robots URLs return correct production content.
- A tested rollback procedure exists.
- GitHub Pages remains enabled as an inactive rollback target until the separate ZVY-43 review passes; the original full-cycle/date observation gates were waived by the owner on 2026-10-01.

### Implementation record

The operational sequence, recorded GitHub Pages DNS values, environment matrix,
verification gates, and rollback steps live in
[`HOSTING_CUTOVER_RUNBOOK.md`](HOSTING_CUTOVER_RUNBOOK.md). A dedicated
Playwright configuration runs non-destructive checks against either the Netlify
candidate or the custom production domain. The Netlify candidate and the final
custom domain passed checkout validation without invoice creation, SEO, mobile
320/390, 404/error-state, robots, sitemap, and production-API CORS checks on
2026-09-16. External DNS now points the apex and `www` names to Netlify, valid
custom-domain TLS is active, and the obsolete root `CNAME` file has been removed.
GitHub Pages served as the inactive rollback target during the ZVY-43 observation
window. It was retired on 2026-10-01 after the billing/production review and the
owner-approved waivers recorded below.

## ZVY-43 — Retire GitHub Pages after billing-cycle observation

- Status: Operational retirement complete 2026-10-01; owner confirms TXT removal; final DNS/production checks and evidence self-review passed
- Timing: Owner explicitly waived the original 2026-10-17 earliest date and full-cycle observation requirement on 2026-10-01; no waiting date remains
- Related completed issue: ZVY-12 (reversible Netlify cutover)
- Source of truth: [ZVY-43](https://linear.app/zvychajna/issue/ZVY-43/retire-github-pages-after-netlify-billing-cycle-observation)

### Acceptance criteria and execution order

1. Review the current billing cycle's credits, allowance and available pause history;
   confirm acceptable projected monthly headroom and current/previous successful
   Netlify deploys remain available for rollback.
2. Verify production DNS, TLS/HSTS, `www` redirect, API health/CORS,
   and the remote production suite (checkout validation without
   invoice creation, SEO, robots/sitemap, branded errors, mobile 320/390).
   Backend revalidation verification was explicitly waived by the owner on
   2026-10-01 17:23 UTC; its unverified state is an accepted risk.
3. Record an explicit GO/NO-GO. If headroom is insufficient or verification
   fails, keep Pages enabled and reschedule the review.
4. On GO, record current Pages publishing settings and the last successful
   deployment, then disable/unpublish Pages. Preserve the old `main` snapshot,
   audit workflows/branches against accidental republishing, and confirm the
   active storefront branch has no root `CNAME`.
5. Only after retirement, remove the GitHub ownership-verification TXT record.
   Preserve `api`, Google verification TXT and unrelated DNS; consider restoring
   apex/`www` TTLs to 14400. Retain historical GitHub A/CNAME rollback values.
6. Rerun production verification, retain the revalidation waiver/unverified risk, and record final
   credits, DNS, test results, Pages status, and actual retirement date in the
   issue and runbook. Roll back if final verification fails.

### Preparation and final evidence

The detailed checklist and completed operational evidence record are in
[`HOSTING_CUTOVER_RUNBOOK.md`](HOSTING_CUTOVER_RUNBOOK.md). The remote suite now
checks Netlify HTTPS/HSTS, the apex redirect and API health as well as the original
cutover checks. An invoice-write guard covers the actual unversioned invoice
endpoint and versioned/query variants; deterministic local regression tests
verify writes are blocked before reaching the API.

On 2026-10-01 the owner explicitly waived waiting until October 4 (reported
billing-cycle end) or October 17. The review now uses current-cycle evidence,
not a completed-cycle observation. Billing data, rollback/Pages deployment
references and current Pages settings are now recorded from owner screenshots,
the Netlify connector and public GitHub API. Backend revalidation verification
is waived as an accepted risk. The owner retired Pages on **2026-10-01** and
post-disable production checks passed. Ownership TXT removal is now owner-confirmed
and final DNS/production checks and evidence self-review passed; ZVY-43 operational
retirement is complete.

Preparation verification on 2026-10-01 passed lint, type checking, 4 deterministic
fixtures, the application build, all 46 local browser tests and all 10 applicable
production checks (17 desktop/mobile combinations intentionally skipped). DNS
resolved to the expected Netlify apex A and `www` CNAME. Earlier API health
requests without Origin had connection resets; independent checks returned 200
and the final cross-origin health check passed. The runbook retains this
observation for the stability review. The earlier date-based NO-GO was superseded
by the owner's waiver.

The authenticated Netlify connector verifies current production deploy
`6ab418500c5c8000085c2f18` is ready on `codex/main` at
`16d0c5f41389e630a8cb2433ac6bcb786b918cef` and the team is Free. Refreshed public
checks passed all 10 applicable tests (17 intentional skips), with expected
Netlify apex/www DNS and TTLs of 3600. The owner reports "35 credits/300", 210
deployment credits, an October 4 cycle end and acceptable headroom; the connector
does not expose billing totals or deployment-history listing, so these figures
are not independently verified by the connector. Owner screenshots subsequently
show a successful older deploy at `47bd3ec` with Publish deploy available; local
Git resolves it to `47bd3ec91a0f991a5bb2f7c96416b45b108f96a1`. The supplied URL
identifies deploy `6a9ac6971f08ab1024377f3b`, confirmed ready/no expiry by the
connector. Its immutable URL requires authentication (Netlify 401/Login Redirect);
older storefront behavior was not tested, and no sign-in was attempted.

The billing screenshot clarifies 34.9/300 credits remaining and 265.1 consumed;
grant 2026-09-04, expiry 2026-10-04. Usage is 210 production deploy credits
(14 deploys), 8.9 requests (44,342), 24.7 compute, 21.6 bandwidth and 0 AI.
Non-deploy usage totals 55.1. Assuming approximately 27 elapsed days, unchanged
non-deploy daily usage and no further deploys, the cycle projects to 271.2 credits
with 28.8 remaining. The owner accepts headroom. One further deploy at the observed
15-credit average leaves about 13.8; two would exceed this projection's allowance.
Historical pause history is unavailable; current production availability is verified.

The owner selected connector evidence only after dashboard sign-in was blocked
by automatic approval review. A production environment-variable read was also
blocked; no secrets were retrieved. The owner selected "Leave revalidation
unverified", so no further configuration read or authenticated revalidation test
was attempted. The locally available old `main` snapshot still contains
`.github/workflows/pages.yml` with push/manual Pages deployment triggers; its
remote state is now public-API verified `disabled_manually` (workflow `203179149`),
with zero queued/in-progress/waiting/pending runs. Application CI is active. Main is preserved at
`9384428fac923992d6d42517f3cad80efeae3c2a`. Current decision: **GO** after the owner
explicitly waived revalidation verification and accepted its unverified risk on
2026-10-01 17:23 UTC. This applies to pre-disable and final checks; no successful
revalidation is claimed. Billing and deployment-reference evidence is recorded.
No waiting-date blocker remains. The owner performed the Pages settings changes;
this review performed no Netlify configuration, deployment or DNS mutation.

The pre-retirement owner screenshots on 2026-10-01 showed Pages published with GitHub
Actions as source, the Deploy Next.js to GitHub Pages workflow, custom domain
`zvychajna.pp.ua` and Enforce HTTPS checked. The last deployment is displayed as
approximately four months ago by Rutakamekiar. The supplied
[run 27026127247](https://github.com/rutakamekiar-org/lilys-books/actions/runs/27026127247)
is public-API verified completed/success on `main` at
`9384428fac923992d6d42517f3cad80efeae3c2a`, started 2026-06-05 16:11:16 UTC and
updated 16:12:12 UTC, workflow path `.github/workflows/pages.yml`.
The latest owner screenshots now show Pages workflow Disabled and cleared Pages
custom domain/no live deployment. Public checks observed around 17:33 UTC confirm
workflow `disabled_manually`, CI active, no pending Pages deploys, and the former
GitHub Pages URL returning 404. The actual click time was not supplied.

The browser available to this task is signed out of GitHub and no authenticated
GitHub write connector is available. Pages settings were opened for a user sign-in
or manual action; the owner completed the retirement through their own session.
DNS cleanup follows this retirement.

Post-disable production verification passed 10 applicable tests with 17 intentional
skips in 31.9 seconds; output `test-results/cutover-after-pages-retirement`.
Authoritative and public DNS retain Netlify apex A `75.2.60.5`, www Netlify CNAME
(both TTL 3600), API Koyeb CNAME (TTL 14400), Google TXT and UADNS nameservers.
Optional apex/www TTL restoration is intentionally not performed. The owner now
confirms "txt removed"; no DNS mutation was performed by this review. Both public
and authoritative lookups of the ownership candidate
`_gh-rutakamekiar-org-o.zvychajna.pp.ua` return NXDOMAIN. The actual deleted provider
row/value was not captured; a future GitHub verification would need a fresh challenge.
Latest billing evidence remains the owner snapshot of 265.1 consumed/34.9 remaining,
not an independently refreshed post-test balance. Final post-cleanup production
suite passed 10 applicable tests with 17 intentional skips in 21.4 seconds; output
`test-results/cutover-after-txt-cleanup`. Public/authoritative Netlify, API, Google
and UADNS records are intact. Pages workflow remains disabled and application CI
active. Final evidence was reconciled and self-reviewed; operational retirement is
complete with revalidation explicitly waived/unverified. Repository documentation
and safety-test changes are prepared on `codex/zvy-43-pages-retirement-readiness`
and ready for review; remote CI has not run for this branch.
