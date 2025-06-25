import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  images: {
    formats: ['image/webp', 'image/avif'],
  },
  experimental: {
    webpackMemoryOptimizations: true,
    optimizePackageImports: ['lucide-react', '@radix-ui/react-dialog', '@radix-ui/react-alert-dialog'],
  },
};

export default nextConfig;
