import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        hostname: '**',
      },
    ],
  },
  output: 'standalone',
  serverExternalPackages: ['@supabase/supabase-js', '@xenova/transformers', 'pdf-parse', 'mammoth', 'tesseract.js', 'puppeteer', 'puppeteer-extra', 'puppeteer-extra-plugin-stealth', 'xml2js'],
  // CSS 로딩 문제 해결을 위한 설정
  experimental: {
    optimizeCss: false,
  },
  webpack: (config, { isServer }) => {
    // Transformers.js 관련 바이너리 파일 처리
    config.module.rules.push({
      test: /\.node$/,
      use: 'node-loader',
    });


    // 서버 사이드에서만 사용되는 패키지들을 클라이언트 번들에서 제외
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        crypto: false,
        net: false,
        tls: false,
        dns: false,
        'pdf-parse': false,
        mammoth: false,
        'tesseract.js': false,
        puppeteer: false,
        'puppeteer-extra': false,
        'puppeteer-extra-plugin-stealth': false,
        xml2js: false,
      };
    }

    return config;
  },
  // experimental 설정 제거 (Next.js 15에서 deprecated)
};

export default nextConfig;
