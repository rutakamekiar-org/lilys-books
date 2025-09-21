// Utilities for handling basePath on GitHub Pages
// When the site is deployed under /<repo>, absolute paths like "/images/..."
// must be prefixed with the basePath. We expose NEXT_PUBLIC_BASE_PATH from
// next.config.mjs and use it here.

export function addBasePath(urlOrPath: string): string {
  if (!urlOrPath) return urlOrPath;
  // Leave full URLs untouched
  if (/^https?:\/\//i.test(urlOrPath)) return urlOrPath;

  const base = process.env.NEXT_PUBLIC_BASE_PATH || "";

  // If already prefixed with base, return as-is
  if (base && urlOrPath.startsWith(base + "/")) return urlOrPath;

  // Ensure we only prefix leading-rooted paths "/..."; for relative paths, return as-is
  if (urlOrPath.startsWith("/")) return `${base}${urlOrPath}`;

  return urlOrPath;
}

// Adds basePath and appends a version query (?v=BUILD_ID) for cache-busting of pages/links.
// This should be used for internal navigation links that point to HTML pages.
export function withCacheBust(path: string): string {
  if (!path) return path;
  // Keep absolute URLs as-is
  if (/^https?:\/\//i.test(path)) return path;

  const version = process.env.NEXT_PUBLIC_BUILD_ID || "";
  const withBase = addBasePath(path);

  // Only apply to root-relative paths ("/..."), otherwise return as-is
  if (!withBase.startsWith("/")) return withBase;
  if (!version) return withBase;

  // If a query already exists, append with &; otherwise add ?
  return withBase.includes("?") ? `${withBase}&v=${encodeURIComponent(version)}` : `${withBase}?v=${encodeURIComponent(version)}`;
}
