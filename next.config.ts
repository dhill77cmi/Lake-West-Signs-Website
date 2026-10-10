import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Vercel Hobby allows ~5K image transformations/month; 3 sizes instead of the
    // default 8 keeps ~50 photos well inside that.
    deviceSizes: [640, 1080, 1920],
    minimumCacheTTL: 31536000,
  },
  async redirects() {
    return [
      ...(process.env.NODE_ENV === "development" ? [] : [
        { source: "/design-options/:path*", destination: "/", permanent: true },
      ]),
      { source: "/index.php", destination: "/", permanent: true },
      { source: "/about.php", destination: "/about", permanent: true },
      { source: "/vehicles.php", destination: "/services/vehicle-wraps", permanent: true },
      { source: "/commercial.php", destination: "/services/commercial-signs", permanent: true },
      { source: "/residential.php", destination: "/services/dock-signs", permanent: true },
      { source: "/join.html", destination: "/contact", permanent: true },
    ];
  },
};

export default (): NextConfig => ({
  ...nextConfig,
  // Independent build directories keep both E2E deployment variants isolated.
  distDir: process.env.E2E_DIST_DIR || ".next",
});
