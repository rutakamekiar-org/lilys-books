/** @type {import('next').NextConfig} */
const config = {
  // Local parallel e2e shards (tools/test-e2e-parallel.mjs) each build into their own directory.
  // Their generated tsconfig already lists those directories' types, so tsconfig.json stays untouched.
  ...(process.env.E2E_DIST_DIR && {
    distDir: process.env.E2E_DIST_DIR,
    typescript: { tsconfigPath: process.env.E2E_TSCONFIG_PATH },
  }),
  images: {
    // Prefer AVIF (typically 20-30% smaller than WebP); browsers without it still get WebP.
    formats: ["image/avif", "image/webp"],
    // Let small covers use an appropriate candidate at the device's pixel density.
    deviceSizes: [360, 480, 640, 750, 828, 1080, 1200, 1440, 1600, 1920, 2048, 3840],
    imageSizes: [32, 48, 64, 96, 128, 192, 256, 384],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "zvychajna.pp.ua",
        pathname: "/images/**",
      },
    ],
  },
};

export default config;
