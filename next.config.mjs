/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [320, 480, 720, 960, 1200, 1920],
  },
};

export default nextConfig;
