# Vultr+Ollama 배포 가이드

## 📋 개요

이 가이드는 Meta 광고 FAQ AI 챗봇을 Vultr VPS + Ollama 환경에서 독립적으로 배포하는 방법을 설명합니다.

## 🏗️ 아키텍처

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Vercel        │    │   Vultr VPS     │    │   Supabase      │
│   (Frontend)    │◄──►│   (Ollama)      │◄──►│   (Database)    │
│                 │    │                 │    │                 │
│ - Next.js App   │    │ - Ollama Server │    │ - PostgreSQL    │
│ - API Routes    │    │ - Nginx Proxy   │    │ - pgvector      │
│ - Static Files  │    │ - Models        │    │ - Auth          │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 1단계: Vultr VPS 설정

### 1.1 서버 생성
1. [Vultr](https://www.vultr.com) 계정 생성
2. 새 서버 생성:
   - **OS**: Ubuntu 22.04 LTS
   - **Plan**: $6/month (1GB RAM) 또는 $12/month (2GB RAM)
   - **Location**: 서울 또는 도쿄 (한국에서 가까운 곳)
   - **Additional Features**: IPv6, Private Networking

### 1.2 서버 접속
```bash
# SSH 키로 접속
ssh root@your-server-ip

# 또는 패스워드로 접속
ssh root@your-server-ip
```

### 1.3 시스템 업데이트
```bash
apt update && apt upgrade -y
```

## 🔧 2단계: Ollama 설치

### 2.1 Ollama 설치
```bash
# Ollama 설치
curl -fsSL https://ollama.ai/install.sh | sh

# Ollama 서비스 시작
systemctl start ollama
systemctl enable ollama

# 상태 확인
systemctl status ollama
```

### 2.2 모델 다운로드
```bash
# 작은 모델 (1GB RAM 권장)
ollama pull tinyllama:1.1b

# 중간 모델 (2GB RAM 권장)
ollama pull llama2:7b
ollama pull mistral:7b

# 모델 목록 확인
ollama list
```

### 2.3 Ollama 테스트
```bash
# 로컬에서 테스트
ollama run tinyllama:1.1b "Hello, how are you?"

# API 테스트
curl http://localhost:11434/api/tags
```

## 🌐 3단계: Nginx 설정

### 3.1 Nginx 설치
```bash
apt install nginx -y
systemctl start nginx
systemctl enable nginx
```

### 3.2 Nginx 설정 파일 생성
```bash
nano /etc/nginx/sites-available/ollama
```

다음 내용을 추가:
```nginx
server {
    listen 80;
    server_name your-domain.com;  # 도메인이 있다면

    location /ollama/ {
        proxy_pass http://localhost:11434/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS 헤더 추가
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range' always;
        
        # OPTIONS 요청 처리
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '*';
            add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
            add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range';
            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Type' 'text/plain; charset=utf-8';
            add_header 'Content-Length' 0;
            return 204;
        }
    }
}
```

### 3.3 설정 활성화
```bash
# 심볼릭 링크 생성
ln -s /etc/nginx/sites-available/ollama /etc/nginx/sites-enabled/

# 기본 설정 비활성화
rm /etc/nginx/sites-enabled/default

# 설정 테스트
nginx -t

# Nginx 재시작
systemctl restart nginx
```

## 🔥 4단계: 방화벽 설정

### 4.1 UFW 설정
```bash
# UFW 활성화
ufw enable

# SSH 포트 허용
ufw allow ssh

# HTTP 포트 허용
ufw allow 80

# HTTPS 포트 허용 (SSL 인증서가 있다면)
ufw allow 443

# Ollama 포트 허용 (선택사항 - Nginx를 통해 접근하므로 불필요)
# ufw allow 11434

# 상태 확인
ufw status
```

## 🚀 5단계: Vercel 배포

### 5.1 GitHub 저장소 생성
1. GitHub에서 새 저장소 생성: `meta-faq-ollama`
2. 현재 코드 푸시:
```bash
git remote add origin https://github.com/your-username/meta-faq-ollama.git
git branch -M main
git push -u origin main
```

### 5.2 Vercel 프로젝트 생성
1. [Vercel](https://vercel.com) 계정에 로그인
2. "New Project" 클릭
3. GitHub 저장소 연결
4. 프로젝트 설정:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### 5.3 환경 변수 설정
Vercel 대시보드에서 다음 환경 변수들을 설정:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Ollama (Vultr VPS)
OLLAMA_BASE_URL=https://your-vultr-server-ip/ollama
OLLAMA_DEFAULT_MODEL=tinyllama:1.1b

# 기타 설정
EMBEDDING_DIM=1024
TOP_K=5
```

## ✅ 6단계: 테스트 및 검증

### 6.1 Ollama 서버 테스트
```bash
# Vultr 서버에서
curl http://localhost:11434/api/tags

# 외부에서 (Vercel에서)
curl https://your-vultr-server-ip/ollama/api/tags
```

### 6.2 Vercel 앱 테스트
1. 배포된 Vercel URL 접속
2. 채팅 기능 테스트
3. RAG 검색 기능 테스트
4. 에러 로그 확인

### 6.3 성능 모니터링
```bash
# Vultr 서버 리소스 모니터링
htop

# Ollama 로그 확인
journalctl -u ollama -f

# Nginx 로그 확인
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

## 🔧 7단계: 최적화 및 보안

### 7.1 SSL 인증서 설정 (선택사항)
```bash
# Certbot 설치
apt install certbot python3-certbot-nginx -y

# SSL 인증서 발급 (도메인이 있는 경우)
certbot --nginx -d your-domain.com

# 자동 갱신 설정
crontab -e
# 다음 라인 추가:
# 0 12 * * * /usr/bin/certbot renew --quiet
```

### 7.2 Ollama 최적화
```bash
# Ollama 설정 파일 생성
mkdir -p /etc/ollama
nano /etc/ollama/ollama.conf
```

다음 내용 추가:
```ini
# Ollama 설정
OLLAMA_HOST=0.0.0.0:11434
OLLAMA_ORIGINS=*
OLLAMA_MODELS=/root/.ollama/models
OLLAMA_KEEP_ALIVE=24h
OLLAMA_NUM_PARALLEL=1
OLLAMA_MAX_LOADED_MODELS=1
```

### 7.3 모니터링 스크립트
```bash
# 헬스체크 스크립트 생성
nano /usr/local/bin/ollama-healthcheck.sh
```

다음 내용 추가:
```bash
#!/bin/bash
# Ollama 헬스체크 스크립트

if curl -s http://localhost:11434/api/tags > /dev/null; then
    echo "$(date): Ollama is running" >> /var/log/ollama-health.log
else
    echo "$(date): Ollama is down, restarting..." >> /var/log/ollama-health.log
    systemctl restart ollama
fi
```

```bash
# 실행 권한 부여
chmod +x /usr/local/bin/ollama-healthcheck.sh

# 크론 작업 추가
crontab -e
# 다음 라인 추가 (5분마다 실행):
# */5 * * * * /usr/local/bin/ollama-healthcheck.sh
```

## 🚨 문제 해결

### 일반적인 문제들

1. **Ollama 연결 실패**
   - 방화벽 설정 확인
   - Nginx 설정 확인
   - Ollama 서비스 상태 확인

2. **모델 로딩 실패**
   - 메모리 부족 확인
   - 모델 크기와 서버 사양 확인
   - 더 작은 모델 사용 고려

3. **CORS 오류**
   - Nginx CORS 헤더 설정 확인
   - Vercel 환경 변수 확인

4. **성능 문제**
   - 서버 리소스 모니터링
   - 모델 최적화 설정
   - 캐싱 전략 적용

## 📊 비용 분석

### Vultr VPS 비용
- **$6/month**: 1GB RAM, 1 CPU (tinyllama 권장)
- **$12/month**: 2GB RAM, 1 CPU (llama2 권장)
- **$24/month**: 4GB RAM, 2 CPU (더 큰 모델)

### Vercel 비용
- **무료 플랜**: 개인 프로젝트용
- **Pro 플랜**: $20/month (팀 프로젝트용)

### 총 예상 비용
- **최소**: $6/month (Vultr) + $0/month (Vercel 무료)
- **권장**: $12/month (Vultr) + $0/month (Vercel 무료)

## 🎯 다음 단계

1. **도메인 연결**: 사용자 친화적인 URL 설정
2. **SSL 인증서**: HTTPS 보안 연결
3. **모니터링**: 시스템 상태 실시간 모니터링
4. **백업**: 데이터베이스 정기 백업
5. **확장**: 더 큰 모델이나 추가 기능 구현

---

이 가이드를 따라하면 Vultr+Ollama 기반의 독립적인 AI 챗봇 시스템을 구축할 수 있습니다.


