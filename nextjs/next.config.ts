import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  images: {
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
    optimizePackageImports: ['lucide-react', '@radix-ui/react-dialog', '@radix-ui/react-alert-dialog'],
  },
};

export default nextConfig;
