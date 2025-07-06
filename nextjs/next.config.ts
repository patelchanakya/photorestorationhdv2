import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  
  // Generate unique build ID for each deployment to prevent version skew
  generateBuildId: async () => {
    return process.env.VERCEL_GIT_COMMIT_SHA || 
           process.env.GITHUB_SHA || 
           Date.now().toString()
  },
  
  // Configure proper cache headers to prevent stale content
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
      {
        source: '/app/(.*)',
        headers: [
          {
            key: 'Cache-Control', 
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
  images: {
    unoptimized: true,
    formats: ['image/webp', 'image/avif'],
    remotePatterns: [
      // PROD: Production Supabase patterns
      {
        protocol: 'https',
        hostname: 'hhwugsiztorplhxztuei.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'hhwugsiztorplhxztuei.supabase.co',
        port: '',
        pathname: '/storage/v1/object/sign/**',
      },
      // PROD: General Supabase wildcard (backup)
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/sign/**',
      },
      // LOCAL: Local Supabase development patterns
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '54321',
        pathname: '/storage/v1/object/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '54321',
        pathname: '/storage/v1/object/**',
      },
      {
        protocol: 'http',
        hostname: 'kong',
        port: '8000',
        pathname: '/storage/v1/object/public/**',
      },
      // DEV: Ngrok for webhook testing
      {
        protocol: 'https',
        hostname: '*.ngrok-free.app',
        port: '',
        pathname: '/storage/v1/object/**',
      }
    ],
  },
  experimental: {
    webpackMemoryOptimizations: true,
    optimizePackageImports: [
      'lucide-react', 
      '@radix-ui/react-dialog', 
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-accordion',
      '@radix-ui/react-slot',
      'date-fns',
      'react-hook-form',
      'clsx',
      'class-variance-authority',
      'tailwind-merge',
      '@vercel/analytics',
      'posthog-js'
    ],
  },
  async rewrites() {
    return [
      {
        source: '/ingest/static/:path*',
        destination: 'https://us-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/ingest/:path*',
        destination: 'https://us.i.posthog.com/:path*',
      },
      {
        source: '/ingest/decide',
        destination: 'https://us.i.posthog.com/decide',
      },
    ];
  },
  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
  
  // Disable static optimization for dynamic pages
  trailingSlash: false,
  
  // Ensure proper revalidation
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
};

export default nextConfig;
