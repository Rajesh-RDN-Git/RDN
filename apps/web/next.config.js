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
  async headers() {
    return [
      {
        // Apple App Site Association — must be served as application/json
        // even though the filename has no extension.
        source: '/.well-known/apple-app-site-association',
        headers: [{ key: 'content-type', value: 'application/json' }],
      },
      {
        source: '/.well-known/assetlinks.json',
        headers: [{ key: 'content-type', value: 'application/json' }],
      },
    ];
  },
};

module.exports = nextConfig;
