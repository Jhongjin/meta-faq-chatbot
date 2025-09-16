# Railway + Ollama + Vercel 배포 가이드

## 1. Railway에서 Ollama 서버 설정

### Railway 프로젝트 생성
```bash
# Railway CLI 설치
npm install -g @railway/cli

# Railway 로그인
railway login

# 새 프로젝트 생성
railway new meta-faq-ollama

# Ollama 서비스 추가
railway add ollama
```

### Railway 설정 파일
```yaml
# railway.toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "ollama serve"
```

### 환경변수 설정
```bash
# Railway에서 환경변수 설정
railway variables set OLLAMA_MODELS=llama3.2:3b
railway variables set OLLAMA_HOST=0.0.0.0
railway variables set OLLAMA_PORT=11434
```

## 2. Vercel에서 Railway API 호출

### API 라우트 수정
```typescript
// src/app/api/chat-railway/route.ts
const RAILWAY_OLLAMA_URL = process.env.RAILWAY_OLLAMA_URL;

export async function POST(request: NextRequest) {
  const { message } = await request.json();
  
  const response = await fetch(`${RAILWAY_OLLAMA_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama3.2:3b',
      prompt: message,
      stream: false
    })
  });
  
  const data = await response.json();
  return NextResponse.json({ answer: data.response });
}
```

## 3. 환경변수 설정

### Vercel 환경변수
```bash
RAILWAY_OLLAMA_URL=https://meta-faq-ollama-production.up.railway.app
```

### Railway 환경변수
```bash
OLLAMA_MODELS=llama3.2:3b
OLLAMA_HOST=0.0.0.0
OLLAMA_PORT=11434
```

## 4. 배포 순서

1. Railway에서 Ollama 서버 배포
2. Vercel에서 Railway API 호출하도록 수정
3. 환경변수 설정
4. 테스트 및 검증

## 5. 비용 비교

- **Railway**: 월 $5 (기본 플랜)
- **Vultr**: 월 $6 (1GB RAM)
- **Hugging Face**: 월 $9 (Pro 플랜)

Railway가 가장 경제적이고 Vercel과 호환성이 좋습니다.
