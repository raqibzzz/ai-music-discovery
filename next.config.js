/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  webpack(config) {
    return config;
  },
  images: {
    domains: ['i.scdn.co'],
  },
};

module.exports = nextConfig; 