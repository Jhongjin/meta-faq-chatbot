import { NextRequest, NextResponse } from 'next/server';
import { EmailAlertService } from '@/lib/services/EmailAlertService';

export async function POST(request: NextRequest) {
  try {
    const logData = await request.json();

    // 필수 필드 검증
    if (!logData.log_id || !logData.log_level || !logData.log_message) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 로그 데이터 저장 (실제로는 데이터베이스에 저장)
    console.log('새 로그 생성:', logData);

    // 경고 또는 오류 로그인 경우 알림 생성
    if (EmailAlertService.shouldSendAlert(logData.log_level)) {
      await EmailAlertService.createOrUpdateAlert({
        log_id: logData.log_id,
        log_level: logData.log_level,
        log_type: logData.log_type || 'system',
        log_message: logData.log_message,
        log_timestamp: logData.log_timestamp || new Date().toISOString(),
        user_id: logData.user_id,
        ip_address: logData.ip_address
      });

      console.log(`📧 ${logData.log_level} 로그 알림이 생성되었습니다: ${logData.log_id}`);
    }

    return NextResponse.json({
      success: true,
      message: '로그가 성공적으로 생성되었습니다.',
      data: logData
    });

  } catch (error) {
    console.error('로그 생성 실패:', error);
    return NextResponse.json(
      { error: '로그 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}


