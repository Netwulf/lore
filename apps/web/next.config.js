/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@lore/editor', '@lore/ai', '@lore/db'],
};

module.exports = nextConfig;
