import type { NextConfig } from "next";

// The Django backend runs alongside this dev server. Browsers only ever
// talk to the Next.js origin — this rewrite proxies /api/* to Django
// server-side, so it keeps working even when the app is viewed through a
// forwarded/remote port where "localhost:8001" wouldn't resolve for the
// viewer's own browser.
const API_ORIGIN = process.env.API_PROXY_ORIGIN ?? "http://localhost:8001";

const nextConfig: NextConfig = {
  // Allow the dev server (HMR websocket etc.) to be reached through the
  // container's network/forwarded address, not just localhost.
  allowedDevOrigins: ["160.236.72.175", "160-236-72-175.sslip.io"],
  // Django (APPEND_SLASH) always wants a trailing slash on /api/*. Without
  // this, Next.js's own trailing-slash redirect fights Django's and the
  // two bounce the request back and forth forever.
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_ORIGIN}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
