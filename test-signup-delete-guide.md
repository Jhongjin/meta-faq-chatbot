# 회원가입/회원탈퇴 Supabase 동기화 테스트 가이드

## 개요
현재 Supabase 테이블에 woolela 사용자 데이터가 없는 상태에서 회원가입 후 회원탈퇴를 통해 정상적으로 Supabase와 동기화되는지 체크하는 테스트 환경을 구축했습니다.

## 생성된 테스트 API 엔드포인트

### 1. 회원가입 테스트 API
- **URL**: `POST /api/test/signup`
- **기능**: 테스트용 사용자 회원가입
- **요청 본문**:
  ```json
  {
    "email": "testuser@nasmedia.co.kr",
    "password": "testpass123!",
    "name": "테스트사용자"
  }
  ```
- **응답**: Auth 사용자 생성 및 Profile 테이블 트리거 작동 확인

### 2. 회원탈퇴 테스트 API
- **URL**: `POST /api/test/delete`
- **기능**: 테스트용 사용자 회원탈퇴
- **요청 본문**:
  ```json
  {
    "email": "testuser@nasmedia.co.kr"
  }
  ```
- **응답**: Auth 사용자 삭제 및 CASCADE 작동 확인

### 3. 사용자 상태 확인 API
- **URL**: `GET /api/test/status?email={email}`
- **기능**: 특정 사용자의 상태 확인
- **응답**: Auth, Profile, Admin 테이블의 사용자 데이터 상태

### 4. 전체 사용자 목록 확인 API
- **URL**: `POST /api/test/status`
- **기능**: 모든 사용자 목록 및 데이터 일관성 확인
- **응답**: 전체 사용자 현황 및 고아 데이터 확인

## 테스트 실행 방법

### 1. 자동 테스트 스크립트 실행
```bash
# 1. 개발 서버 실행
npm run dev

# 2. 새 터미널에서 테스트 스크립트 실행
node test-signup-delete-flow.js
```

### 2. 수동 테스트 (개별 API 호출)

#### 회원가입 테스트
```bash
curl -X POST http://localhost:3000/api/test/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@nasmedia.co.kr",
    "password": "testpass123!",
    "name": "테스트사용자"
  }'
```

#### 상태 확인
```bash
curl "http://localhost:3000/api/test/status?email=testuser@nasmedia.co.kr"
```

#### 회원탈퇴 테스트
```bash
curl -X POST http://localhost:3000/api/test/delete \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@nasmedia.co.kr"
  }'
```

#### 최종 상태 확인
```bash
curl "http://localhost:3000/api/test/status?email=testuser@nasmedia.co.kr"
```

## 테스트 검증 항목

### 1. 회원가입 검증
- [ ] `auth.users` 테이블에 사용자 생성
- [ ] `profiles` 테이블에 프로필 자동 생성 (트리거 작동)
- [ ] 이메일 중복 확인 정상 작동
- [ ] 사용자 메타데이터 정상 저장

### 2. 회원탈퇴 검증
- [ ] `auth.users` 테이블에서 사용자 삭제
- [ ] `profiles` 테이블에서 프로필 자동 삭제 (CASCADE)
- [ ] 관련 데이터 (conversations, feedback, messages) 삭제
- [ ] 관리자 권한 데이터 삭제

### 3. 데이터 일관성 검증
- [ ] Auth 사용자와 Profile 데이터 일치
- [ ] 고아 데이터 없음
- [ ] 트리거 정상 작동
- [ ] CASCADE 정상 작동

## 예상 결과

### 성공적인 테스트 결과
```
🎉 모든 테스트 통과! Supabase 동기화가 정상적으로 작동합니다.

회원가입 성공: ✅
회원탈퇴 성공: ✅
최종 정리 완료: ✅
```

### 실패 시 확인 사항
1. **환경 변수 확인**: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
2. **Supabase 연결 확인**: 네트워크 및 인증 키 유효성
3. **트리거 확인**: `handle_new_user()` 함수 및 `on_auth_user_created` 트리거
4. **RLS 정책 확인**: profiles 테이블의 Row Level Security 정책

## 문제 해결

### 트리거가 작동하지 않는 경우
```sql
-- 트리거 재생성
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### CASCADE가 작동하지 않는 경우
```sql
-- 외래 키 제약 조건 확인
SELECT 
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM 
  information_schema.table_constraints AS tc 
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE constraint_type = 'FOREIGN KEY' 
  AND tc.table_name='profiles';
```

## 정리

테스트 완료 후 생성된 테스트 API들은 실제 운영 환경에서는 제거해야 합니다. 이 테스트를 통해 Supabase와의 동기화가 정상적으로 작동하는지 확인할 수 있습니다.
