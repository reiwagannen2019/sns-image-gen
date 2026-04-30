/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Tauriでの動作に必須の設定です
  images: {
    unoptimized: true, // Tauri(静的サイト)では画像を最適化できないためオフにします
  },
};

export default nextConfig;