# SEO and legacy URL normalization

This document describes how the storefront keeps one indexable URL for each page, with particular attention to legacy URLs that contain the `v` query parameter.

## Why legacy `v` URLs redirect

Older storefront links used `v` as a cache-busting query parameter. Search engines can treat every query-string variation as a separate URL, which divides crawl activity and ranking signals between the clean page and its legacy variants.

The storefront therefore returns a permanent `308` redirect whenever a page request contains `v`. The redirect removes every `v` value and preserves the path and any unrelated query parameters:

| Incoming request | Redirect destination |
| --- | --- |
| `/?v=legacy` | `/` |
| `/books?v=legacy` | `/books` |
| `/about?v=legacy` | `/about` |
| `/books/example?v=legacy` | `/books/example` |
| `/books?v=one&utm_source=email&v=two` | `/books?utm_source=email` |

The implementation is in `src/proxy.ts`. It clones the incoming URL before removing `v`, so it does not replace the request scheme or host. HTTPS enforcement and the production canonical-host redirect remain the hosting platform's responsibility. Requests without `v` pass through unchanged, preventing redirect loops.

The proxy applies to storefront page routes. It excludes API routes, Next.js internals, and paths containing a file extension so cache-busting parameters on assets are not treated as legacy page URLs.

## Canonical and robots behavior

The redirect, canonical metadata, and robots policy are intended to work together:

1. Crawlers may request a legacy URL and observe its permanent redirect.
2. The destination page renders a canonical URL without `v` or any other query string.
3. `robots.txt` allows the legacy request instead of blocking it, so crawlers can see and consolidate the redirect signal.

Canonical paths remain route-relative in each page's Next.js metadata. Next.js resolves them against `metadataBase`, which comes from `NEXT_PUBLIC_SITE_BASE` through `src/lib/site.server.ts`. Product pages derive their canonical path from the resolved product slug.

Do not restore the former `/*?v=` or `/*?v%3D` robots disallow rules while the redirect is active. Blocking these URLs would prevent crawlers from consistently observing the redirect.

## Automated verification

`tests/e2e/legacy-v-redirects.spec.ts` covers:

- home, collection, informational-content, and product routes;
- permanent redirect status and clean destinations;
- removal of repeated `v` parameters;
- preservation of unrelated query parameters;
- successful requests to the destination, proving there is no redirect loop;
- clean rendered canonical metadata; and
- the absence of the legacy rules from `robots.txt`.

Run the focused regression test with:

```bash
npx playwright test tests/e2e/legacy-v-redirects.spec.ts
```

Run the complete local verification before review:

```bash
npm run lint
npm run typecheck
npm run test:fixtures
npm run build:ci
npm run test:e2e
```

These checks use the local mock API and do not depend on production data.

## Post-deployment verification

After deployment, verify the production host with read-only requests. Use a real product slug for the product example.

```bash
curl -I "https://zvychajna.pp.ua/?v=legacy"
curl -I "https://zvychajna.pp.ua/books?v=legacy&utm_source=seo-check"
curl -I "https://zvychajna.pp.ua/about?v=legacy"
curl -I "https://zvychajna.pp.ua/books/example?v=legacy"
```

Each response must be `308`, and its `Location` must omit `v` while retaining unrelated parameters. Request each destination separately and confirm it does not redirect again.

Also verify the hosting redirects still converge on the HTTPS apex host:

```bash
curl -IL "http://zvychajna.pp.ua/books?v=legacy"
curl -IL "https://www.zvychajna.pp.ua/books?v=legacy"
```

Finally, inspect `https://zvychajna.pp.ua/robots.txt` and the rendered `<link rel="canonical">` on the destination pages. The robots response must not disallow `v` variants, and every canonical URL must use the clean HTTPS apex URL without a query string.

