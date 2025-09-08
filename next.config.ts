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
  // output: 'standalone', // 임시로 비활성화
  // 서버 사이드 전용 패키지들을 외부화
  serverExternalPackages: ['@supabase/supabase-js', '@xenova/transformers', 'pdf-parse', 'mammoth', 'tesseract.js', 'puppeteer', 'puppeteer-extra', 'puppeteer-extra-plugin-stealth', 'xml2js', 'nodemailer'],
  
  // API 라우트 설정 (Next.js 15에서는 자동 처리)
  
  // 실험적 기능 설정
  experimental: {
    optimizeCss: false,
  },
  
  // 캐시 무효화를 위한 설정
  generateBuildId: async () => {
    return `build-${Date.now()}`;
  },
  
  // Webpack 설정 단순화
  webpack: (config, { isServer }) => {
    // .node 파일 처리
    config.module.rules.push({
      test: /\.node$/,
      use: 'node-loader',
    });

    // 클라이언트 사이드에서 서버 전용 모듈 제외
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
        nodemailer: false,
      };
    }

    return config;
  },
  // experimental 설정 제거 (Next.js 15에서 deprecated)
};

export default nextConfig;
