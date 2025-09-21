// Next.js configuration for GitHub Pages static export
// - output: 'export' generates a static site in ./out
// - basePath and assetPrefix are set automatically on GitHub Actions to 
//   "/<repo>" so it works for project pages (user.github.io/<repo>)
// - images.unoptimized is required for static export when using next/image
const isCI = process.env.GITHUB_ACTIONS === 'true';
const repo = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? '';

/** @type {import('next').NextConfig} */
const config = {
  output: 'export',
  basePath: isCI && repo ? `/${repo}` : '',
  assetPrefix: isCI && repo ? `/${repo}/` : '',
  images: { unoptimized: true },
  env: {
    NEXT_PUBLIC_BASE_PATH: isCI && repo ? `/${repo}` : '',
    NEXT_PUBLIC_BUILD_ID: process.env.GITHUB_SHA?.slice(0, 7) || String(Date.now()),
  },
};

export default config;
