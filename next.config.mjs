/** @type {import('next').NextConfig} */
const config = {
  images: {
    // Let small covers use an appropriate candidate at the device's pixel density.
    deviceSizes: [360, 480, 640, 750, 828, 1080, 1200, 1440, 1600, 1920, 2048, 3840],
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
