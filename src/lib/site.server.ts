const PRODUCTION_SITE_URL = "https://zvychajna.pp.ua";

export function resolveSiteBaseUrl(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_BASE?.trim();
  if (configuredUrl) return configuredUrl.replace(/\/$/, "");
  return process.env.NODE_ENV === "production" ? PRODUCTION_SITE_URL : "http://localhost:3000";
}

export function absoluteUrl(urlOrPath: string): string {
  if (/^https?:\/\//i.test(urlOrPath)) return urlOrPath;
  const rootPath = urlOrPath.startsWith("/") ? urlOrPath : `/${urlOrPath}`;
  return `${resolveSiteBaseUrl()}${rootPath}`;
}
