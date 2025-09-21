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

// Appends a version query (?v=BUILD_ID) for cache-busting of pages/links.
// Do NOT add basePath here because Next.js <Link> and routing already account for basePath.
// Use this for internal navigation links that point to HTML pages.
export function withCacheBust(path: string): string {
  if (!path) return path;
  // Keep absolute URLs as-is
  if (/^https?:\/\//i.test(path)) return path;

  const version = process.env.NEXT_PUBLIC_BUILD_ID || "";

  // Only apply to root-relative paths ("/...") and only when version is available
  if (!version) return path;
  if (!path.startsWith("/")) return path;

  // If a query already exists, append with &; otherwise add ?
  return path.includes("?") ? `${path}&v=${encodeURIComponent(version)}` : `${path}?v=${encodeURIComponent(version)}`;
}
