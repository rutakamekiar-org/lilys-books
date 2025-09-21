// Next.js configuration for GitHub Pages static export
// - output: 'export' generates a static site in ./out
// - basePath is set to "/<repo>" on CI for project pages, but DISABLED when a custom domain (CNAME) is present
// - images.unoptimized is required for static export when using next/image
import fs from 'node:fs';
import path from 'node:path';

const isCI = process.env.GITHUB_ACTIONS === 'true';
const repo = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? '';

// Detect if a custom domain is configured. If a CNAME file exists at the repo root
// or an explicit env var is set, we should NOT prepend basePath.
const repoRoot = process.cwd();
const hasCNAME = fs.existsSync(path.join(repoRoot, 'CNAME'));
const hasCustomDomainEnv = Boolean(process.env.PAGES_CUSTOM_DOMAIN || process.env.NEXT_PUBLIC_SITE_BASE);
const useBasePath = isCI && repo && !hasCNAME && !hasCustomDomainEnv;

/** @type {import('next').NextConfig} */
const config = {
  output: 'export',
  basePath: useBasePath ? `/${repo}` : '',
  images: { unoptimized: true },
  env: {
    NEXT_PUBLIC_BUILD_ID: process.env.GITHUB_SHA?.slice(0, 7) || String(Date.now()),
  },
};

export default config;
