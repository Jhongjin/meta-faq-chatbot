# Railway 상태 확인 스크립트 (타임아웃 포함)
Write-Host "=== Railway 배포 상태 확인 ===" -ForegroundColor Green

# 1. 서비스 상태 확인
Write-Host "`n1. 서비스 상태 확인..." -ForegroundColor Yellow
try {
    $status = railway status 2>&1
    Write-Host $status
} catch {
    Write-Host "상태 확인 실패: $_" -ForegroundColor Red
}

# 2. 환경변수 확인
Write-Host "`n2. 환경변수 확인..." -ForegroundColor Yellow
try {
    $vars = railway variables 2>&1 | Select-String "PORT|OLLAMA|SUPABASE"
    Write-Host $vars
} catch {
    Write-Host "환경변수 확인 실패: $_" -ForegroundColor Red
}

# 3. 서비스 응답 테스트
Write-Host "`n3. 서비스 응답 테스트..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://ad-mate.railway.app/" -TimeoutSec 10 -ErrorAction Stop
    Write-Host "HTTP Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($response.Content)" -ForegroundColor Green
} catch {
    Write-Host "서비스 응답 테스트 실패: $_" -ForegroundColor Red
}

Write-Host "`n=== 확인 완료 ===" -ForegroundColor Green
