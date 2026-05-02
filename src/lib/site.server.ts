import fs from "node:fs";
import path from "node:path";
import { addBasePath } from "@/lib/paths";

export function resolveSiteBaseUrl(): string {
  const envBase = process.env.NEXT_PUBLIC_SITE_BASE;
  if (envBase) return envBase.replace(/\/$/, "");

  const pagesCustomDomain = process.env.PAGES_CUSTOM_DOMAIN;
  if (pagesCustomDomain) return `https://${pagesCustomDomain.replace(/^https?:\/\//i, "").replace(/\/$/, "")}`;

  try {
    const cnamePath = path.join(process.cwd(), "CNAME");
    if (fs.existsSync(cnamePath)) {
      const domain = fs.readFileSync(cnamePath, "utf8").trim();
      if (domain) return `https://${domain}`;
    }
  } catch {
    // Fall through to the GitHub Pages or local development URL.
  }

  const repository = process.env.GITHUB_REPOSITORY;
  if (process.env.GITHUB_ACTIONS === "true" && repository) {
    const owner = repository.split("/")[0];
    if (owner) return `https://${owner}.github.io`;
  }

  return "http://localhost:3000";
}

export function absoluteUrl(urlOrPath: string): string {
  if (/^https?:\/\//i.test(urlOrPath)) return urlOrPath;
  const rootPath = urlOrPath.startsWith("/") ? urlOrPath : `/${urlOrPath}`;
  const pathName = addBasePath(rootPath);
  return `${resolveSiteBaseUrl()}${pathName}`;
}
