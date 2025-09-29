# 📧 로그 오류 알림 시스템 가이드

## 🎯 시스템 개요

Meta 광고 FAQ AI 챗봇에서 발생하는 오류와 경고를 자동으로 감지하고 관리자에게 이메일로 알림을 발송하는 시스템입니다.

## 🔧 구현된 기능

### 1. 자동 오류 감지
- **로그 레벨**: `warning`, `error` 로그 자동 감지
- **실시간 처리**: 로그 생성 시 즉시 알림 생성
- **중복 방지**: 동일한 로그 ID에 대한 중복 알림 방지

### 2. 이메일 알림 발송
- **대상**: `adso@nasmedia.co.kr` (환경 변수로 설정 가능)
- **발송 주기**: 1시간마다 재발송 (관리자 확인 전까지)
- **HTML 이메일**: 구조화된 HTML 형식으로 발송
- **발송 서비스**: SendGrid 연동 (API 키 설정 시)

### 3. 관리자 대시보드
- **실시간 알림**: 로그 페이지에서 활성 알림 표시
- **알림 확인**: 클릭 한 번으로 알림 확인 및 재발송 중단
- **상세 정보**: 로그 ID, 발생 시간, 사용자 정보 등 표시

### 4. 자동화된 처리
- **크론 작업**: 15분마다 대기 중인 알림 자동 처리
- **상태 관리**: pending → acknowledged → resolved 상태 추적
- **발송 이력**: 발송 횟수 및 시간 기록

## 🚀 사용 방법

### 1. 환경 변수 설정

```bash
# 필수 설정
ALERT_FROM_EMAIL=noreply@nasmedia.co.kr
ALERT_TO_EMAIL=adso@nasmedia.co.kr
NEXT_PUBLIC_SITE_URL=https://your-domain.com
CRON_SECRET=your_cron_secret_key

# SendGrid 설정 (실제 이메일 발송용)
SENDGRID_API_KEY=your_sendgrid_api_key
```

### 2. 테스트 방법

#### 방법 1: 관리자 페이지에서 테스트
1. `/admin/logs` 페이지 접속
2. "테스트 로그" 버튼 클릭
3. 콘솔에서 이메일 발송 로그 확인

#### 방법 2: API 직접 호출
```bash
curl -X POST http://localhost:3000/api/admin/logs/test-alert
```

### 3. 실제 오류 발생 시
- 시스템에서 `warning` 또는 `error` 레벨 로그 생성
- 자동으로 알림 생성 및 이메일 발송
- 관리자가 `/admin/logs`에서 확인 가능

## 📊 알림 상태

| 상태 | 설명 | 동작 |
|------|------|------|
| `pending` | 대기 중 | 1시간마다 이메일 재발송 |
| `acknowledged` | 확인됨 | 재발송 중단, 관리자가 확인함 |
| `resolved` | 해결됨 | 완전히 해결된 상태 |

## 🔄 크론 작업

Vercel에서 자동으로 15분마다 실행됩니다:

```json
{
  "crons": [
    {
      "path": "/api/admin/logs/process-alerts",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

## 📧 이메일 템플릿

발송되는 이메일에는 다음 정보가 포함됩니다:

- 🚨/⚠️ 로그 레벨별 아이콘
- 📝 상세한 로그 메시지
- 🕐 발생 시간 및 발송 횟수
- 👤 사용자 정보 (있는 경우)
- 🌐 IP 주소 (있는 경우)
- 🔗 관리자 페이지 링크
- ✅ 알림 확인 버튼

## 🛠️ 문제 해결

### 이메일이 발송되지 않는 경우
1. `SENDGRID_API_KEY` 환경 변수 확인
2. SendGrid 계정에서 발신자 이메일 인증 확인
3. 콘솔 로그에서 오류 메시지 확인

### 알림이 생성되지 않는 경우
1. 로그 레벨이 `warning` 또는 `error`인지 확인
2. 데이터베이스 연결 상태 확인
3. `log_alerts` 테이블 존재 여부 확인

### 크론 작업이 실행되지 않는 경우
1. Vercel 배포 상태 확인
2. `CRON_SECRET` 환경 변수 설정 확인
3. Vercel 대시보드에서 크론 작업 로그 확인

## 📈 모니터링

### 로그 확인
```bash
# 개발 환경
npm run dev

# 프로덕션 환경 (Vercel)
vercel logs
```

### 데이터베이스 확인
```sql
-- 활성 알림 조회
SELECT * FROM log_alerts WHERE alert_status = 'pending';

-- 알림 통계
SELECT 
  log_level,
  COUNT(*) as count,
  AVG(email_count) as avg_emails
FROM log_alerts 
GROUP BY log_level;
```

## 🔐 보안 고려사항

1. **API 키 보안**: SendGrid API 키는 환경 변수로만 관리
2. **크론 인증**: `CRON_SECRET`으로 크론 작업 인증
3. **이메일 스푸핑 방지**: 발신자 이메일 도메인 인증 필요
4. **개인정보 보호**: IP 주소 등 민감 정보 마스킹 고려

## 🎉 완성된 시스템

이제 Meta 광고 FAQ AI 챗봇에서 발생하는 모든 오류와 경고가 자동으로 관리자에게 알림되며, 관리자는 실시간으로 시스템 상태를 모니터링하고 문제를 신속하게 해결할 수 있습니다!
