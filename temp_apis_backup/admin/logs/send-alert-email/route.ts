import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const { to, subject, content, alertId } = await request.json();

    if (!to || !subject || !content) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 이메일 발송 설정 (실제 환경에서는 환경변수로 설정)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // 이메일 발송
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: to,
      subject: subject,
      html: content,
    };

    // 실제 이메일 발송 (개발 환경에서는 콘솔에만 출력)
    if (process.env.NODE_ENV === 'production') {
      await transporter.sendMail(mailOptions);
      console.log(`✅ 이메일 발송 완료: ${to} - ${subject}`);
    } else {
      console.log('📧 [개발 모드] 이메일 발송 시뮬레이션:');
      console.log('To:', to);
      console.log('Subject:', subject);
      console.log('Content:', content.substring(0, 200) + '...');
    }

    return NextResponse.json({
      success: true,
      message: '이메일이 성공적으로 발송되었습니다.',
      alertId: alertId
    });

  } catch (error) {
    console.error('이메일 발송 실패:', error);
    return NextResponse.json(
      { error: '이메일 발송에 실패했습니다.' },
      { status: 500 }
    );
  }
}
