/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/voice-ai-benchmarks',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig