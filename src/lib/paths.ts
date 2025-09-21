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
