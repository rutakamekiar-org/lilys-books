# SEO, URL normalization, and sitemap discovery

This document describes how the storefront keeps one indexable URL for each page, with particular attention to legacy URLs that contain the `v` query parameter and the sitemap submitted to search engines.

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

## Sitemap generation

`src/app/sitemap.ts` is the source of truth for `sitemap.xml`. It includes each indexable route exactly once:

- the homepage and book collection;
- every active product returned by the BookPreorder product API; and
- `/events`, `/about`, and `/return-policy`.

API routes, Next.js resources, inactive products, fragments, and query-string variants are not sitemap entries. Product entries are sorted for stable output and the final URL list is deduplicated defensively.

The sitemap intentionally omits `lastmod`. The storefront product contract does not currently expose a reliable content modification time, and deployment time is not a content modification time. Add `lastmod` only when the relevant content source provides a trustworthy value for each entry.

## Automated verification

`tests/e2e/legacy-v-redirects.spec.ts` covers:

- home, collection, informational-content, and product routes;
- permanent redirect status and clean destinations;
- removal of repeated `v` parameters;
- preservation of unrelated query parameters;
- successful requests to the destination, proving there is no redirect loop;
- clean rendered canonical metadata; and
- the absence of the legacy rules from `robots.txt`.

`tests/e2e/sitemap.spec.ts` parses the generated XML and verifies the exact indexable route set, uniqueness, clean canonical URLs, direct page availability, exclusion of inactive products, and omission of unsupported `lastmod` values.

Run the focused regression test with:

```bash
npx playwright test tests/e2e/legacy-v-redirects.spec.ts
npx playwright test tests/e2e/sitemap.spec.ts
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

### Sitemap and Search Console

Fetch the deployed sitemap as a normal client and as Googlebot. Both responses must be HTTP 200, use an XML content type, contain unique canonical HTTPS URLs, omit query strings, and omit `lastmod` until reliable dates are available.

```bash
curl -i "https://zvychajna.pp.ua/sitemap.xml"
curl -i -A "Googlebot" "https://zvychajna.pp.ua/sitemap.xml"
```

After production verification:

1. Resubmit `https://zvychajna.pp.ua/sitemap.xml` in Google Search Console.
2. Wait until Search Console reports a successful read and a non-zero discovered-page count.
3. Only then request indexing for `/events`, `/about`, and `/return-policy`.
4. Record the deployment verification date, sitemap submission date, processing result, discovered-page count, and indexing-request dates on the Linear issue.
