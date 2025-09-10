# Render + Ollama 프로덕션 설정 가이드

## 1. Render 계정 및 프로젝트 설정

### 1.1 Render 계정 생성
1. [Render.com](https://render.com) 접속
2. "Get Started for Free" 클릭
3. GitHub 계정으로 로그인 (권장)

### 1.2 새 프로젝트 생성
1. Dashboard에서 "New +" 클릭
2. "Web Service" 선택
3. GitHub 저장소 연결

## 2. Ollama 서버 배포

### 2.1 Ollama 전용 서비스 생성
1. Render Dashboard에서 "New +" 클릭
2. "Web Service" 선택
3. "Build and deploy from a Git repository" 선택
4. GitHub 저장소 연결

### 2.2 Ollama 서비스 설정
- **Name**: `meta-faq-ollama`
- **Environment**: `Docker`
- **Region**: `Oregon (US West)` (가장 안정적)
- **Branch**: `main`
- **Root Directory**: `/` (루트 디렉토리)
- **Dockerfile Path**: `Dockerfile.ollama`

### 2.3 Ollama 서비스 환경 변수
```
OLLAMA_HOST=0.0.0.0
OLLAMA_MODELS=/root/.ollama/models
```

### 2.4 Ollama 서비스 리소스 설정
- **Plan**: `Free` (무료 티어)
- **Memory**: `1GB` (무료 티어 최대)
- **CPU**: `0.1 CPU` (무료 티어)

## 3. Next.js 앱 배포

### 3.1 Next.js 서비스 생성
1. Render Dashboard에서 "New +" 클릭
2. "Web Service" 선택
3. "Build and deploy from a Git repository" 선택
4. GitHub 저장소 연결

### 3.2 Next.js 서비스 설정
- **Name**: `meta-faq-app`
- **Environment**: `Node`
- **Region**: `Oregon (US West)`
- **Branch**: `main`
- **Root Directory**: `/` (루트 디렉토리)
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

### 3.3 Next.js 서비스 환경 변수
```
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Ollama 설정 (Render 서버)
OLLAMA_BASE_URL=https://meta-faq-ollama.onrender.com
OLLAMA_MODEL=qwen2.5:7b

# Next.js 설정
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://meta-faq-app.onrender.com
```

### 3.4 Next.js 서비스 리소스 설정
- **Plan**: `Free` (무료 티어)
- **Memory**: `512MB` (무료 티어)
- **CPU**: `0.1 CPU` (무료 티어)

## 4. 배포 순서

### 4.1 1단계: Ollama 서버 배포
1. Ollama 서비스 생성 및 설정
2. 배포 시작 (약 5-10분 소요)
3. 배포 완료 후 URL 확인: `https://meta-faq-ollama.onrender.com`

### 4.2 2단계: Next.js 앱 배포
1. Next.js 서비스 생성 및 설정
2. 환경 변수에서 Ollama URL 설정
3. 배포 시작 (약 3-5분 소요)
4. 배포 완료 후 URL 확인: `https://meta-faq-app.onrender.com`

## 5. 무료 티어 제한사항

### 5.1 Ollama 서버 제한
- **메모리**: 1GB (qwen2.5:7b 모델 실행 가능)
- **CPU**: 0.1 CPU (응답 속도 느림)
- **슬립 모드**: 15분 비활성 시 자동 슬립
- **월 사용량**: 750시간 (무료)

### 5.2 Next.js 앱 제한
- **메모리**: 512MB
- **CPU**: 0.1 CPU
- **슬립 모드**: 15분 비활성 시 자동 슬립
- **월 사용량**: 750시간 (무료)

## 6. 최적화 설정

### 6.1 Ollama 서버 최적화
```dockerfile
# Dockerfile.ollama 최적화
FROM ollama/ollama:latest

# 모델 사전 다운로드
RUN ollama pull qwen2.5:7b

# 메모리 최적화
ENV OLLAMA_NUM_PARALLEL=1
ENV OLLAMA_MAX_LOADED_MODELS=1

EXPOSE 11434
CMD ["ollama", "serve"]
```

### 6.2 Next.js 앱 최적화
```javascript
// next.config.ts
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@xenova/transformers']
  },
  webpack: (config) => {
    config.externals = [...config.externals, 'canvas', 'jsdom'];
    return config;
  }
};
```

## 7. 모니터링 및 유지보수

### 7.1 Render Dashboard 모니터링
- CPU 사용률
- 메모리 사용률
- 응답 시간
- 에러 로그

### 7.2 자동 재시작 설정
- **Health Check**: `/api/health` 엔드포인트 생성
- **Auto Deploy**: GitHub push 시 자동 배포
- **Rollback**: 문제 발생 시 이전 버전으로 롤백

## 8. 비용 최적화

### 8.1 무료 티어 활용
- Ollama 서버: 월 750시간 무료
- Next.js 앱: 월 750시간 무료
- 총 월 1,500시간 무료 사용 가능

### 8.2 슬립 모드 대응
- 첫 요청 시 30-60초 지연 (슬립에서 깨어남)
- Keep-alive 스크립트로 슬립 방지
- 사용자에게 로딩 상태 표시

## 9. 문제 해결

### 9.1 일반적인 문제
- **슬립 모드**: 첫 요청 시 지연 시간 발생
- **메모리 부족**: 모델 크기 줄이기 또는 유료 플랜 업그레이드
- **응답 속도**: CPU 제한으로 인한 느린 응답

### 9.2 로그 확인
- Render Dashboard > Logs 탭에서 실시간 로그 확인
- 에러 발생 시 스택 트레이스 분석
- 성능 메트릭 모니터링

## 10. 확장 계획

### 10.1 유료 플랜 업그레이드
- **Starter Plan**: $7/월 (2GB RAM, 0.5 CPU)
- **Standard Plan**: $25/월 (4GB RAM, 1 CPU)
- **Pro Plan**: $85/월 (8GB RAM, 2 CPU)

### 10.2 고가용성 설정
- 여러 리전에 배포
- 로드 밸런서 설정
- 데이터베이스 복제

이 가이드를 따라하면 Render의 무료 티어를 활용하여 안정적인 Ollama 기반 챗봇을 프로덕션에 배포할 수 있습니다.
