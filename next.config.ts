import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuration pour les packages qui utilisent CommonJS
  transpilePackages: ['qrcode.react', 'lucide-react'],
  // Images domains si nécessaire
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
