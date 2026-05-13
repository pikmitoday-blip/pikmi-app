/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['res.cloudinary.com', 'r2.cloudflare.com'],
  },
};

module.exports = nextConfig;
