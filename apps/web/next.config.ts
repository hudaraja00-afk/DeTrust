import type { NextConfig } from 'next';
import type { RemotePattern } from 'next/dist/shared/lib/image-config';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const apiUploadPattern: RemotePattern = (() => {
  try {
    const parsed = new URL(apiUrl);
    const pathname = `${parsed.pathname.replace(/\/$/, '')}/uploads/**`;
    const protocol: RemotePattern['protocol'] = parsed.protocol === 'https:' ? 'https' : 'http';
    return {
      protocol,
      hostname: parsed.hostname,
      port: parsed.port || undefined,
      pathname,
    } satisfies RemotePattern;
  } catch (error) {
    console.warn('Invalid NEXT_PUBLIC_API_URL supplied, falling back to localhost:4000');
    return {
      protocol: 'http',
      hostname: 'localhost',
      port: '4000',
      pathname: '/api/uploads/**',
    } satisfies RemotePattern;
  }
})();

const nextConfig: NextConfig = {
  // Enable React strict mode
  reactStrictMode: true,

  // Transpile packages from monorepo
  transpilePackages: ['@detrust/types', '@detrust/config'],

  // Tree-shake barrel imports for heavy libraries (Vercel bundle-barrel-imports rule)
  // This tells the bundler to resolve named imports to individual modules,
  // avoiding the full 1,583-module lucide-react parse, etc.
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'recharts',
      '@radix-ui/react-icons',
      'framer-motion',
      'date-fns',
      // NOTE: Do NOT add @rainbow-me/rainbowkit here — it uses React context
      // internally (QueryClientProvider) and optimizePackageImports breaks the
      // context wiring, causing "No QueryClient set" errors at runtime.
    ],
  },
  
  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      apiUploadPattern,
    ],
  },
  
  // Turbopack (default for dev in Next.js 16)
  // Force @tanstack/react-query to resolve to a single ESM entry so that
  // Turbopack doesn't create duplicate module instances (CJS vs ESM) which
  // would cause separate React contexts and "No QueryClient set" errors.
  turbopack: {
    resolveAlias: {
      '@tanstack/react-query':
        './node_modules/@tanstack/react-query/build/modern/index.js',
    },
  },

  // Webpack configuration (used for production build via --webpack flag)
  webpack: (config) => {
    // Handle native modules for WalletConnect/RainbowKit
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    
    // Fix for @metamask/sdk and other SSR issues
    config.resolve.fallback = {
      ...config.resolve.fallback,
      'idb-keyval': false,
      '@react-native-async-storage/async-storage': false,
    };

    return config;
  },
  
  // Headers for security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  
  // Redirects
  async redirects() {
    return [
      {
        source: '/app',
        destination: '/dashboard',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
