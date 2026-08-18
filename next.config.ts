import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/slidify", destination: "/slider", permanent: false },
      { source: "/slidify/:path*", destination: "/slider/:path*", permanent: false },
    ];
  },
};

export default nextConfig;
