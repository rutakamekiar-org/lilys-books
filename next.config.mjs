/** @type {import('next').NextConfig} */
const config = {
  images: {
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
