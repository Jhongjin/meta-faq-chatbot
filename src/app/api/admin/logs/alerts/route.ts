import { NextRequest, NextResponse } from 'next/server';
import { EmailAlertService } from '@/lib/services/EmailAlertService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const result = await EmailAlertService.getAlerts(status || undefined, limit, offset);

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('알림 목록 조회 실패:', error);
    return NextResponse.json(
      { error: '알림 목록 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, alertId, acknowledgedBy } = await request.json();

    if (!action || !alertId) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      );
    }

    let success = false;

    switch (action) {
      case 'acknowledge':
        if (!acknowledgedBy) {
          return NextResponse.json(
            { error: '확인자 정보가 필요합니다.' },
            { status: 400 }
          );
        }
        success = await EmailAlertService.acknowledgeAlert(alertId, acknowledgedBy);
        break;
      
      case 'resolve':
        success = await EmailAlertService.resolveAlert(alertId);
        break;
      
      default:
        return NextResponse.json(
          { error: '지원하지 않는 액션입니다.' },
          { status: 400 }
        );
    }

    if (success) {
      return NextResponse.json({
        success: true,
        message: `알림이 성공적으로 ${action === 'acknowledge' ? '확인' : '해결'}되었습니다.`
      });
    } else {
      return NextResponse.json(
        { error: '알림 처리에 실패했습니다.' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('알림 처리 실패:', error);
    return NextResponse.json(
      { error: '알림 처리에 실패했습니다.' },
      { status: 500 }
    );
  }
}


