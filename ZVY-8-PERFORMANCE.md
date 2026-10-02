# ZVY-8 mobile performance

Lighthouse was run with its mobile profile against the Netlify deployment before the image-delivery changes.

| Page | Version | Performance | LCP | FCP | TBT | Transfer | Image transfer | Image requests |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `/` | Before | 74 | 7.26 s | 1.34 s | 128 ms | 0.91 MB | 0.07 MB | 3 |
| `/` | After | 97 | 2.30 s | 1.29 s | 98 ms | 0.91 MB | 0.07 MB | 3 |
| `/events` | Before | 70 | 11.08 s | 1.61 s | 175 ms | 37.11 MB | 36.27 MB | 37 |
| `/events` | After | 67 | 7.57 s | 3.10 s | 132 ms | 1.17 MB | 0.33 MB | 8 |

The homepage LCP element was the hero book image, which was marked for lazy loading. The events page loaded every original carousel image in order to detect its orientation; individual files were as large as 6.13 MB.

After the deployed change:

- the homepage hero is prioritized;
- catalog and gallery images declare responsive display sizes for `next/image`;
- carousel slides after the first are mounted only when they approach the visible rail;
- checked-in dimensions determine `cover` versus `contain`, so orientation detection no longer downloads original files;
- source images under `public/images` total about 9 MB instead of 59 MB.

The `/events` performance score varied down by three points because that run's first contentful paint was slower. The image-specific measurements improved substantially: LCP dropped by 3.51 seconds and image transfer dropped by 35.94 MB. Lighthouse loaded only optimized `/_next/image` responses for visible content instead of the original gallery files.
