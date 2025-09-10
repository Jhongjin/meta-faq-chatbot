/**
 * Keep-alive 스크립트
 * Render의 슬립 모드를 방지하기 위해 주기적으로 헬스체크를 수행합니다.
 */

const KEEP_ALIVE_INTERVAL = 10 * 60 * 1000; // 10분마다 실행
const HEALTH_CHECK_URL = process.env.HEALTH_CHECK_URL || 'https://meta-faq-app.onrender.com/api/health';

async function performHealthCheck() {
  try {
    console.log(`🔄 헬스체크 수행 중: ${new Date().toISOString()}`);
    
    const response = await fetch(HEALTH_CHECK_URL, {
      method: 'GET',
      headers: {
        'User-Agent': 'Keep-Alive-Script/1.0'
      },
      signal: AbortSignal.timeout(30000) // 30초 타임아웃
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ 헬스체크 성공: ${data.status} (${data.responseTime}ms)`);
    } else {
      console.warn(`⚠️ 헬스체크 실패: HTTP ${response.status}`);
    }
  } catch (error) {
    console.error(`❌ 헬스체크 오류: ${error.message}`);
  }
}

// 주기적으로 헬스체크 수행
setInterval(performHealthCheck, KEEP_ALIVE_INTERVAL);

// 시작 시 즉시 한 번 실행
performHealthCheck();

console.log(`🚀 Keep-alive 스크립트 시작됨 (${KEEP_ALIVE_INTERVAL / 1000}초 간격)`);
