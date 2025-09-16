#!/bin/bash

# Railway + Ollama + Vercel 배포 스크립트

echo "🚀 Railway + Ollama + Vercel 배포 시작"

# 1. Railway CLI 설치
echo "📦 Railway CLI 설치 중..."
npm install -g @railway/cli

# 2. Railway 로그인
echo "🔐 Railway 로그인 중..."
railway login

# 3. 새 프로젝트 생성
echo "🏗️ Railway 프로젝트 생성 중..."
railway new meta-faq-ollama

# 4. Ollama 서비스 추가
echo "🤖 Ollama 서비스 추가 중..."
railway add ollama

# 5. 환경변수 설정
echo "⚙️ 환경변수 설정 중..."
railway variables set OLLAMA_MODELS=llama3.2:3b
railway variables set OLLAMA_HOST=0.0.0.0
railway variables set OLLAMA_PORT=11434

# 6. Railway 배포
echo "🚀 Railway 배포 중..."
railway up

# 7. Railway URL 확인
echo "🔗 Railway URL 확인 중..."
RAILWAY_URL=$(railway status --json | jq -r '.deployments[0].url')
echo "Railway URL: $RAILWAY_URL"

# 8. Vercel 환경변수 설정 안내
echo "📝 Vercel 환경변수 설정 안내:"
echo "RAILWAY_OLLAMA_URL=$RAILWAY_URL"
echo ""
echo "Vercel 대시보드에서 위 환경변수를 설정해주세요."

echo "✅ Railway + Ollama 배포 완료!"
