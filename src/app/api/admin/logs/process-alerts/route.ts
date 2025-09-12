import { NextRequest, NextResponse } from 'next/server';
import { EmailAlertService } from '@/lib/services/EmailAlertService';

export async function POST(request: NextRequest) {
  try {
    // 인증 확인 (실제 환경에서는 적절한 인증 로직 추가)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    console.log('🔄 로그 알림 처리 작업 시작...');
    
    // 대기 중인 알림들 처리
    await EmailAlertService.processPendingAlerts();
    
    console.log('✅ 로그 알림 처리 작업 완료');

    return NextResponse.json({
      success: true,
      message: '알림 처리 작업이 완료되었습니다.',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('알림 처리 작업 실패:', error);
    return NextResponse.json(
      { error: '알림 처리 작업에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// GET 요청으로도 처리 가능 (테스트용)
export async function GET(request: NextRequest) {
  try {
    console.log('🔄 로그 알림 처리 작업 시작 (GET)...');
    
    await EmailAlertService.processPendingAlerts();
    
    console.log('✅ 로그 알림 처리 작업 완료 (GET)');

    return NextResponse.json({
      success: true,
      message: '알림 처리 작업이 완료되었습니다.',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('알림 처리 작업 실패:', error);
    return NextResponse.json(
      { error: '알림 처리 작업에 실패했습니다.' },
      { status: 500 }
    );
  }
}


