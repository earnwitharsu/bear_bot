/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    config.externals.push('encoding', 'bufferutil', 'utf-8-validate');
    return config;
  },
}

export default nextConfig;