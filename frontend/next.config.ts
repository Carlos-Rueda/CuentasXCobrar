import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  // Permite acceso desde la IP de red (no solo localhost)
  allowedDevOrigins: [
    "26.85.45.216",
    "http://26.85.45.216:3000",
  ],
};

export default nextConfig;