import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "*.ngrok-free.dev",
    "*.ngrok-free.app",
    "*.ngrok.app",
    "*.ngrok.io",
    "absurd-superman-disbelief.ngrok-free.dev",
    "*.trycloudflare.com",
    "192.168.1.44",
    "localhost:3000",
    "localhost:3001",
    "localhost:3002",
  ],
};

export default nextConfig;
