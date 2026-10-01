# Netlify production cutover runbook

This runbook is the operational checklist for ZVY-12 and ZVY-43. It kept the GitHub Pages
deployment available until the Netlify deployment passed the same checks on the
custom domain. The post-cutover verification gate passed on 2026-09-16 at
21:52 UTC, after which the obsolete `CNAME` file was removed. The owner retired
GitHub Pages on 2026-10-01; screenshots and public checks recorded around 17:33 UTC
confirm the Pages workflow is disabled and the former GitHub Pages URL returns 404.
The owner confirmed ownership TXT removal and final DNS/production verification
passed on the same date. ZVY-43 operational retirement is complete.
The original plan required a complete billing cycle and no retirement before
2026-10-17. **On 2026-10-01 the owner explicitly waived waiting until October 4
or October 17.** Review current-cycle usage and observed production state now;
record this as partial-cycle evidence. At 17:23 UTC on the same date, the owner
explicitly waived backend revalidation verification and accepted its unverified
state as a remaining risk. Credit headroom, deploy rollback, GO/NO-GO, retirement
and all other final-verification requirements remain.

## Endpoints

| Purpose | URL |
| --- | --- |
| Netlify candidate | `https://astounding-douhua-45280d.netlify.app` |
| Production storefront | `https://zvychajna.pp.ua` |
| Production API | `https://api.zvychajna.pp.ua` |
| Revalidation endpoint | `https://astounding-douhua-45280d.netlify.app/api/revalidate` |

## Environment behavior

The public production endpoints have safe code defaults. They only need Netlify
variables when an environment must override those defaults:

| Variable | Production behavior |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Optional override; defaults to `https://api.zvychajna.pp.ua` |
| `NEXT_PUBLIC_SITE_BASE` | Optional override; defaults to `https://zvychajna.pp.ua` when `NODE_ENV=production` |
| `REVALIDATION_SECRET` | Required secret shared with the backend; never commit or print it |

Configure these in the production backend host:

| Setting | Required value or rule |
| --- | --- |
| `FRONTEND_REVALIDATION_URL` | `https://astounding-douhua-45280d.netlify.app/api/revalidate`; this stable deployment origin remains independent of custom-domain DNS propagation |
| `REVALIDATION_SECRET` | Exactly the same secret stored by Netlify |
| `Cors:AllowedOrigins` | Includes both `https://zvychajna.pp.ua` and `https://astounding-douhua-45280d.netlify.app` during migration |

Verify presence and scope without copying secret values into logs, screenshots,
issues, or this repository.

## Recorded pre-cutover state

Recorded on 2026-09-16 before any DNS changes:

| Record | Value | Observed TTL |
| --- | --- | --- |
| Apex A | `185.199.108.153` | approximately 14,400 seconds |
| Apex A | `185.199.109.153` | approximately 14,400 seconds |
| Apex A | `185.199.110.153` | approximately 14,400 seconds |
| Apex A | `185.199.111.153` | approximately 14,400 seconds |
| `www` CNAME | `rutakamekiar-org.github.io` | 14,400 seconds |
| Nameservers | `ns10.uadns.com`, `ns11.uadns.com`, `ns12.uadns.com` | unchanged by this cutover |

The production response reported `Server: GitHub.com`. Its certificate covered
`zvychajna.pp.ua` and was valid through 2026-12-12 UTC. The Netlify candidate
reported `Server: Netlify`, served a valid `*.netlify.app` certificate, and
passed the remote acceptance suite against the production API.

GitHub Pages used the `GitHub Actions` publishing source and the
`Deploy Next.js to GitHub Pages` workflow. Its custom domain was
`zvychajna.pp.ua`, HTTPS enforcement was enabled, and the settings page reported
the last deployment approximately three months before the cutover.

## 1. Build and deploy the Netlify candidate

1. Confirm the repository is linked to the existing Netlify site whose default
   domain is `astounding-douhua-45280d.netlify.app`.
2. Verify `REVALIDATION_SECRET` is available to builds, functions, and runtime
   without printing its value. Record whether the two optional public overrides
   are intentionally absent or explicitly configured.
3. Run the local verification pipeline:

   ```powershell
   npm run lint
   npm run typecheck
   npm run test:fixtures
   npm run build:ci
   npm run test:e2e
   ```

4. Confirm the published Netlify runtime commit matches the intended storefront
   base. Deploy to the Netlify production context only when it does not. Updating
   the `.netlify.app` candidate does not move `zvychajna.pp.ua` while its DNS
   still points at GitHub Pages.
5. Run the remote acceptance suite:

   ```powershell
   $env:CUTOVER_BASE_URL = 'https://astounding-douhua-45280d.netlify.app'
   npm run test:cutover
   ```

