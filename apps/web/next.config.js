/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@rdn/shared'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.example.com',
      },
    ],
  },
};

module.exports = nextConfig;
