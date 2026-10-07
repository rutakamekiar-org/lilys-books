# ZVY-72 — Home and catalog recovery

Issue: [ZVY-72](https://linear.app/zvychajna/issue/ZVY-72/show-catalog-loading-failure-and-retry-separately-from-empty-stock). Implements approved F-DISC-001 from ZVY-57; extends the shared ZVY-22 error experience.

## Result

Previously a failed catalog fetch became `[]`: `/books` claimed there were no books and `/` rendered no featured content. Both routes now distinguish a failed cold fetch, an active fetch, and a successful empty response. A safe Ukrainian error offers “Спробувати ще раз”; loading disables the action and shares one in-flight request with foreground refreshes. Successful recovery removes error feedback and restores offers. Existing header navigation remains available in every state.

The server layout passes only products and a failure flag, so initial server HTML also distinguishes an outage from empty stock. Exception details are never passed into the recovery UI. Live fetches reject HTTP, network and malformed-response failures instead of swallowing them. Existing static SEO consumers retain their fallback/strict behavior.

Warm offers retain their existing presentation during background failures and empty refreshes. No freshness cue, backend contract, payment behavior, focus-outline design or hosting configuration changes were introduced.

## Files

| File | Purpose |
| --- | --- |
| `src/lib/api.ts` | Strict live catalog fetching and an explicit server storefront result. |
| `src/app/layout.tsx` | Pass server products and failure flag into the existing provider. |
| `src/components/molecules/ProductsProvider.tsx` | Loading/error state and deduplicated catalog refreshes. |
| `src/components/organisms/ProductsDataState.tsx` | Shared cold loading and empty states; reuse existing recovery component. |
| `src/components/organisms/StorefrontErrorState.tsx` | Catalog-specific copy and contextual heading level; preserve existing route errors. |
| `src/components/organisms/StorefrontErrorState.module.css` | Disabled loading-action appearance. |
| `src/components/organisms/Hero.tsx` | Render cold data feedback and select the recovered featured offer. |
| `src/app/books/BooksGrid.tsx` | Render shared feedback when no products have loaded. |
| `tests/support/mock-api.mjs` | Deterministic catalog error, empty and malformed controls. |
| `tests/e2e/catalog-recovery.spec.ts` | Recovery regressions and opt-in screenshot recording. |
| `docs/catalog-recovery/REPORT.md`, `before/*.jpg`, `after/*.jpg` | Verification handoff and 36 screenshots. |

## Acceptance and evidence

| Criterion | Evidence |
| --- | --- |
| Safe Ukrainian cold error and working Retry on `/` and `/books`; successful empty response is distinct; navigation remains available. | Browser regressions at 1440×900, 390×844 and 360×844; server HTML checks; axe scans on failure and empty states. |
| Loading prevents duplicate retries; recovery restores offers without stale feedback. | A held API request allows independent loading assertions; keyboard Retry, a second click and foreground refresh share one request. Recovered offer prices and the selected physical edition are asserted; invoice submission count remains zero. |
| Preserve existing product recovery and warm presentation. | ZVY-22 error/not-found regressions; dedicated background-failure preservation tests. |
| Verify failure/empty/loading/recovery independently at the required widths. | Screenshots below, plus malformed responses, repeat failures, disconnected browser requests and recovery to an empty response. |

All screenshots use the same deterministic product fixtures, local production application and local API double. Before evidence was captured on updated `main` (`d0c8692`) with test controls added but application code unchanged. The existing local revalidation endpoint invalidates home/catalog data before each cold scenario; individual browser requests are held or aborted to exercise loading and transport failure without timing sleeps.

| Screen/width | Before failure | After failure | Before empty | After empty | Loading | Recovery |
| --- | --- | --- | --- | --- | --- | --- |
| Home 1440×900 | [Before](before/home-1440x900-error.jpg) | [After](after/home-1440x900-error.jpg) | [Before](before/home-1440x900-empty.jpg) | [After](after/home-1440x900-empty.jpg) | [Loading](after/home-1440x900-loading.jpg) | [Recovery](after/home-1440x900-recovered.jpg) |
| Home 390×844 | [Before](before/home-390x844-error.jpg) | [After](after/home-390x844-error.jpg) | [Before](before/home-390x844-empty.jpg) | [After](after/home-390x844-empty.jpg) | [Loading](after/home-390x844-loading.jpg) | [Recovery](after/home-390x844-recovered.jpg) |
| Home 360×844 | [Before](before/home-360x844-error.jpg) | [After](after/home-360x844-error.jpg) | [Before](before/home-360x844-empty.jpg) | [After](after/home-360x844-empty.jpg) | [Loading](after/home-360x844-loading.jpg) | [Recovery](after/home-360x844-recovered.jpg) |
| Catalog 1440×900 | [Before](before/catalog-1440x900-error.jpg) | [After](after/catalog-1440x900-error.jpg) | [Before](before/catalog-1440x900-empty.jpg) | [After](after/catalog-1440x900-empty.jpg) | [Loading](after/catalog-1440x900-loading.jpg) | [Recovery](after/catalog-1440x900-recovered.jpg) |
| Catalog 390×844 | [Before](before/catalog-390x844-error.jpg) | [After](after/catalog-390x844-error.jpg) | [Before](before/catalog-390x844-empty.jpg) | [After](after/catalog-390x844-empty.jpg) | [Loading](after/catalog-390x844-loading.jpg) | [Recovery](after/catalog-390x844-recovered.jpg) |
| Catalog 360×844 | [Before](before/catalog-360x844-error.jpg) | [After](after/catalog-360x844-error.jpg) | [Before](before/catalog-360x844-empty.jpg) | [After](after/catalog-360x844-empty.jpg) | [Loading](after/catalog-360x844-loading.jpg) | [Recovery](after/catalog-360x844-recovered.jpg) |

Capture after evidence with PowerShell:

```powershell
$env:ZVY72_EVIDENCE_PHASE = 'after'
npm run test:e2e -- catalog-recovery --project desktop-chromium
```

Omit the variable for ordinary regression runs. The six screenshot-only tests then skip; behavior tests always execute. All tests prohibit external browser requests and never call production or submit payments.

## Verification and handoff

- Lint, TypeScript typecheck and deterministic product fixture validation passed.
- Initial production-build browser run: 21 checks passed, including the six screenshot scenarios and ZVY-22 regressions.
- Expanded production-build browser run: 43 checks passed, including 20 new behavior regressions, six evidence checks and the existing accessibility, keyboard and ZVY-22 checks.
- GitHub CI: pending final recording.
- Visual review checked Ukrainian wrapping, recovery buttons, empty/loading feedback and preserved navigation at the required widths.
- No backend changes; backend validation is not required for this frontend-only change.

The recorded verification environment is local production Next.js at `http://127.0.0.1:3100` with the local API at `http://127.0.0.1:4100`, using Chromium viewport emulation. Real-phone and screen-reader verification are separate evidence gaps; emulation and axe scans are not those passes. No provider/payment checks were performed.

Netlify deployment is explicitly skipped at the owner's request. Keep `[skip netlify]` in the PR title and final merge/squash subject. Code review, merge and availability in the environment chosen for the final ZVY-58 journey verification remain handoff requirements; a local pass does not complete that final verification.