6. Record the Netlify URL, commit SHA, deploy log URL, and test result in the
   evidence log.

For this cutover, the published candidate is `codex/main@fc583f6`. The ZVY-12
branch starts from that exact runtime commit and adds only deployment metadata,
tests, and documentation, so a second production deploy is intentionally
skipped to preserve Netlify credits. The committed `netlify.toml` will take
effect on the next runtime-changing deploy.

## 2. Prepare the custom domain

1. Add `zvychajna.pp.ua` to the Netlify site before editing DNS. Keep the apex
   domain as the primary domain so existing URLs remain unchanged.
2. Confirm Netlify also registers `www.zvychajna.pp.ua` as the alias that
   redirects to the apex domain.
3. Copy the project-specific external-DNS instructions shown by Netlify into
   the evidence log. Prefer those instructions over generic values.
4. If UADNS permits TTL changes, lower the apex and `www` TTLs and wait at least
   one previous TTL before the cutover. The observed previous TTL is four hours.
5. Do not change MX, TXT, NS, `api`, or any other unrelated record.

## 3. Change DNS

For Netlify's standard network with external DNS, the expected records are:

| Name | Type | Target |
| --- | --- | --- |
| Apex (`@`) | A | `75.2.60.5` |
| `www` | CNAME | `astounding-douhua-45280d.netlify.app` |

Replace only the four GitHub Pages apex A records and the GitHub Pages `www`
CNAME. Do not leave old and new apex A records active together. If Netlify's
project-specific instructions differ, use those values and update this runbook.

## 4. Post-cutover verification gate

Wait until public DNS resolves to Netlify and Netlify has provisioned a valid
certificate for both the apex and `www` names. Then verify:

1. `https://zvychajna.pp.ua` returns `200`, reports `Server: Netlify`, and has a
   valid certificate for the custom domain.
2. `https://www.zvychajna.pp.ua` redirects to the apex HTTPS URL.
3. The API CORS preflight allows `https://zvychajna.pp.ua`.
4. The remote acceptance suite passes on the custom domain:

   ```powershell
   $env:CUTOVER_BASE_URL = 'https://zvychajna.pp.ua'
   npm run test:cutover
   ```

5. `robots.txt` points at `https://zvychajna.pp.ua/sitemap.xml` and every
   sitemap `<loc>` uses the production origin.
6. A safe revalidation request reaches the custom-domain endpoint and does not
   expose the shared secret.

If any check fails, execute the rollback procedure. GitHub Pages must remain
enabled throughout this gate.

This gate passed on 2026-09-16 at 21:52 UTC. The apex returned `200` from
Netlify with valid HTTPS and HSTS, `www` returned a permanent redirect to the
apex, and the production-domain acceptance suite passed all seven applicable
checks. Checkout validation made no invoice request.

## 5. Retire GitHub Pages

