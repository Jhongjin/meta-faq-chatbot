/** @type {import('next').NextConfig} */
const nextConfig = {
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
  // Next.js 14.x 안정성 설정
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js'],
  },
  
  // Webpack 설정 단순화
  webpack: (config, { isServer }) => {
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
      };
    }

    // 바이너리 파일 처리 설정
    config.module.rules.push({
      test: /\.node$/,
      use: 'node-loader',
    });

    // onnxruntime-node 바이너리 파일 제외
    config.externals = config.externals || [];
    config.externals.push({
      'onnxruntime-node': 'commonjs onnxruntime-node',
    });

    return config;
  },
};

module.exports = nextConfig;

