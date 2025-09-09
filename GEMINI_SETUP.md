# Google Gemini API 설정 가이드

## Gemini API 키 발급

### 1. Google AI Studio 접속
1. **Google AI Studio** 접속: https://aistudio.google.com/
2. **Google 계정**으로 로그인
3. **Get API Key** 클릭
4. **Create API Key** 선택
5. **API 키 복사** 및 안전하게 보관

### 2. API 키 확인
- API 키는 `AIza...` 형태로 시작합니다
- 발급 후 즉시 사용 가능합니다
- 무료 할당량: 월 15회 요청 (제한적)

## Vercel 환경 변수 설정

### Vercel 대시보드에서 설정
1. **Vercel 대시보드** 접속: https://vercel.com/dashboard
2. **프로젝트 선택** → **Settings** → **Environment Variables**
3. 다음 환경 변수 추가:

```bash
# Google Gemini API 키 (필수)
GOOGLE_API_KEY=AIzaSyC...your-api-key-here

# 사용할 Gemini 모델 (선택사항)
GOOGLE_MODEL=gemini-1.5-flash
```

### 환경 변수 설명

| 변수명 | 필수 | 기본값 | 설명 |
|--------|------|--------|------|
| `GOOGLE_API_KEY` | ✅ | - | Google Gemini API 키 |
| `GOOGLE_MODEL` | ❌ | `gemini-1.5-flash` | 사용할 Gemini 모델 |

### 사용 가능한 모델

| 모델명 | 설명 | 특징 |
|--------|------|------|
| `gemini-1.5-flash` | 빠른 응답 | 빠른 속도, 일반적인 질문 |
| `gemini-1.5-pro` | 고품질 | 높은 품질, 복잡한 질문 |
| `gemini-1.0-pro` | 안정적 | 검증된 모델, 안정성 |

## 로컬 개발 환경 설정

### .env.local 파일 생성
프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용 추가:

```bash
# Google Gemini API 설정
GOOGLE_API_KEY=AIzaSyC...your-api-key-here
GOOGLE_MODEL=gemini-1.5-flash

# 기존 Supabase 설정 (유지)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-supabase-key
```

### .env.local 파일 보안
```bash
# .gitignore에 추가 (이미 포함되어 있음)
.env.local
.env*.local
```

## 비용 정보

### Gemini API 가격 (2024년 기준)

| 모델 | 입력 토큰 | 출력 토큰 | 특징 |
|------|-----------|-----------|------|
| **gemini-1.5-flash** | $0.075/1M | $0.30/1M | 빠르고 저렴 |
| **gemini-1.5-pro** | $1.25/1M | $5.00/1M | 고품질 |
| **gemini-1.0-pro** | $0.50/1M | $1.50/1M | 안정적 |

### 예상 비용 계산
- **일일 질문**: 100개
- **평균 토큰**: 500 토큰/질문
- **월 비용**: 약 $1-3 (gemini-1.5-flash 기준)

## 테스트 방법

### 1. API 키 테스트
```bash
curl -H "Content-Type: application/json" \
     -d '{"contents":[{"parts":[{"text":"안녕하세요"}]}]}' \
     "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=YOUR_API_KEY"
```

### 2. 애플리케이션 테스트
1. **환경 변수 설정** 완료
2. **애플리케이션 재시작**
3. **챗봇 페이지** 접속: https://your-app.vercel.app/chat
4. **간단한 질문** 입력: "안녕하세요"
5. **Gemini 응답** 확인

### 3. 로그 확인
브라우저 개발자 도구 콘솔에서 다음 로그 확인:
```
🔧 GeminiService 초기화: {hasApiKey: true, model: "gemini-1.5-flash"}
🤖 Gemini 답변 생성 시작: "안녕하세요..."
✅ Gemini 답변 생성 완료: 1234ms, 신뢰도: 0.85
```

## 문제 해결

### 일반적인 오류

#### 1. API 키 오류
```
❌ Google API 키가 설정되지 않았습니다.
```
**해결방법**: `GOOGLE_API_KEY` 환경 변수 확인

#### 2. 할당량 초과
```
❌ Gemini API 오류: 429 Quota exceeded
```
**해결방법**: 
- Google AI Studio에서 할당량 확인
- 유료 플랜으로 업그레이드
- 다른 모델 사용

#### 3. 모델 접근 권한
```
❌ Gemini API 오류: 403 Permission denied
```
**해결방법**: 
- API 키 권한 확인
- 모델명 확인 (`gemini-1.5-flash` 권장)

### 성능 최적화

#### 1. 모델 선택
- **빠른 응답**: `gemini-1.5-flash`
- **고품질**: `gemini-1.5-pro`
- **비용 절약**: `gemini-1.0-pro`

#### 2. 토큰 제한
```typescript
// 최대 토큰 수 제한
maxTokens: 1000  // 기본값: 2000
```

#### 3. 온도 설정
```typescript
// 창의성 조절
temperature: 0.3  // 기본값: 0.3 (0.0-1.0)
```

## 보안 고려사항

### 1. API 키 보안
- ✅ **환경 변수** 사용
- ✅ **Vercel Secrets** 활용
- ❌ **코드에 하드코딩** 금지
- ❌ **Git 저장소**에 커밋 금지

### 2. 요청 제한
- **Rate Limiting** 구현 권장
- **사용자당 일일 제한** 설정
- **비정상 요청** 모니터링

### 3. 데이터 보안
- **개인정보** 포함 질문 필터링
- **민감한 정보** 로깅 제외
- **응답 내용** 검토 및 필터링

## 다음 단계

1. **API 키 발급** 및 환경 변수 설정
2. **애플리케이션 배포** 및 테스트
3. **성능 모니터링** 및 최적화
4. **사용자 피드백** 수집 및 개선
