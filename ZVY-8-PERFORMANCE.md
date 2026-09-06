# ZVY-8 mobile performance

Lighthouse was run with its mobile profile against the Netlify deployment before the image-delivery changes.

| Page | Performance | LCP | FCP | TBT | Transfer | Image transfer |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `/` | 74 | 7.26 s | 1.34 s | 128 ms | 0.91 MB | — |
| `/events` | 70 | 11.08 s | 1.61 s | 175 ms | 37.11 MB | 36.27 MB |

The homepage LCP element was the hero book image, which was marked for lazy loading. The events page loaded every original carousel image in order to detect its orientation; individual files were as large as 6.13 MB.

After the change:

- the homepage hero is prioritized;
- catalog and gallery images declare responsive display sizes for `next/image`;
- carousel slides after the first are mounted only when they approach the visible rail;
- checked-in dimensions determine `cover` versus `contain`, so orientation detection no longer downloads original files;
- source images under `public/images` total about 9 MB instead of 59 MB.

Run the same mobile Lighthouse measurements against the new Netlify deployment and add the final scores here before closing ZVY-8.