Retirement is tracked in [ZVY-43](https://linear.app/zvychajna/issue/ZVY-43/retire-github-pages-after-netlify-billing-cycle-observation).
The owner waived the original date and completed-cycle gates on 2026-10-01.
The current production deploy and refreshed public acceptance checks are verified.
Owner screenshots establish current-cycle billing and Pages publishing settings.
The supplied deployment references are recorded and verified through the Netlify
connector and public GitHub API. Billing headroom is accepted with the projection
assumptions below. Backend revalidation remains unverified; the owner explicitly
waived that acceptance criterion at 2026-10-01 17:23 UTC and accepted the risk.
Current decision: **GO for Pages retirement**, superseding the earlier NO-GO.
The owner disabled the Pages workflow, unpublished Pages and confirmed ownership
TXT removal. Post-cleanup DNS/production checks passed; ZVY-43 operational
retirement is complete with the evidence limits recorded below.
The owner selected connector evidence only when dashboard sign-in was requested.

### Pre-disable review and go/no-go decision

Complete every item and record evidence before changing GitHub Pages or DNS:

1. Record the owner's 2026-10-01 waiver and the current billing cycle's start/end
   dates, source and review timestamp. The owner-provided billing screenshot shows
   credits granted September 4, 2026 and expiring October 4, 2026. Do not infer dates from the cutover or
   account-creation date, and do not describe this as a completed-cycle review.
2. Review the current cycle's actual credits and allowance, including other
   projects sharing the allowance. Confirm the storefront was not paused during
   the observed period, distinguishing current availability from historical pause
   evidence. Record projected monthly usage, remaining headroom, the assumptions
   behind the projection (including deploys and traffic), and why that headroom
   is acceptable. Label owner-reported figures separately from API-verified data.
3. Confirm both the current production deploy and a previous successful Netlify
   deploy are still available to publish for rollback. Record their deploy IDs,
   commit SHAs, and dashboard/log URLs.
4. Verify authoritative and public DNS: apex A `75.2.60.5`, `www` CNAME to the
   Netlify site, and unchanged `api`, Google verification TXT, and nameservers.
   Record the ownership-verification TXT value and apex/`www` TTLs before cleanup.
5. Run the remote production suite:

   ```powershell
   $env:CUTOVER_BASE_URL = 'https://zvychajna.pp.ua'
   npm run test:cutover
   ```

   Require storefront `200` from Netlify, trusted TLS and positive HSTS max-age,
   permanent `www` redirect to apex HTTPS, API `/health` `200`, production CORS,
   checkout validation without invoice creation, SEO metadata, robots/sitemap,
   branded error states, and mobile widths 320/390 to pass. TLS verification is
   enabled; do not bypass certificate errors. The invoice-write guard aborts
   browser requests to `/api/invoice`, its versioned paths, and query variants;
   any attempted write still fails checkout acceptance. Its regression tests use
   the local API double, independently of production.
6. **Waived for ZVY-43 by the owner on 2026-10-01 17:23 UTC; accepted risk,
   unverified.** The original criterion was to confirm backend revalidation is configured with the stable Netlify endpoint
   and matching secret. Verify a successful backend-initiated revalidation from
   logs or a safe authenticated retry for an existing product, and confirm fresh
   storefront content. An unauthenticated `401` alone does not prove integration
   works. No such success is claimed, and no further secret access is authorized
   for this issue. This waiver also applies to the final revalidation check.
7. Record an explicit **GO** or **NO-GO**, reviewer, timestamp, and evidence in
   this runbook and ZVY-43. GO requires all non-waived gates above. If credit headroom is
   insufficient or any other gate fails or lacks evidence, leave Pages and DNS
   intact, record the reason, and reschedule ZVY-43 for another review.

### Retirement and DNS cleanup

Only after a recorded GO:

1. Record the current Pages publishing source, enabled status, custom domain,
   HTTPS setting, and the last successful deployment URL/ID and commit SHA.
   The historical record below must be refreshed from repository settings and
   deployment history before changing them.
2. Confirm the active storefront branch has no root `CNAME`; it was removed
   during ZVY-12. Preserve the old `main` branch as an archived source snapshot.
   Deleting it requires a separate decision.
3. Disable/unpublish GitHub Pages in repository settings and record the actual
   timestamp and resulting status. Inspect workflows on active publishing
   branches and repository workflow settings for Pages upload/deploy actions and
   `pages: write` permissions. Disable any remaining Pages deployment workflow
   so a push, manual dispatch, or scheduled run cannot unintentionally republish
   the site. The storefront's current local `ci.yml` only verifies the app;
   that alone does not establish the state of other branches or GitHub settings.
4. After Pages is disabled and the rollback target is intentionally retired,
   remove only the GitHub ownership-verification TXT record
   `_gh-rutakamekiar-org-o.zvychajna` at NIC.UA/UADNS. Leave the `api` CNAME,
   Google verification TXT, NS, MX, and unrelated records unchanged. Preserve
   the removed TXT value with the operational evidence in case rollback needs it.
5. Consider restoring apex and `www` TTLs from 3600 to 14400 after the observation
   window. Record whether they were changed and why; the restoration is optional.
   Keep the former GitHub A records and `www` CNAME in this runbook.

### Final verification and evidence

1. Confirm the apex returns `200` from Netlify with valid TLS and HSTS and `www`
   permanently redirects to the apex HTTPS URL.
2. Rerun the same remote production suite after disabling Pages and DNS cleanup.
   Retain the test report and count of passed, failed, and skipped checks.
3. Record backend revalidation as unverified with the owner-approved waiver and
   accepted risk from 2026-10-01 17:23 UTC. Do not claim a successful check.
4. Recheck authoritative/public DNS and GitHub Pages status. Record final credits,
   DNS/TTL values, deployment references, revalidation evidence, and test results
   in ZVY-43 and the evidence table below. Update
   `DYNAMIC_HOSTING_MIGRATION_BACKLOG.md` with the actual retirement date and
   evidence links. Do not mark retirement complete until all checks pass.
5. If final verification fails, execute the rollback procedure and record the
   failure and recovery. Re-enable Pages before restoring its DNS records.

Use this evidence record; distinguish verified checks, owner reports and waivers:

| Retirement evidence | Verified value / reference |
| --- | --- |
| Current-cycle dates, allowance, actual credits, pause history and owner waiver | Owner billing screenshot: granted 2026-09-04, expires 2026-10-04; allowance 300, consumed 265.1, remaining 34.9. Categories: 210 production deploys (14 deploys), 0 AI inference, 8.9 web requests (44,342), 24.7 compute, 21.6 bandwidth. Waiting/full-cycle waiver recorded 2026-10-01. Current site serves 200; historical pause data unavailable |
| Projected monthly credits, headroom, assumptions and acceptance rationale | Non-deploy consumption 55.1; approximate 30-day projection `210 + 55.1 / 27 * 30 = 271.2`, leaving 28.8. Assumes approximately 27 elapsed days, unchanged non-deploy daily rate and no additional production deploys. Owner accepts headroom; observed deployment average is 15 credits each, so one additional deploy leaves about 13.8, two would exceed the projection's allowance |
| Current / previous successful Netlify deploy IDs, SHAs and URLs | Current: `6ab418500c5c8000085c2f18`, ready, `16d0c5f41389e630a8cb2433ac6bcb786b918cef`, published 2026-09-23 18:20:32 UTC, no expiry. Previous: connector confirms `6a9ac6971f08ab1024377f3b`, ready, production, `codex/zvy-6-next-runtime`, `47bd3ec91a0f991a5bb2f7c96416b45b108f96a1`, published 2026-09-04 13:25:23 UTC, no expiry; [immutable URL](https://6a9ac6971f08ab1024377f3b--astounding-douhua-45280d.netlify.app/) returns Netlify 401/Login Redirect without authentication; screenshot offers Publish deploy |
| Pre-disable DNS/TLS/HSTS/CORS, API health and production test report | Refreshed 2026-10-01: 10 passed, 17 intentional skips; public resolver apex `75.2.60.5`, www CNAME `astounding-douhua-45280d.netlify.app`, both TTL 3600 |
| Backend revalidation configuration and successful operation | Unverified; owner explicitly waived verification and accepted risk on 2026-10-01 17:23 UTC. Applies to pre-disable and final verification; no successful operation claimed |
| GO/NO-GO, reviewer, UTC timestamp and rationale | GO, Codex review/owner authorization 2026-10-01 17:23 UTC. Billing/headroom, retained rollback deploys, Pages references and production checks recorded; owner waived revalidation and waiting/full-cycle gates. All earlier NO-GO decisions superseded |
| Pre-disable Pages publishing source and last successful deployment ID/SHA/URL | Before retirement, owner screenshot: published, GitHub Actions source, Deploy Next.js to GitHub Pages workflow, custom domain `zvychajna.pp.ua`, Enforce HTTPS checked. Supplied [run 27026127247](https://github.com/rutakamekiar-org/lilys-books/actions/runs/27026127247) is API-verified completed/success on `main`, SHA `9384428fac923992d6d42517f3cad80efeae3c2a`, started 2026-06-05 16:11:16 UTC, updated 16:12:12 UTC, `.github/workflows/pages.yml`; no assertion that all deployment history was enumerated |
| Pages disable timestamp/status; archived `main`; workflow audit; root `CNAME` absent | Owner screenshots and checks observed 2026-10-01 around 17:33 UTC (exact action time not supplied): Pages custom domain cleared/no live-deploy panel; workflow `203179149` (`pages.yml`) API state `disabled_manually`, queued/in_progress/waiting/pending counts each 0. Application CI `350442970` remains active. Former `https://rutakamekiar-org.github.io/lilys-books/` returns 404 from GitHub.com. `main` preserved at `9384428fac923992d6d42517f3cad80efeae3c2a`; active storefront root `CNAME` absent |
| Ownership TXT removal; unchanged `api`/Google TXT/NS/MX; final DNS and TTLs | Owner explicitly confirms "txt removed" on 2026-10-01. Public 1.1.1.1 and authoritative ns10.uadns.com both return NXDOMAIN for recorded candidate `_gh-rutakamekiar-org-o.zvychajna.pp.ua`; actual deleted editor name/value were not captured. Apex A `75.2.60.5` and www Netlify CNAME retain authoritative TTL 3600; API Koyeb CNAME TTL 14400, Google TXT and UADNS nameservers retained. No DNS mutation by this review; optional TTL restoration not performed; no MX mutation performed |
| Post-disable production test report and revalidation evidence | 2026-10-01: 10 passed, 17 intentional skips, 31.9 seconds; output `test-results/cutover-after-pages-retirement`. HTTPS/HSTS, www redirect, API health/CORS, SEO/robots/sitemap, checkout without invoice writes, branded errors and mobile 320/390 passed. Revalidation waived/unverified as accepted risk. Recheck after any DNS mutation |
| Post-cleanup production test report | 2026-10-01: 10 passed, 17 intentional skips, 21.4 seconds; output `test-results/cutover-after-txt-cleanup`. All applicable production checks pass; no invoice writes |
| Latest recorded credits, retirement date, Linear evidence and review reference | Latest owner billing snapshot: 265.1 consumed/34.9 remaining, not a fresh post-test balance. Operational retirement completed 2026-10-01; final evidence reconciliation/self-review passed. [ZVY-43](https://linear.app/zvychajna/issue/ZVY-43/retire-github-pages-after-netlify-billing-cycle-observation) records closure. Repository documentation/test changes are local and ready for review; remote CI has not run for this branch |

Keep the GitHub Pages publishing source, last successful deployment reference,
and old DNS values in this runbook so Pages can be re-enabled during rollback.
Documentation and test preparation does not close the operational issue.

### Connector review evidence and access limits (2026-10-01)

The authenticated Netlify connector confirms the `LilyBooks` team (`vladkovaliov13`)
is on Free and the selected site is `33b0cd6f-930d-44fc-a206-e31dd69c24f0`.
Its primary URL is `https://zvychajna.pp.ua`; production deploy
`6ab418500c5c8000085c2f18` is current and ready on `codex/main`, at commit
`16d0c5f41389e630a8cb2433ac6bcb786b918cef`, with no deployment error and no
expiry. Its [immutable deploy URL](https://6ab418500c5c8000085c2f18--astounding-douhua-45280d.netlify.app)
and [deployment detail](https://app.netlify.com/projects/astounding-douhua-45280d/deploys/6ab418500c5c8000085c2f18)
identify the verified current artifact. The source commit has no root `CNAME`.

The connector provides team/project metadata and deploy lookup by known ID; it
does not expose billing usage, pause history or deployment-history listing.
Current availability is verified by live HTTPS responses and the production
suite. Historical availability for an entire cycle cannot be inferred from those
checks. Previous-deploy availability is separately evidenced by the owner-provided
dashboard screenshots described below, subject to their stated limits.

The owner's billing screenshot resolves the earlier ambiguous "35 credits/300":
34.9 remain and 265.1 have been consumed. The grant is September 4, 2026 and expiry
October 4, 2026. The category totals reconcile: 210 production deploys + 8.9 web
requests + 24.7 compute + 21.6 bandwidth + 0 AI inference = 265.1. There were 14
production deploys and 44,342 web requests. Non-deployment consumption is 55.1.
These figures are dashboard screenshot evidence, not connector-returned accounting.

Using approximately 27 elapsed days in the 30-day grant period, unchanged daily
non-deployment usage and no further production deploys gives `210 + 55.1 / 27 *
30 = 271.2` projected credits, leaving about 28.8. The owner already accepts
headroom. The observed production-deploy average is `210 / 14 = 15` credits;
one more deploy would leave approximately 13.8 under this projection, and two
would exceed the allowance. This is a conditional estimate, not a guaranteed
balance or future traffic forecast; credits shared across sites and any delayed
usage updates are included only to the extent shown in the dashboard totals.
Current service is available; historical pause history is not supplied.

Dashboard sign-in through GitHub was rejected by automatic approval review;
the owner then selected connector evidence only. A connector environment-variable
read was also rejected because it could expose production secrets; no secret was
retrieved or recorded. The owner explicitly selected "Leave revalidation unverified"
on 2026-10-01, so no further environment access or authenticated revalidation
attempt was performed. Backend secret agreement and successful revalidation remain
unverified by this review. The locally available `origin/main` snapshot contains
`.github/workflows/pages.yml`, triggered by pushes to `main` and manual dispatch,
with `pages: write` and `actions/deploy-pages@v4`. Its current GitHub activation
status was initially unverified; the first public API audit found it active.
The post-retirement audit now confirms `disabled_manually`. Pre-retirement Pages
settings are evidenced by the owner screenshot; the supplied successful workflow
run is verified through the public GitHub API as recorded below. No Pages,
Netlify configuration, deployment or DNS changes were performed by this review.

### Owner screenshot evidence (2026-10-01)

The two Netlify screenshots show a retained successful production deploy for
`astounding-douhua-45280d` at short commit `47bd3ec`. Local Git resolves that
commit to `47bd3ec91a0f991a5bb2f7c96416b45b108f96a1`. The dashboard displays
Sep 4 at 4:24 PM, with no year or timezone visible, and offers **Publish deploy**
and **Permalink**. All five deploy phases show Complete; build time is 41 seconds,
total deploy time 42 seconds. This supports a retained publishable rollback
candidate, but the screenshot does not contain its deploy ID or permalink URL.
At that point, the previous artifact had not been requested by this review. Do
not publish it while gathering evidence: that action changes production.

The owner subsequently supplied its immutable URL containing deploy ID
`6a9ac6971f08ab1024377f3b`. The Netlify connector confirms this deploy is ready,
production, on `codex/zvy-6-next-runtime` at the full SHA above, published
2026-09-04 13:25:23.793 UTC, with no error and no expiry. A public HTTPS request
returned `401` from Netlify with Login Redirect. This is an authentication limit,
not evidence of a missing deploy; no sign-in or bypass was attempted. Availability
for publishing is established by the connector and dashboard button; the older
storefront's live behavior remains untested.

The GitHub screenshot shows Pages is still published using **GitHub Actions**
and **Deploy Next.js to GitHub Pages**, with custom domain `zvychajna.pp.ua` and
**Enforce HTTPS** checked. It reports the last deployment by Rutakamekiar
approximately four months ago; its exact deployment URL/ID/SHA is not visible.
**Unpublish site** is available. The displayed **DNS Check in Progress** concerns
the Pages custom-domain check; it does not override the verified Netlify DNS/TLS
results or justify changing production DNS back to GitHub.

The supplied [GitHub run 27026127247](https://github.com/rutakamekiar-org/lilys-books/actions/runs/27026127247)
is verified through the unauthenticated public GitHub API as completed/success,
workflow Deploy Next.js to GitHub Pages, branch `main`, commit
`9384428fac923992d6d42517f3cad80efeae3c2a`, started 2026-06-05 16:11:16 UTC and
updated 16:12:12 UTC, workflow path `.github/workflows/pages.yml`. This provides
the exact reference for the last deployment identified by the owner; all remote
deployment history was not enumerated.

At retirement, first disable the named Pages deployment workflow and cancel any
queued or running Pages deployments, then use **Unpublish site** in Pages settings.
Record the resulting workflow and Pages states. Preserve normal application CI
and the old `main` branch. No retirement action is evidenced by these screenshots.

### Owner waiver, GO and execution access (2026-10-01)

At 17:23 UTC the owner replied "yes" to explicitly waiving the backend revalidation
acceptance criterion and proceeding with its unverified state as an accepted risk.
This applies to both pre-disable and final verification in ZVY-43. The current
decision is **GO for Pages retirement** based on the evidence above; no waiting
date or revalidation-verification blocker remains.

The pre-retirement public API audit found workflow `203179149`,
`.github/workflows/pages.yml`, active, with zero queued, in-progress, waiting or
pending runs at that audit.
The preserved `main` ref remains at `9384428fac923992d6d42517f3cad80efeae3c2a`.
The browser available to this task is signed out of GitHub; opening repository
Pages settings returns a 404 with Sign in. No authenticated GitHub write connector
or signed-in controllable browser session is available. Therefore workflow disable,
Pages unpublish and subsequent DNS cleanup had not been performed at that audit.
The settings page was opened for a user sign-in or manual retirement handoff.
The owner subsequently supplied the retirement screenshots recorded below.
The signed-out session was an execution-access limitation, not a new approval
requirement or a NO-GO review.

### Owner retirement and post-disable verification (2026-10-01)

The owner supplied an Actions screenshot with **Deploy Next.js to GitHub Pages —
Disabled** and a Pages settings screenshot with the custom-domain field empty,
a **Custom domain removed** banner, no live-deployment panel and a prompt to
configure a workflow. Public API verification observed around 17:33 UTC confirms
the Pages workflow is `disabled_manually`; the only other listed workflow,
**Verify Next.js application**, remains active. All queued, in-progress, waiting
and pending Pages run counts are zero. The former GitHub Pages project URL returns
404 from GitHub.com. This records Pages retirement on 2026-10-01; the exact time
of the owner's clicks is not supplied.

The post-disable production suite passed all 10 applicable checks, with 17
intentional desktop/mobile skips, in 31.9 seconds. Test output is under
`test-results/cutover-after-pages-retirement`. No invoice writes occurred.
Public resolver 1.1.1.1 and authoritative ns10.uadns.com agree on Netlify apex/www
and the API CNAME; Google verification TXT and the three UADNS nameservers remain
present. Apex/www TTLs remain 3600 deliberately; optional restoration to 14400 is
not needed for closure. The authoritative MX query returned SOA/no MX answer;
no MX record was changed by this review.

The issue's ownership TXT label is `_gh-rutakamekiar-org-o.zvychajna`.
An authoritative lookup of `_gh-rutakamekiar-org-o.zvychajna.pp.ua` returned
DNS name does not exist. This does not prove that the intended ownership record
has been removed: its exact DNS-editor name/value has not been captured. Inspect
the provider's record list before deleting anything, preserve the actual value
if present, and remove only the matching GitHub ownership record. No DNS cleanup
has been performed or claimed by this review. Recheck production/DNS after any
actual cleanup, then finalize the issue evidence and review.

### Final cleanup confirmation and review (2026-10-01)

The owner subsequently confirmed **"txt removed"**. Record removal as an
owner-performed action; the exact deleted DNS-editor name/value was not captured.
Both public 1.1.1.1 and authoritative ns10.uadns.com return NXDOMAIN for the recorded
ownership candidate `_gh-rutakamekiar-org-o.zvychajna.pp.ua`. This corroborates
absence at that name but does not independently identify the deleted provider row.
If GitHub ownership verification is needed again, obtain a fresh challenge value
from GitHub; the old TXT value cannot be restored from this evidence.

Final DNS checks confirm Netlify apex A `75.2.60.5` and www CNAME
`astounding-douhua-45280d.netlify.app`, authoritative TTL 3600; API CNAME
`spicy-avrit-kukharets-021c9f66.koyeb.app`, TTL 14400; Google verification TXT and
ns10/ns11/ns12.uadns.com remain present. Cached public TTLs count down normally.
GitHub Pages workflow remains `disabled_manually` and application CI remains
active. The final post-cleanup production suite passed 10 applicable checks,
with 17 intentional skips, in 21.4 seconds; output
`test-results/cutover-after-txt-cleanup`. No invoice writes occurred.

Operational criteria are satisfied with the explicitly agreed waiting/full-cycle
and revalidation waivers. Latest billing remains the supplied dashboard snapshot
(265.1 consumed/34.9 remaining); no independently refreshed post-test balance is
claimed. The evidence, decision, rollback references, risks and final outcome were
reconciled and self-reviewed for consistency. ZVY-43 operational retirement is
complete on 2026-10-01. Repository documentation and safety-test changes are
prepared on `codex/zvy-43-pages-retirement-readiness` and ready for review;
remote CI has not run for this branch.

## Rollback procedure

Rollback triggers include TLS failure, DNS misrouting, checkout or API failure,
incorrect canonical/robots/sitemap output, or a regression that cannot be fixed
within the agreed verification window.

1. If GitHub Pages was disabled, re-enable it using the publishing source
   recorded in the evidence log. Re-enable the recorded deployment workflow if
   needed. If GitHub requires domain ownership verification again, restore the
   exact recorded GitHub ownership TXT value if available, or obtain a fresh
   verification challenge and complete verification first. The TXT value removed
   during ZVY-43 was not captured, so that rollback requires a fresh challenge.
2. Restore the root `CNAME` file from the recorded pre-cutover commit if it has
   already been removed.
3. At UADNS, remove the Netlify apex record and restore all four GitHub Pages A
   records:
   - `185.199.108.153`
   - `185.199.109.153`
   - `185.199.110.153`
   - `185.199.111.153`
4. Restore `www` as a CNAME to `rutakamekiar-org.github.io`.
5. Leave NS, MX, TXT, `api`, and all unrelated records unchanged.
6. Wait for DNS propagation, then require all of the following:
   - apex and `www` resolve to GitHub Pages;
   - the response reports `Server: GitHub.com`;
   - HTTPS is valid;
   - the storefront and checkout-validation journey load successfully.
7. Keep the failed Netlify deploy available for diagnosis; do not delete it as
   part of rollback.

The rollback target was exercised before cutover by verifying that the recorded
GitHub Pages records served the working production storefront. A post-cutover
rollback is complete only after the same HTTP, TLS, and checkout checks pass.

## Evidence log

| Time (UTC) | Gate | Evidence | Result |
| --- | --- | --- | --- |
| 2026-09-16 | Pre-cutover DNS | Four GitHub Pages A records; `www` CNAME to `rutakamekiar-org.github.io` | Pass |
| 2026-09-16 | Existing Netlify candidate | Remote suite: checkout validation, SEO, 404s, API CORS, mobile 320/390 | 7 passed |
| 2026-09-16 | Netlify environment | `REVALIDATION_SECRET` available to builds, functions, and runtime in three deploy contexts; optional public overrides intentionally absent | Pass |
| 2026-09-16 | Published Netlify runtime | `codex/main@fc583f6` at `astounding-douhua-45280d.netlify.app` | Pass |
| 2026-09-16 | GitHub Pages publishing source | GitHub Actions via `Deploy Next.js to GitHub Pages`; custom domain `zvychajna.pp.ua`; HTTPS enforced; last deployment approximately three months earlier | Pass |
| 2026-09-16 | Backend revalidation | Koyeb uses the stable Netlify endpoint; backend and Netlify `REVALIDATION_SECRET` values match | Pass |
| 2026-09-16 | Netlify domain instructions | External DNS: apex A `75.2.60.5`; `www` CNAME `astounding-douhua-45280d.netlify.app` | Pass |
| 2026-09-16 21:42 UTC | Custom-domain DNS | Authoritative UADNS and `1.1.1.1` returned apex `75.2.60.5`; `www` pointed to the Netlify site; TTL 3,600 seconds; UADNS nameservers unchanged | Pass |
| 2026-09-16 21:49 UTC | External DNS mode | Accidental inactive Netlify DNS zone removed before certificate issuance; NIC.UA remained authoritative throughout | Pass |
| 2026-09-16 21:52 UTC | Custom-domain TLS | Apex returned `200` from Netlify with valid HTTPS and HSTS; `www` returned `301` to the apex HTTPS URL | Pass |
| 2026-09-16 21:53 UTC | Custom-domain acceptance suite | Checkout validation without invoice creation, SEO, robots/sitemap, branded 404s, API CORS, and mobile 320/390 | 7 passed |
| 2026-10-01 | Retirement preparation | ZVY-43 date gate is 2026-10-17; billing review and live retirement evidence remain outstanding | Not eligible |
| 2026-10-01 | Local preparation validation | Lint, type checking and 4 deterministic product fixtures passed; application build and 46 browser regression tests passed, including 2 invoice-guard tests | Pass |
| 2026-10-01 | Preliminary production suite | Netlify HTTPS/HSTS, `www` redirect, API health GET with production Origin/CORS, robots/sitemap, SEO, checkout with zero invoice writes, branded errors, mobile 320/390; 10 passed and 17 intentionally skipped desktop/mobile combinations | Pass; rerun at retirement |
| 2026-10-01 | API health observation | Earlier Playwright GETs without Origin had socket resets; independent curl/Node HTTPS GETs returned 200 and the final production suite's cross-origin health GET passed. The cause of the earlier resets was not established | Retain for stability review |
| 2026-10-01 | Preliminary DNS and readiness decision | Resolver returned apex A `75.2.60.5` and `www` CNAME `astounding-douhua-45280d.netlify.app`; no hosting or DNS changes performed. Date/billing gates incomplete | NO-GO for retirement |
| 2026-10-01 | Owner criteria amendment | Waiting until October 4/full-cycle completion or October 17 explicitly waived; immediate current-cycle review authorized. Original date-based NO-GO superseded | Recorded in ZVY-43 |
| 2026-10-01 16:07 UTC | Connector and refreshed production review | Current Netlify deploy ready at `16d0c5f`; Free team; suite 10 passed/17 skipped; apex and www DNS match Netlify. Billing, previous-deploy availability, Pages settings and backend revalidation unverified with current access | NO-GO pending evidence; no date blocker |
| 2026-10-01 | Owner screenshot review | Previous successful Netlify deploy at `47bd3ec` offers Publish deploy; all deploy phases complete. Pages is published via GitHub Actions/Deploy Next.js to GitHub Pages with custom domain and HTTPS enforcement. Exact deployment references, billing and revalidation remain unverified | Rollback candidate and Pages settings recorded; no hosting changes |
| 2026-10-01 | Supplied URLs and billing evidence | Previous Netlify deploy `6a9ac6971f08ab1024377f3b` connector-ready/no expiry; public permalink requires authentication. GitHub run `27026127247` API-verified successful at `9384428`. Billing screenshot: 265.1 consumed/34.9 remaining, 210 deployment credits, grant Sep 4/expiry Oct 4; conditional cycle projection 271.2 leaves 28.8 | Billing and deployment references resolved; NO-GO remains solely for unverified revalidation criterion |
| 2026-10-01 17:23 UTC | Owner revalidation waiver and GO | Owner explicitly accepts unverified revalidation risk and waives its pre-disable/final criterion. Billing/headroom, rollback and production evidence recorded | GO; earlier NO-GO superseded |
| 2026-10-01 | GitHub workflow and execution-access audit | Workflow `203179149` active; zero queued/in_progress/waiting/pending runs; main preserved at `9384428`. Available browser signed out of GitHub; no retirement settings action performed | Await signed-in access or manual retirement |
| 2026-10-01, observed around 17:33 UTC | Owner Pages retirement and workflow audit | Screenshots show disabled Pages workflow and cleared Pages domain/no live deployment; API confirms `disabled_manually`, application CI active and no pending runs; former GitHub Pages URL returns 404 | Pages retired; main preserved |
| 2026-10-01 | Post-disable production and DNS | 10 passed/17 intentional skips; public and authoritative Netlify apex/www and API DNS agree; Google TXT/UADNS retained; apex/www TTL 3600. Recorded ownership TXT candidate is NXDOMAIN; provider record list still required | Production passes; ownership cleanup unresolved |
| 2026-10-01, after 17:43 UTC | Owner TXT confirmation and final verification | Owner confirms txt removed; public/authoritative ownership candidate NXDOMAIN; Netlify/API/Google/UADNS retained; Pages workflow disabled, CI active; 10 production checks passed/17 intentional skips in 21.4s. Deleted TXT value not captured; latest credits 265.1 consumed/34.9 remaining from owner screenshot | Operational retirement complete; revalidation waived/unverified; evidence self-reviewed |
