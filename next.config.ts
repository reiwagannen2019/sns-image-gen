/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Tauriで動かすために静的書き出しを有効にします
  images: {
    unoptimized: true, // 画像最適化をオフにします
  },
};

export default nextConfig;