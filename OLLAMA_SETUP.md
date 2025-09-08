# Ollama 서버 설정 가이드

## Vercel에서 Ollama 사용하기

Vercel은 서버리스 환경이므로 로컬 Ollama 서버를 직접 실행할 수 없습니다. 하지만 외부 Ollama 서버를 사용할 수 있습니다.

## 1. 외부 Ollama 서버 설정

### 옵션 1: 클라우드 서비스 사용
- **Railway**: https://railway.app
- **Render**: https://render.com
- **DigitalOcean App Platform**: https://www.digitalocean.com/products/app-platform

### 옵션 2: VPS에 Ollama 설치
```bash
# Ubuntu/Debian
curl -fsSL https://ollama.ai/install.sh | sh
ollama serve
ollama pull qwen2.5:7b
```

### 옵션 3: Docker로 Ollama 실행
```bash
docker run -d -v ollama:/root/.ollama -p 11434:11434 --name ollama ollama/ollama
docker exec -it ollama ollama pull qwen2.5:7b
```

## 2. Vercel 환경 변수 설정

Vercel 대시보드에서 다음 환경 변수를 설정하세요:

```bash
# 외부 Ollama 서버 URL
OLLAMA_BASE_URL=https://your-ollama-server.com

# 사용할 모델
OLLAMA_MODEL=qwen2.5:7b
```

## 3. 보안 설정

### CORS 설정
Ollama 서버에서 CORS를 허용하도록 설정:

```bash
# 환경 변수로 CORS 허용
export OLLAMA_ORIGINS="https://your-vercel-app.vercel.app"
```

### 인증 설정 (선택사항)
```bash
# API 키 설정
export OLLAMA_API_KEY="your-secret-key"
```

## 4. 대안 LLM 서비스

Ollama 대신 다른 LLM 서비스를 사용할 수도 있습니다:

### OpenAI API
```bash
OPENAI_API_KEY=your-openai-key
OPENAI_MODEL=gpt-3.5-turbo
```

### Anthropic Claude
```bash
ANTHROPIC_API_KEY=your-claude-key
ANTHROPIC_MODEL=claude-3-sonnet-20240229
```

### Google Gemini
```bash
GOOGLE_API_KEY=your-gemini-key
GOOGLE_MODEL=gemini-pro
```

## 5. 테스트 방법

환경 변수 설정 후 다음 URL로 테스트:

```
https://your-app.vercel.app/api/chatbot
```

GET 요청으로 API 상태를 확인하고, POST 요청으로 챗봇 기능을 테스트하세요.

## 6. 비용 고려사항

- **Ollama 서버**: VPS 비용 (월 $5-20)
- **OpenAI API**: 사용량 기반 (월 $10-50)
- **Claude API**: 사용량 기반 (월 $10-50)

## 7. 권장사항

1. **개발 단계**: 로컬 Ollama 사용
2. **프로덕션**: 외부 Ollama 서버 또는 OpenAI API
3. **비용 최적화**: 사용량에 따라 선택
4. **성능**: Ollama > OpenAI > Claude (응답 속도 기준)
