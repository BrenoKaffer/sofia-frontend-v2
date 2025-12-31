const path = require('path');

// Backend origins from environment for CSP connect-src
const BACKEND_URL = process.env.SOFIA_BACKEND_URL;
const BACKEND_ORIGIN = (() => { try { return new URL(BACKEND_URL).origin; } catch { return BACKEND_URL; } })();
const BACKEND_WS_URL = process.env.SOFIA_BACKEND_WS_URL;
const BACKEND_WS_ORIGIN = (() => { 
  try { const u = new URL(BACKEND_WS_URL); return `${u.protocol}//${u.host}`; } 
  catch { return BACKEND_WS_URL; } 
})();

// Conditionally load bundle analyzer only when needed and available
let withBundleAnalyzer;
try {
  if (process.env.ANALYZE === 'true') {
    withBundleAnalyzer = require('@next/bundle-analyzer')({
      enabled: true,
      openAnalyzer: false,
    });
  } else {
    withBundleAnalyzer = (config) => config;
  }
} catch (error) {
  // Bundle analyzer not available, use identity function
  withBundleAnalyzer = (config) => config;
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  // Bundle optimization
  compress: true,
  
  // Fix workspace root to this project to avoid incorrect inference in dev
  outputFileTracingRoot: path.resolve(__dirname),
  
  // Code splitting optimization
  experimental: {
    serverActions: {
      allowedOrigins: ['sofia-frontend-v2.vercel.app']
    },
    optimizeCss: true,
    optimizePackageImports: ['@radix-ui/react-icons', 'lucide-react', 'recharts', 'date-fns'],
  },
  
  // Turbopack configuration (moved from experimental)
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  
  // Performance optimizations
  poweredByHeader: false,
  generateEtags: false,
  
  // Caching headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()',
          },
          {
            key: 'Content-Security-Policy',
            value: `default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://checkout.stripe.com https://maps.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; media-src 'self' blob: https://mux.com https://*.mux.com; connect-src 'self' https://api.stripe.com https://checkout.stripe.com https://api.supabase.co https://*.supabase.co wss://*.supabase.co ${BACKEND_ORIGIN} ${BACKEND_WS_ORIGIN} https://mux.com https://*.mux.com https://stats.mux.com; frame-src 'self' https://js.stripe.com https://checkout.stripe.com https://hooks.stripe.com https://player.mux.com; object-src 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests;`,
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=60, stale-while-revalidate=300',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
        ],
      },
    ];
  },
  
  webpack: (config, { isServer }) => {
    // Alias para resolver imports de módulos node
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname),
    };

    // Production optimizations
    if (!isServer && process.env.NODE_ENV === 'production') {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\/]node_modules[\/]/,
              name: 'vendors',
              priority: 10,
              chunks: 'all',
            },
            radix: {
              test: /[\/]node_modules[\/]@radix-ui[\/]/,
              name: 'radix',
              priority: 20,
              chunks: 'all',
            },
          },
        },
      };
    }

    return config;
  },
};

module.exports = withBundleAnalyzer(nextConfig);
