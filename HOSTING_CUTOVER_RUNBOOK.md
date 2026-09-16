# Netlify production cutover runbook

This runbook is the operational checklist for ZVY-12. It kept the GitHub Pages
deployment available until the Netlify deployment passed the same checks on the
custom domain. The post-cutover verification gate passed on 2026-09-16 at
21:52 UTC, after which the obsolete `CNAME` file was removed. GitHub Pages stays
enabled until the reviewed cleanup commit is pushed and the final verification
step is ready.

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

Only after every post-cutover check passes:

1. Remove the root `CNAME` file from the reviewed cutover branch.
2. Merge the final repository state. No additional Netlify deployment is
   required because this cleanup does not change the runtime application.
3. Disable GitHub Pages in repository settings.
4. Confirm the custom domain still resolves to Netlify and rerun the remote
   acceptance suite.

Keep the GitHub Pages publishing source, last successful deployment reference,
and old DNS values in this runbook so Pages can be re-enabled during rollback.

## Rollback procedure

Rollback triggers include TLS failure, DNS misrouting, checkout or API failure,
incorrect canonical/robots/sitemap output, or a regression that cannot be fixed
within the agreed verification window.

1. If GitHub Pages was disabled, re-enable it using the publishing source
   recorded in the evidence log.
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
| Pending | GitHub Pages retirement | Record setting change and final verification | Pending |
