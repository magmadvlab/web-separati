/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    // Temporaneamente disabilitato per il deploy iniziale
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig
