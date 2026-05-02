// Utilities for handling basePath on GitHub Pages
// When the site is deployed under /<repo>, absolute paths like "/images/..."
// must be prefixed with the basePath. We expose NEXT_PUBLIC_BASE_PATH from
// next.config.mjs and use it here.

export function addBasePath(urlOrPath: string): string {
  if (!urlOrPath) return urlOrPath;
  if (/^https?:\/\//i.test(urlOrPath)) return urlOrPath;

  const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
  if (base && urlOrPath.startsWith(`${base}/`)) return urlOrPath;
  if (urlOrPath.startsWith("/")) return `${base}${urlOrPath}`;
  return urlOrPath;
}

