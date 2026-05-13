/** @type {import('next').NextConfig} */
const nextConfig = {
  // MOVED TO ROOT: Allow LAN access from specific IP without "Blocked" error
  allowedDevOrigins: ["192.168.8.104", "localhost"],

  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
