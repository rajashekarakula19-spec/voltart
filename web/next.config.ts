import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  async rewrites() {
    const api = process.env.VOLTART_API_URL ?? "http://127.0.0.1:8000";
    return [
      { source: "/backend/:path*", destination: `${api}/:path*` },
    ];
  },
};

export default nextConfig;
