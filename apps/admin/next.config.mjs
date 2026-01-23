const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
        port: ""
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: ""
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        port: ""
      },
      {
        protocol: "https",
        hostname: "pub-b7fd9c30cdbf439183b75041f5f71b92.r2.dev",
        port: ""
      }
    ]
  },
  turbopack: {
    root: process.cwd()
  },
  async rewrites() {
    const target = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "";
    if (!target) return [];
    const base = target.endsWith("/api") ? target : `${target}/api`;
    return [
      {
        source: "/api/:path*",
        destination: `${base}/:path*`
      }
    ];
  }
};

export default nextConfig;
