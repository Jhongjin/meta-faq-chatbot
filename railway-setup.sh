#!/bin/bash

# Railway + Ollama 설정 스크립트

echo "🚂 Railway Ollama 설정 시작..."

# 1. Railway CLI 설치 확인
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI가 설치되지 않았습니다."
    echo "다음 명령어로 설치하세요:"
    echo "npm install -g @railway/cli"
    exit 1
fi

# 2. Railway 로그인
echo "🔐 Railway 로그인..."
railway login

# 3. 프로젝트 생성
echo "📁 Railway 프로젝트 생성..."
railway init

# 4. Ollama 서비스 배포
echo "🚀 Ollama 서비스 배포..."
railway up

# 5. 환경변수 설정
echo "⚙️ 환경변수 설정..."
railway variables set OLLAMA_HOST=0.0.0.0
railway variables set OLLAMA_ORIGINS=*

# 6. 모델 설치
echo "📦 Ollama 모델 설치..."
railway run ollama pull mistral:7b

# 7. 서비스 URL 확인
echo "🔗 서비스 URL 확인..."
railway status

echo "✅ Railway Ollama 설정 완료!"
echo "📝 Vercel 환경변수에 다음 URL을 추가하세요:"
railway domain