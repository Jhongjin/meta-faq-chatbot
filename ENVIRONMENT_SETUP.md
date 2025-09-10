# 환경 변수 설정 가이드

## 문제 해결: Supabase 환경 변수 누락

현재 발생하고 있는 문제는 Supabase 환경 변수가 설정되지 않아서 API가 405 오류를 반환하는 것입니다.

## 해결 방법

### 1. .env.local 파일 수정

`.env.local` 파일에 다음 Supabase 환경 변수를 추가하세요:

```env
# Supabase 설정 (필수)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 2. Supabase 프로젝트 설정

1. **Supabase 대시보드** 접속: https://supabase.com/dashboard
2. **프로젝트 선택** → **Settings** → **API**
3. 다음 값들을 복사하여 `.env.local`에 설정:
   - **Project URL**: `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role**: `SUPABASE_SERVICE_ROLE_KEY`

### 3. 환경 변수 확인

환경 변수가 올바르게 설정되었는지 확인하려면:

```bash
# 개발 서버 재시작
npm run dev
```

브라우저 콘솔에서 다음 로그를 확인하세요:
- `✅ RAGSearchService 초기화 완료`
- `🔧 환경 변수 상태: { hasSupabaseUrl: true, hasSupabaseKey: true }`

### 4. 문제 해결 체크리스트

- [ ] `.env.local` 파일이 프로젝트 루트에 있는가?
- [ ] Supabase URL이 올바른 형식인가? (`https://xxx.supabase.co`)
- [ ] API 키가 올바르게 복사되었는가?
- [ ] 개발 서버를 재시작했는가?
- [ ] 브라우저 캐시를 지웠는가?

### 5. 추가 디버깅

문제가 지속되면 브라우저 개발자 도구의 Network 탭에서:
1. `/api/chatbot` 요청을 확인
2. 응답 상태 코드 확인
3. 응답 본문 내용 확인

## 보안 주의사항

- `.env.local` 파일은 절대 Git에 커밋하지 마세요
- API 키를 공개하지 마세요
- 프로덕션 환경에서는 Vercel 환경 변수 설정을 사용하세요
