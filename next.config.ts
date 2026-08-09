import type { NextConfig } from 'next';
const nextConfig: NextConfig = { reactStrictMode: true, output: 'export', trailingSlash: true, basePath: '/vibhu-tech-blog', assetPrefix: '/vibhu-tech-blog/', images: { unoptimized: true } };
export default nextConfig;