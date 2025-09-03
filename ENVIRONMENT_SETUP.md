# 환경 변수 설정 가이드

## 필수 환경 변수

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 변수들을 설정하세요:

```env
# Supabase 설정 (필수)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Supabase 설정 방법

1. [Supabase](https://supabase.com)에 로그인
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. Settings > API에서 다음 정보 확인:
   - Project URL: `NEXT_PUBLIC_SUPABASE_URL`에 설정
   - anon public key: `NEXT_PUBLIC_SUPABASE_ANON_KEY`에 설정
   - service_role secret key: `SUPABASE_SERVICE_ROLE_KEY`에 설정

## 비밀번호 변경 기능 테스트

환경 변수가 올바르게 설정된 후:

1. 개발 서버 재시작: `npm run dev`
2. 브라우저 개발자 도구 콘솔 열기
3. 비밀번호 변경 시도
4. Toast 알림 확인 (화면 우측 상단)
5. 콘솔 로그 확인하여 오류 메시지 확인

### Toast 알림 시스템
- 성공 시: 초록색 체크마크와 함께 성공 메시지
- 실패 시: 빨간색 X와 함께 오류 메시지
- 로딩 시: 파란색 로딩 스피너와 함께 진행 메시지

## 문제 해결

### "Invalid API key" 오류
- 환경 변수가 올바르게 설정되었는지 확인
- Supabase 프로젝트의 API 키가 유효한지 확인

### "User not found" 오류
- 사용자가 Supabase Auth에 등록되어 있는지 확인
- 이메일 주소가 정확한지 확인

### 비밀번호 변경이 적용되지 않는 경우
- 현재 비밀번호가 정확한지 확인
- 새 비밀번호가 6자 이상인지 확인
- 브라우저 콘솔의 오류 메시지 확인
