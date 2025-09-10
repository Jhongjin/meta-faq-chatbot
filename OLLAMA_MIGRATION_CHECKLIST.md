# Ollama 마이그레이션 체크리스트

## ✅ 완료된 작업

### 1. 코드 복원
- [x] LLMService.ts를 Ollama로 복원
- [x] RAGSearchService.ts를 Ollama로 복원
- [x] GeminiService 참조 제거

### 2. Render 배포 설정
- [x] Dockerfile.ollama 생성
- [x] docker-compose.ollama.yml 생성
- [x] render.yaml 설정 파일 생성
- [x] 환경 변수 설정 가이드 작성

### 3. 모니터링 및 유지보수
- [x] 헬스체크 API 생성 (/api/health)
- [x] Keep-alive 스크립트 생성
- [x] 로컬 테스트 스크립트 생성

## 🔄 다음 단계

### 1. 로컬 테스트
```bash
# 1. Ollama 서버 시작
ollama serve

# 2. 모델 설치
ollama pull qwen2.5:7b

# 3. 로컬 테스트 실행
node scripts/test-ollama-local.js

# 4. 개발 서버 시작
npm run dev
```

### 2. Render 배포
1. **Ollama 서버 배포**
   - Render Dashboard에서 새 Web Service 생성
   - Docker 환경 선택
   - Dockerfile.ollama 사용
   - 무료 티어 선택

2. **Next.js 앱 배포**
   - Render Dashboard에서 새 Web Service 생성
   - Node.js 환경 선택
   - 환경 변수 설정 (Ollama URL 포함)
   - 무료 티어 선택

### 3. 환경 변수 설정
```env
# .env.local (로컬 개발용)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:7b

# Render 환경 변수
OLLAMA_BASE_URL=https://meta-faq-ollama.onrender.com
OLLAMA_MODEL=qwen2.5:7b
```

## 🚨 주의사항

### 1. 무료 티어 제한
- **슬립 모드**: 15분 비활성 시 자동 슬립
- **메모리**: Ollama 1GB, Next.js 512MB
- **CPU**: 0.1 CPU (응답 속도 느림)
- **월 사용량**: 750시간

### 2. 성능 최적화
- 첫 요청 시 30-60초 지연 (슬립에서 깨어남)
- Keep-alive 스크립트로 슬립 방지
- 사용자에게 로딩 상태 표시

### 3. 모니터링
- Render Dashboard에서 리소스 사용량 확인
- 헬스체크 API로 서비스 상태 모니터링
- 에러 로그 실시간 확인

## 🔧 문제 해결

### 1. Ollama 서버 문제
- 모델 다운로드 실패: `ollama pull qwen2.5:7b`
- 메모리 부족: 모델 크기 줄이기
- 응답 속도: CPU 제한으로 인한 지연

### 2. Next.js 앱 문제
- 환경 변수 누락: Render Dashboard에서 확인
- CORS 오류: Ollama URL 확인
- 빌드 실패: 의존성 문제 확인

### 3. 네트워크 문제
- 서비스 간 통신 실패: URL 확인
- 타임아웃: Keep-alive 스크립트 실행
- SSL 인증서: Render 자동 처리

## 📊 성능 벤치마크

### 1. 로컬 환경
- Ollama 응답 시간: 2-5초
- Next.js 빌드 시간: 1-2분
- 메모리 사용량: Ollama 1GB, Next.js 200MB

### 2. Render 환경
- Ollama 응답 시간: 10-30초 (슬립 모드)
- Next.js 응답 시간: 1-3초
- 슬립에서 깨어남: 30-60초

## 🎯 성공 기준

### 1. 기능 테스트
- [ ] 챗봇 질문/답변 정상 작동
- [ ] RAG 검색 정상 작동
- [ ] 관련 리소스 표시 정상
- [ ] 히스토리 기능 정상

### 2. 성능 테스트
- [ ] 평균 응답 시간 30초 이내
- [ ] 메모리 사용량 안정적
- [ ] 에러율 5% 이하
- [ ] 가용성 95% 이상

### 3. 사용자 경험
- [ ] 로딩 상태 표시
- [ ] 에러 메시지 명확
- [ ] 반응형 디자인
- [ ] 접근성 준수

이 체크리스트를 따라하면 Ollama 기반 챗봇을 Render에 성공적으로 배포할 수 있습니다.
